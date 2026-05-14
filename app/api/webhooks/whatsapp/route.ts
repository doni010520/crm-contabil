import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AdminClient = SupabaseClient<any, "public", any>;

// ---------------------------------------------------------------------------
// Supabase admin client (service role — bypasses RLS)
// ---------------------------------------------------------------------------
function getAdminClient(): AdminClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// ---------------------------------------------------------------------------
// GET — Webhook verification (Meta challenge)
// ---------------------------------------------------------------------------
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const verifyToken =
    process.env.WHATSAPP_VERIFY_TOKEN ?? "crm-contabil-webhook-verify";

  if (mode === "subscribe" && token === verifyToken) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

// ---------------------------------------------------------------------------
// POST — Receive messages & status updates
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (body.object !== "whatsapp_business_account") {
      return NextResponse.json({ error: "Not a WhatsApp event" }, { status: 400 });
    }

    const supabase = getAdminClient();

    for (const entry of body.entry ?? []) {
      for (const change of entry.changes ?? []) {
        if (change.field !== "messages") continue;

        const value = change.value;
        const phoneNumberId = value?.metadata?.phone_number_id;

        if (!phoneNumberId) continue;

        // Find tenant by whatsapp_phone_id
        const { data: tenant } = await supabase
          .from("tenants")
          .select("id")
          .eq("whatsapp_phone_id", phoneNumberId)
          .maybeSingle();

        if (!tenant) continue;

        // --- Handle incoming messages ---
        for (const msg of value.messages ?? []) {
          await handleIncomingMessage(supabase, tenant.id, msg);
        }

        // --- Handle status updates ---
        for (const status of value.statuses ?? []) {
          await handleStatusUpdate(supabase, tenant.id, status);
        }
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("[WhatsApp Webhook] Error:", error);
    return NextResponse.json({ success: true }, { status: 200 });
  }
}

// ---------------------------------------------------------------------------
// Handle an incoming message
// ---------------------------------------------------------------------------
async function handleIncomingMessage(
  supabase: AdminClient,
  tenantId: string,
  msg: {
    from: string;
    id: string;
    timestamp: string;
    type: string;
    text?: { body: string };
    image?: { id: string; mime_type: string; caption?: string };
    audio?: { id: string; mime_type: string };
    video?: { id: string; mime_type: string; caption?: string };
    document?: { id: string; mime_type: string; filename?: string; caption?: string };
    sticker?: { id: string; mime_type: string };
    location?: { latitude: number; longitude: number; name?: string; address?: string };
    reaction?: { message_id: string; emoji: string };
  }
) {
  const senderPhone = msg.from;
  const waChatId = senderPhone;

  // Find or create contact by phone
  let contactId: string | null = null;
  const { data: existingContact } = await supabase
    .from("contacts")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("phone", senderPhone)
    .maybeSingle();

  if (existingContact) {
    contactId = existingContact.id;
  } else {
    const { data: newContact } = await supabase
      .from("contacts")
      .insert({
        tenant_id: tenantId,
        name: senderPhone,
        phone: senderPhone,
        type: "lead",
        source: "whatsapp",
      })
      .select("id")
      .single();

    contactId = newContact?.id ?? null;
  }

  // Find or create conversation
  let conversationId: string;
  const { data: existingConv } = await supabase
    .from("conversations")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("wa_chat_id", waChatId)
    .maybeSingle();

  if (existingConv) {
    conversationId = existingConv.id;
  } else {
    const { data: newConv } = await supabase
      .from("conversations")
      .insert({
        tenant_id: tenantId,
        contact_id: contactId,
        wa_chat_id: waChatId,
        status: "open",
        last_message_at: new Date().toISOString(),
        unread_count: 0,
      })
      .select("id")
      .single();

    if (!newConv) return;
    conversationId = newConv.id;
  }

  // Extract body and media based on message type
  const messageType = mapMessageType(msg.type);
  let body: string | null = null;
  let mediaUrl: string | null = null;
  const metadata: Record<string, unknown> = {};

  switch (msg.type) {
    case "text":
      body = msg.text?.body ?? null;
      break;
    case "image":
      body = msg.image?.caption ?? null;
      mediaUrl = msg.image?.id ?? null;
      metadata.mime_type = msg.image?.mime_type;
      break;
    case "audio":
      mediaUrl = msg.audio?.id ?? null;
      metadata.mime_type = msg.audio?.mime_type;
      break;
    case "video":
      body = msg.video?.caption ?? null;
      mediaUrl = msg.video?.id ?? null;
      metadata.mime_type = msg.video?.mime_type;
      break;
    case "document":
      body = msg.document?.caption ?? msg.document?.filename ?? null;
      mediaUrl = msg.document?.id ?? null;
      metadata.mime_type = msg.document?.mime_type;
      metadata.filename = msg.document?.filename;
      break;
    case "sticker":
      mediaUrl = msg.sticker?.id ?? null;
      metadata.mime_type = msg.sticker?.mime_type;
      break;
    case "location":
      body = msg.location?.name ?? msg.location?.address ?? null;
      metadata.latitude = msg.location?.latitude;
      metadata.longitude = msg.location?.longitude;
      break;
    case "reaction":
      body = msg.reaction?.emoji ?? null;
      metadata.reacted_message_id = msg.reaction?.message_id;
      break;
  }

  // Insert message
  await supabase.from("messages").insert({
    tenant_id: tenantId,
    conversation_id: conversationId,
    wa_message_id: msg.id,
    direction: "inbound",
    type: messageType,
    body,
    media_url: mediaUrl,
    status: "delivered",
    metadata,
    created_at: new Date(Number(msg.timestamp) * 1000).toISOString(),
  });

  // Update conversation: bump last_message_at and increment unread_count
  const { data: currentConv } = await supabase
    .from("conversations")
    .select("unread_count")
    .eq("id", conversationId)
    .single();

  await supabase
    .from("conversations")
    .update({
      last_message_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      unread_count: ((currentConv?.unread_count as number) ?? 0) + 1,
      status: "open",
    })
    .eq("id", conversationId);
}

// ---------------------------------------------------------------------------
// Handle a status update (sent, delivered, read, failed)
// ---------------------------------------------------------------------------
async function handleStatusUpdate(
  supabase: AdminClient,
  tenantId: string,
  status: { id: string; status: string; timestamp: string; errors?: { code: number; title: string }[] }
) {
  const statusMap: Record<string, string> = {
    sent: "sent",
    delivered: "delivered",
    read: "read",
    failed: "failed",
  };

  const mappedStatus = statusMap[status.status];
  if (!mappedStatus) return;

  const updateData: Record<string, unknown> = { status: mappedStatus };
  if (status.errors && status.errors.length > 0) {
    updateData.metadata = { errors: status.errors };
  }

  await supabase
    .from("messages")
    .update(updateData)
    .eq("wa_message_id", status.id)
    .eq("tenant_id", tenantId);
}

// ---------------------------------------------------------------------------
// Map WhatsApp message types to our enum
// ---------------------------------------------------------------------------
function mapMessageType(waType: string): string {
  const map: Record<string, string> = {
    text: "text",
    image: "image",
    audio: "audio",
    video: "video",
    document: "document",
    sticker: "sticker",
    location: "location",
    reaction: "reaction",
    interactive: "interactive",
    template: "template",
  };
  return map[waType] ?? "text";
}
