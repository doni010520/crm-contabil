import { getConversations } from "./actions";
import { InboxClient } from "./inbox-client";

export default async function InboxPage() {
  const conversations = await getConversations();

  return <InboxClient initialConversations={conversations} />;
}
