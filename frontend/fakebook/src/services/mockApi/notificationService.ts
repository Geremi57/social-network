import { notifications } from "@/mocks/seed";
import type { Notification } from "@/types";
import { delay } from ".";

export async function list(filter?: Notification["type"] | "all" | "unread"): Promise<Notification[]> {
  await delay();
  if (!filter || filter === "all") return notifications;
  if (filter === "unread") return notifications.filter((n) => !n.read);
  return notifications.filter((n) => n.type === filter);
}
export async function markAllRead() {
  await delay(120, 200);
  notifications.forEach((n) => (n.read = true));
  return true;
}
export async function markRead(id: string) {
  await delay(80, 140);
  const n = notifications.find((x) => x.id === id);
  if (n) n.read = true;
  return n;
}
export async function unreadCount() {
  await delay(40, 80);
  return notifications.filter((n) => !n.read).length;
}
