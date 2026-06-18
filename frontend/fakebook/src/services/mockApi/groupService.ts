import { groups, groupsById } from "@/mocks/seed";
import type { Group } from "@/types";
import { delay } from ".";

export async function list(filter?: "all" | "yours" | "trending" | "new"): Promise<Group[]> {
  await delay();
  let list = [...groups];
  if (filter === "yours") list = list.filter((g) => g.membership === "member" || g.membership === "owner");
  if (filter === "trending") list = list.sort((a, b) => b.online - a.online);
  if (filter === "new") list = list.sort((a, b) => a.members - b.members);
  return list;
}
export async function get(id: string): Promise<Group> {
  await delay();
  const g = groupsById[id];
  if (!g) throw new Error("Group not found");
  return g;
}
export async function join(id: string): Promise<Group> {
  await delay();
  const g = groupsById[id];
  if (g.privacy === "private" && g.membership === "none") g.membership = "pending";
  else g.membership = "member";
  return g;
}
export async function leave(id: string): Promise<Group> {
  await delay();
  const g = groupsById[id];
  g.membership = "none";
  return g;
}
