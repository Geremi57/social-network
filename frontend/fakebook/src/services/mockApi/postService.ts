import { comments, currentUser, posts, usersById } from "@/mocks/seed";
import type { Comment, Post } from "@/types";
import { delay } from ".";

export async function feed(sort: "latest" | "top" = "latest"): Promise<Post[]> {
  await delay();
  const list = [...posts];
  if (sort === "top") list.sort((a, b) => b.likes - a.likes);
  return list.slice(0, 60);
}

export async function userPosts(userId: string): Promise<Post[]> {
  await delay();
  return posts.filter((p) => p.authorId === userId);
}

export async function getPost(id: string): Promise<Post | undefined> {
  await delay(80, 160);
  return posts.find((p) => p.id === id);
}

export async function createPost(input: { text: string; image?: string; privacy?: Post["privacy"] }): Promise<Post> {
  await delay();
  const p: Post = {
    id: `p_new_${Date.now()}`,
    authorId: currentUser.id,
    createdAt: new Date().toISOString(),
    text: input.text,
    image: input.image,
    privacy: input.privacy ?? "public",
    likes: 0,
    comments: 0,
    shares: 0,
    liked: false,
  };
  posts.unshift(p);
  return p;
}

export async function toggleLike(id: string): Promise<Post> {
  await delay(80, 200);
  const p = posts.find((x) => x.id === id);
  if (!p) throw new Error("Post not found");
  p.liked = !p.liked;
  p.likes += p.liked ? 1 : -1;
  return p;
}

export async function toggleSave(id: string): Promise<Post> {
  await delay(80, 160);
  const p = posts.find((x) => x.id === id);
  if (!p) throw new Error("Post not found");
  p.saved = !p.saved;
  return p;
}

export async function postComments(postId: string): Promise<Comment[]> {
  await delay();
  return comments.filter((c) => c.postId === postId);
}

export async function addComment(postId: string, text: string): Promise<Comment> {
  await delay();
  const c: Comment = {
    id: `c_new_${Date.now()}`,
    postId,
    authorId: currentUser.id,
    text,
    createdAt: new Date().toISOString(),
    likes: 0,
  };
  comments.push(c);
  const p = posts.find((x) => x.id === postId);
  if (p) p.comments += 1;
  return c;
}


export function getAuthor(id: string) {
  // console.log("lookup", id);
  // console.log(usersById[id]);
  return usersById[id];
}
