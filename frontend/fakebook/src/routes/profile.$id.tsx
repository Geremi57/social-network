import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PostCard } from "@/components/feed/PostCard";
import { Mail, MoreHorizontal } from "lucide-react";
import { useAuthStore } from "@/stores/auth";
import { useEffect, useState } from "react";
// import { Post } from ".";

export const Route = createFileRoute("/profile/$id")({
  head: () => ({ meta: [{ title: "Profile" }] }),
  component: ProfilePage,
});

export interface ProfileData {
  id: number;
  firstname: string;
  lastname: string;
  email: string;
  avatar: string;
  aboutme: string;
  nickname: string;
}

// interface Post {
//   id: number;
//   content: string;
//   image_path: string;
//   privacy: string;
//   created_at: string;
//   author_id: number;
//   firstname: string;
// }

interface Post {
  id: number;
  content: string;
  image_path: string;
  privacy: string;
  created_at: string;
  author_id: number;
  firstname: string;
  nickname: string
  avatar: string;
  likes_count: number;
  liked_by_me: boolean;
}

function ProfilePage() {
  const { id } = useParams({ from: "/profile/$id" });
  const me = useAuthStore((s) => s.user);
  const isOwn = me?.id === Number(id);

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

 useEffect(() => {
  fetch(`http://localhost:8080/users/${id}`, { credentials: "include" })
    .then((res) => (res.ok ? res.json() : null))
    .then((data) => setProfile(data))
    .catch(() => setProfile(null));

  fetch(`http://localhost:8080/users/${id}/posts`, { credentials: "include" })
    .then((res) => (res.ok ? res.json() : []))
    .then((data) => setPosts(Array.isArray(data) ? data : []))
    .catch(() => setPosts([]))
    .finally(() => setLoading(false));
}, [id]);

  if (loading || !profile) {
    return (
      <AppShell>
        <div className="h-64 surface-card animate-pulse" />
      </AppShell>
    );
  }
  console.log(profile.avatar)
  console.log(posts)

  return (
    <AppShell>
      <div className="px-3 sm:px-5 lg:px-8 pt-6">
        <div className="flex items-end gap-4 justify-between">
          <Avatar className="h-24 w-24 sm:h-28 sm:w-28 border-4 border-background shadow-elevated">
            <AvatarImage src={`http://localhost:8080/${profile.avatar}`} alt={profile.firstname?.[0]} />
            <AvatarFallback className="text-2xl">
              {profile.firstname?.[0]}
            </AvatarFallback>
          </Avatar>

          <div className="flex gap-2 pb-1">
            {isOwn ? (
              <>
                <Button variant="outline" size="sm">Edit profile</Button>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" size="sm">
                  <Mail className="h-4 w-4 mr-1.5" />
                  Message
                </Button>
                <Button variant="outline" size="sm">Follow</Button>
              </>
            )}
          </div>
        </div>

        <div className="mt-3">
          <h1 className="text-xl sm:text-2xl font-bold">
            {profile.firstname} {profile.lastname}
          </h1>
          {/* <div className="text-sm text-muted-foreground">{profile.email}</div> */}
        </div>
        <div className="text-sm text-muted-foreground">@{profile.nickname}</div>
            {profile.aboutme && <p className="mt-3 text-[15px] leading-relaxed max-w-prose">{profile.aboutme}</p>}
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
              {/* {user.location && <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4" />{user.location}</span>} */}
              {/* <span className="inline-flex items-center gap-1.5"><Calendar className="h-4 w-4" />Joined {new Date(profile.).toLocaleDateString(undefined, { month: "long", year: "numeric" })}</span> */}
            </div>
      </div>

      <Tabs defaultValue="posts" className="mt-6">
        <TabsList className="w-full justify-start bg-transparent border-b rounded-none h-auto p-0 gap-1">
          <TabsTrigger value="posts" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-4 py-2">
            Posts
          </TabsTrigger>
          <TabsTrigger value="about" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-4 py-2">
            About
          </TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="space-y-4 mt-4">
          {posts.length === 0 ? (
            <Empty label="No posts yet" />
          ) : (
            posts.map((p) => <PostCard key={p.id} post={p} />)
          )}
        </TabsContent>

        <TabsContent value="about" className="mt-4 surface-card p-5 space-y-3 text-sm">
          <Row label="Email" value={profile.email} />
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex gap-4">
      <div className="w-28 text-muted-foreground">{label}</div>
      <div>{value || "—"}</div>
    </div>
  );
}

function Empty({ label }: { label: string }) {
  return (
    <div className="surface-card p-10 text-center text-sm text-muted-foreground">
      {label}
    </div>
  );
}