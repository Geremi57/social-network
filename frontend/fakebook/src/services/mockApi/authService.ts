import { currentUser } from "@/mocks/seed";
import { delay } from ".";

export async function login(email: string, _password: string) {
  await delay();
  if (!email) throw new Error("Email required");
  return { user: currentUser, token: "mock-token" };
}
export async function register(payload: { name: string; email: string; password: string }) {
  await delay();
  if (!payload.email) throw new Error("Email required");
  return { user: { ...currentUser, name: payload.name }, token: "mock-token" };
}
export async function forgotPassword(_email: string) {
  await delay();
  return { ok: true };
}
export async function me() {
  await delay(80, 160);
  return currentUser;
}
