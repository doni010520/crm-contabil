const WA_API_BASE = "https://graph.facebook.com/v21.0";

// ---------------------------------------------------------------------------
// Send a plain text message
// ---------------------------------------------------------------------------
export async function sendTextMessage(
  phoneNumberId: string,
  token: string,
  to: string,
  body: string
) {
  const url = `${WA_API_BASE}/${phoneNumberId}/messages`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "text",
      text: { body },
    }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(
      `WhatsApp API error: ${res.status} - ${JSON.stringify(error)}`
    );
  }

  return res.json() as Promise<{
    messaging_product: string;
    contacts: { input: string; wa_id: string }[];
    messages: { id: string }[];
  }>;
}

// ---------------------------------------------------------------------------
// Send a template message
// ---------------------------------------------------------------------------
export async function sendTemplateMessage(
  phoneNumberId: string,
  token: string,
  to: string,
  templateName: string,
  language: string,
  components?: Record<string, unknown>[]
) {
  const url = `${WA_API_BASE}/${phoneNumberId}/messages`;

  const template: Record<string, unknown> = {
    name: templateName,
    language: { code: language },
  };

  if (components && components.length > 0) {
    template.components = components;
  }

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "template",
      template,
    }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(
      `WhatsApp API error: ${res.status} - ${JSON.stringify(error)}`
    );
  }

  return res.json() as Promise<{
    messaging_product: string;
    contacts: { input: string; wa_id: string }[];
    messages: { id: string }[];
  }>;
}

// ---------------------------------------------------------------------------
// Mark a message as read
// ---------------------------------------------------------------------------
export async function markAsRead(
  phoneNumberId: string,
  token: string,
  messageId: string
) {
  const url = `${WA_API_BASE}/${phoneNumberId}/messages`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      status: "read",
      message_id: messageId,
    }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(
      `WhatsApp API error: ${res.status} - ${JSON.stringify(error)}`
    );
  }

  return res.json();
}
