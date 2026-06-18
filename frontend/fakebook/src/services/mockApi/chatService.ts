import { conversations, currentUser, messagesByConversation, usersById } from "@/mocks/seed";
import type { Conversation, Message } from "@/types";
import { delay } from ".";

type Listener = (msg: Message) => void;
const listeners = new Map<string, Set<Listener>>();

export async function listConversations(): Promise<Conversation[]> {
  await delay();
  return conversations;
}
export async function getConversation(id: string): Promise<Conversation | undefined> {
  await delay(80, 160);
  return conversations.find((c) => c.id === id);
}
export async function getMessages(conversationId: string): Promise<Message[]> {
  await delay();
  return messagesByConversation[conversationId] ?? [];
}
export async function sendMessage(conversationId: string, text: string): Promise<Message> {
  await delay(120, 220);
  const msg: Message = {
    id: `m_${Date.now()}`,
    conversationId,
    authorId: currentUser.id,
    text,
    createdAt: new Date().toISOString(),
    seen: false,
  };
  (messagesByConversation[conversationId] ??= []).push(msg);
  const c = conversations.find((x) => x.id === conversationId);
  if (c) {
    c.lastMessage = msg;
    c.unread = 0;
  }
  listeners.get(conversationId)?.forEach((fn) => fn(msg));

  // Simulate reply from another participant
  const other = c?.participantIds.find((id) => id !== currentUser.id);
  if (other) {
    setTimeout(() => {
      const reply: Message = {
        id: `m_${Date.now() + 1}`,
        conversationId,
        authorId: other,
        text: pickReply(text),
        createdAt: new Date().toISOString(),
        seen: false,
      };
      (messagesByConversation[conversationId] ??= []).push(reply);
      if (c) c.lastMessage = reply;
      listeners.get(conversationId)?.forEach((fn) => fn(reply));
    }, 1400 + Math.random() * 1800);
  }
  return msg;
}

function pickReply(text: string) {
  if (text.endsWith("?")) return "good question — let me think on it";
  return ["Got it!", "haha for real", "Yes 100%", "On it 🙌", "Saving this", "agreed"][Math.floor(Math.random()*6)];
}

// Mock websocket: subscribe to incoming messages
export function subscribe(conversationId: string, fn: Listener) {
  const set = listeners.get(conversationId) ?? new Set();
  set.add(fn);
  listeners.set(conversationId, set);
  return () => set.delete(fn);
}

export function getParticipants(c: Conversation) {
  return c.participantIds.map((id) => usersById[id]).filter(Boolean);
}
