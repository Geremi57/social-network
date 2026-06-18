import { events } from "@/mocks/seed";
import type { EventItem } from "@/types";
import { delay } from ".";

export async function list(filter?: "upcoming" | "joined" | "created"): Promise<EventItem[]> {
  await delay();
  if (filter === "joined") return events.filter((e) => e.going);
  if (filter === "created") return events.filter((e) => e.hostId === "u_me");
  return events;
}
export async function toggleGoing(id: string): Promise<EventItem> {
  await delay();
  const e = events.find((x) => x.id === id);
  if (!e) throw new Error("Event not found");
  e.going = !e.going;
  e.attendees += e.going ? 1 : -1;
  return e;
}
