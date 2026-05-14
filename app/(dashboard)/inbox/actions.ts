"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sendTextMessage } from "@/lib/whatsapp/send";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface ConversationWithContact {
  id: string;
  whatsapp_conversation_id: string;
  status: string;
  last_message_at: string | null;
  unread_count: number;
  assigned_to: string | null;
  created_at: string;
  contact: {
    id: string;
    name: string;
    phone: string | null;
  } | null;
  last_message?: {
    content: string | null;
    type: string;
    direction: string;
    created_at: string;
  } | null;
}

export interface Message {
  id: string;
  conversation_id: string;
  whatsapp_message_id: string | null;
  direction: string;
  type: string;
  content: string | null;
  media_url: string | null;
  status: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Get conversations list
// ---------------------------------------------------------------------------
export async function getConversations(): Promise<ConversationWithContact[]> {
  const supabase = await createClient();

  const { data: conversations, error } = await supabase
    .from("conversations")
    .select(
      `
      id,
      whatsapp_conversation_id,
      status,
      last_message_at,
      unread_count,
      assigned_to,
      created_at,
      contact:contacts!contact_id (
        id,
        name,
        phone
      )
    `
    )
    .order("last_message_at", { ascending: false, nullsFirst: false });

  if (error) {
    throw new Error(error.message);
  }

  // Fetch last message for each conversation
  const result: ConversationWithContact[] = [];

  for (const conv of conversations ?? []) {
    const { data: lastMsg } = await supabase
      .from("messages")
      .select("content, type, direction, created_at")
      .eq("conversation_id", conv.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    result.push({
      ...conv,
      contact: (Array.isArray(conv.contact) ? conv.contact[0] : conv.contact) as ConversationWithContact["contact"],
      last_message: lastMsg ?? null,
    });
  }

  return result;
}

// ---------------------------------------------------------------------------
// Get messages for a conversation
// ---------------------------------------------------------------------------
export async function getMessages(conversationId: string): Promise<Message[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as Message[];
}

// ---------------------------------------------------------------------------
// Send a text message
// ---------------------------------------------------------------------------
export async function sendMessage(conversationId: string, body: string) {
  const supabase = await createClient();

  // Get conversation + tenant info
  const { data: conv, error: convError } = await supabase
    .from("conversations")
    .select("whatsapp_conversation_id, tenant_id")
    .eq("id", conversationId)
    .single();

  if (convError || !conv) {
    throw new Error("Conversa nao encontrada.");
  }

  // Get tenant WhatsApp config
  const { data: tenant } = await supabase
    .from("tenants")
    .select("whatsapp_phone_id, whatsapp_token")
    .eq("id", conv.tenant_id)
    .single();

  let waMessageId: string | null = null;
  let messageStatus: string = "pending";

  // Try to send via WhatsApp API if configured
  if (tenant?.whatsapp_phone_id && tenant?.whatsapp_token) {
    try {
      const result = await sendTextMessage(
        tenant.whatsapp_phone_id,
        tenant.whatsapp_token,
        conv.whatsapp_conversation_id,
        body
      );
      waMessageId = result.messages?.[0]?.id ?? null;
      messageStatus = "sent";
    } catch (err) {
      console.error("[WhatsApp Send] Error:", err);
      messageStatus = "failed";
    }
  }

  // Insert message into DB
  const { data: message, error: msgError } = await supabase
    .from("messages")
    .insert({
      tenant_id: conv.tenant_id,
      conversation_id: conversationId,
      whatsapp_message_id: waMessageId,
      direction: "outbound",
      sender_type: "user",
      type: "text",
      content: body,
      status: messageStatus,
    })
    .select("*")
    .single();

  if (msgError) {
    throw new Error(msgError.message);
  }

  // Update conversation
  await supabase
    .from("conversations")
    .update({
      last_message_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", conversationId);

  revalidatePath("/inbox");

  return message as Message;
}

// ---------------------------------------------------------------------------
// Mark conversation as read (reset unread count)
// ---------------------------------------------------------------------------
export async function markConversationRead(conversationId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("conversations")
    .update({ unread_count: 0 })
    .eq("id", conversationId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/inbox");
}

// ---------------------------------------------------------------------------
// Close a conversation
// ---------------------------------------------------------------------------
export async function closeConversation(conversationId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("conversations")
    .update({ status: "closed", updated_at: new Date().toISOString() })
    .eq("id", conversationId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/inbox");
}

// ---------------------------------------------------------------------------
// Search conversations by contact name or phone
// ---------------------------------------------------------------------------
export async function searchConversations(
  term: string
): Promise<ConversationWithContact[]> {
  const supabase = await createClient();

  const like = `%${term}%`;

  // Search contacts matching the term
  const { data: contacts } = await supabase
    .from("contacts")
    .select("id")
    .or(`name.ilike.${like},phone.ilike.${like}`);

  const contactIds = (contacts ?? []).map((c) => c.id);

  if (contactIds.length === 0) {
    return [];
  }

  const { data: conversations, error } = await supabase
    .from("conversations")
    .select(
      `
      id,
      whatsapp_conversation_id,
      status,
      last_message_at,
      unread_count,
      assigned_to,
      created_at,
      contact:contacts!contact_id (
        id,
        name,
        phone
      )
    `
    )
    .in("contact_id", contactIds)
    .order("last_message_at", { ascending: false, nullsFirst: false });

  if (error) {
    throw new Error(error.message);
  }

  const result: ConversationWithContact[] = [];

  for (const conv of conversations ?? []) {
    const { data: lastMsg } = await supabase
      .from("messages")
      .select("content, type, direction, created_at")
      .eq("conversation_id", conv.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    result.push({
      ...conv,
      contact: (Array.isArray(conv.contact) ? conv.contact[0] : conv.contact) as ConversationWithContact["contact"],
      last_message: lastMsg ?? null,
    });
  }

  return result;
}
