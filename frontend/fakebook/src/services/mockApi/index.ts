export * as authService from "./authService";
export * as userService from "./userService";
export * as postService from "./postService";
export * as groupService from "./groupService";
export * as notificationService from "./notificationService";
export * as chatService from "./chatService";
export * as eventService from "./eventService";

export const delay = (min = 180, max = 480) =>
  new Promise<void>((r) => setTimeout(r, min + Math.random() * (max - min)));
