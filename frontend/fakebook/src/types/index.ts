export type ID = string;

export interface User {
  id: number;
  firstname: string;
  email: string;
  handle: string;
  name: string;
  avatar: string;
  cover?: string;
  bio?: string;
  location?: string;
  pronouns?: string;
  isPrivate: boolean;
  isVerified?: boolean;
  followers: number;
  following: number;
  joinedAt: string;
}

export type FollowState =
  | "not_following"
  | "following"
  | "request_sent"
  | "follows_you"
  | "mutual";

export interface Post {
  id: ID;
  authorId: ID;
  createdAt: string;
  text: string;
  image?: string;
  privacy: "public" | "followers" | "private";
  likes: number;
  comments: number;
  shares: number;
  liked?: boolean;
  saved?: boolean;
  groupId?: ID;
}

export interface Comment {
  id: ID;
  postId: ID;
  authorId: ID;
  parentId?: ID;
  text: string;
  createdAt: string;
  likes: number;
}

export interface Group {
  id: ID;
  name: string;
  handle: string;
  description: string;
  cover: string;
  icon: string;
  members: number;
  online: number;
  category: string;
  privacy: "public" | "private";
  membership: "none" | "member" | "pending" | "invited" | "owner";
  activity: "low" | "medium" | "high";
}

export interface EventItem {
  id: ID;
  title: string;
  description: string;
  cover: string;
  startsAt: string;
  endsAt: string;
  location: string;
  online: boolean;
  groupId?: ID;
  hostId: ID;
  attendees: number;
  going?: boolean;
}

export type NotificationType =
  | "follow_request"
  | "follow_accepted"
  | "group_invite"
  | "event"
  | "like"
  | "comment"
  | "mention"
  | "message";

export interface Notification {
  id: ID;
  type: NotificationType;
  actorId: ID;
  targetId?: ID;
  createdAt: string;
  read: boolean;
  text: string;
}

export interface Message {
  id: ID;
  conversationId: ID;
  authorId: ID;
  text: string;
  createdAt: string;
  seen?: boolean;
  attachment?: { kind: "image"; url: string };
}

export interface Conversation {
  id: ID;
  kind: "dm" | "group";
  participantIds: ID[];
  title?: string;
  icon?: string;
  lastMessage?: Message;
  unread: number;
  pinned?: boolean;
}
