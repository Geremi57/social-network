import { currentUser, followGraph, users, usersById } from "@/mocks/seed";
import type { FollowState, User } from "@/types";
import { delay } from ".";

export async function getUser(id: string): Promise<User> {
  await delay();
  const u = usersById[id];
  if (!u) throw new Error("User not found");
  return u;
}

export async function listUsers(query?: string): Promise<User[]> {
  await delay();
  const q = (query ?? "").toLowerCase().trim();
  if (!q) return users;
  return users.filter((u) =>
    u.name.toLowerCase().includes(q) || u.handle.toLowerCase().includes(q),
  );
}

export async function suggested(limit = 5): Promise<User[]> {
  await delay();
  return users
    .filter((u) => u.id !== currentUser.id && followGraph[u.id] === "not_following")
    .slice(0, limit);
}

export async function getFollowState(id: string): Promise<FollowState> {
  await delay(60, 120);
  return followGraph[id] ?? "not_following";
}

export async function follow(id: string): Promise<FollowState> {
  await delay();
  const target = usersById[id];
  const current = followGraph[id] ?? "not_following";
  if (target?.isPrivate && current === "not_following") {
    followGraph[id] = "request_sent";
  } else if (current === "follows_you") {
    followGraph[id] = "mutual";
  } else {
    followGraph[id] = "following";
  }
  return followGraph[id];
}

export async function unfollow(id: string): Promise<FollowState> {
  await delay();
  const current = followGraph[id];
  if (current === "mutual") followGraph[id] = "follows_you";
  else followGraph[id] = "not_following";
  return followGraph[id];
}

export async function cancelRequest(id: string): Promise<FollowState> {
  await delay();
  followGraph[id] = "not_following";
  return "not_following";
}

export async function listFollowers(id: string): Promise<User[]> {
  await delay();
  return users.filter((u) => u.id !== id).slice(0, 24);
}
export async function listFollowing(id: string): Promise<User[]> {
  await delay();
  return users.filter((u) => u.id !== id).slice(10, 30);
}
