import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { CreatePost } from "@/components/feed/CreatePost";
import { PostCard } from "@/components/feed/PostCard";
import { PostSkeleton } from "@/components/feed/PostSkeleton";
import { useQuery } from "@tanstack/react-query";
import { postService, userService, eventService } from "@/services/mockApi";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { PersonRow } from "@/components/social/FollowButton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuthStore } from "@/stores/auth";
import { Plus, TrendingUp, Calendar } from "lucide-react";
import { relTime } from "@/lib/format";


export interface userDetails {
  id: number,
  firstname: string,
  email: string,
}

interface Post {
  id: number;
  content: string;
  image_path: string;
  privacy: string;
  created_at: string;
  author_id: number;
  firstname: string;
  avatar: string;
}

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Home — Pulse" }] }),
  component: HomePage,
});

function HomePage() {
  // const [user, setUser] = useState<userDetails | null>(null);

  const [sort, setSort] = useState<"latest" | "top">("latest");
  const [Allposts, setPosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);


  const { data: posts, isLoading } = useQuery({
    queryKey: ["feed", sort],
    queryFn: () => postService.feed(sort),
  });
  // const { data: suggested = [] } = useQuery({
  //   queryKey: ["suggested"],
  //   queryFn: () => userService.suggested(5),
  // });
  // const { data: upcoming = [] } = useQuery({
  //   queryKey: ["events-upcoming"],
  //   queryFn: () => eventService.list("upcoming"),
  // });
  const me = useAuthStore((s) => s.user);

  const setUser = useAuthStore((s) => s.setUser);

useEffect(() => {
  const checkSession = () => {
    fetch("http://localhost:8080/me", { credentials: "include" })
      .then((res) => {
        if (!res.ok) {
          window.location.href = "/login";
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data && data.id) setUser(data);
      })
      .catch(() => {
        setUser(null);
        window.location.href = "/login";
      });
  };

  checkSession();
  const interval = setInterval(checkSession, 30000);
  return () => clearInterval(interval);
}, [setUser]);

useEffect(() => {
  fetch("http://localhost:8080/posts", { credentials: "include" })
    .then((res) => (res.ok ? res.json() : []))
    .then((data) => setPosts(Array.isArray(data) ? data : []))
    .catch(() => setPosts([]))
    .finally(() => setPostsLoading(false));
}, []);

console.log(Allposts)

  return (
    <AppShell>
      <ActivityRail />
      <div className="mt-4 space-y-4">
        <CreatePost />

        <div className="flex items-center gap-1 px-1 pt-1">
          <Tab label="Latest" active={sort === "latest"} onClick={() => setSort("latest")} />
          <Tab label="Top" active={sort === "top"} onClick={() => setSort("top")} icon={<TrendingUp className="h-3.5 w-3.5" />} />
          <div className="flex-1" />
          {me && (
            <Link to="/profile/$id" params={{ id: me.id }} className="text-xs text-muted-foreground hover:text-foreground">
              View profile →
            </Link>
          )}
        </div>

        {postsLoading
  ? Array.from({ length: 3 }).map((_, i) => <PostSkeleton key={i} />)
  : Allposts.map((p) => (
      <PostCard key={p.id} post={p} />
    ))}
      </div>
    </AppShell>
  );
}

function Tab({ label, active, onClick, icon }: { label: string; active: boolean; onClick: () => void; icon?: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 h-8 text-sm font-medium transition-colors",
        active ? "bg-foreground text-background" : "text-muted-foreground hover:bg-accent",
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function ActivityRail() {
  const { data: people = [] } = useQuery({
    queryKey: ["activity-rail"],
    queryFn: () => userService.listUsers(),
  });
  return (
    <div className="surface-card p-3">
      <div className="flex gap-3 overflow-x-auto scrollbar-thin pb-1 -mb-1">
        <div className="shrink-0 w-20 grid place-items-center">
          <div className="h-14 w-14 rounded-full border-2 border-dashed border-primary/40 grid place-items-center text-primary">
            <Plus className="h-5 w-5" />
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">Your story</div>
        </div>
        {people.slice(0, 14).map((u) => (
          <Link to="/profile/$id" params={{ id: u.id }} key={u.id} className="shrink-0 w-20 text-center group">
            <div className="h-14 w-14 mx-auto rounded-full p-[2px] bg-gradient-to-br from-primary to-fuchsia-500">
              <Avatar className="h-full w-full border-2 border-background">
                <AvatarImage src={u.avatar} alt={u.name} />
                <AvatarFallback>{u.name[0]}</AvatarFallback>
              </Avatar>
            </div>
            <div className="text-[11px] mt-1 truncate">{u.name.split(" ")[0]}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function RightRail({ suggested, events }: { suggested: any[]; events: any[] }) {
  return (
    <div className="space-y-6">
      <section>
        <h3 className="text-sm font-semibold mb-2">Suggested for you</h3>
        <div className="surface-card divide-y">
          {suggested.map((u) => (
            <div key={u.id} className="px-3"><PersonRow userId={u.id} /></div>
          ))}
        </div>
      </section>

      <section>
        <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
          <Calendar className="h-4 w-4" /> Upcoming events
        </h3>
        <div className="surface-card overflow-hidden divide-y">
          {events.map((e) => (
            <Link to="/events" key={e.id} className="block p-3 hover:bg-accent/40">
              <div className="text-xs text-primary font-semibold">{relTime(e.startsAt)} · {e.location}</div>
              <div className="text-sm font-medium mt-0.5 truncate">{e.title}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{e.attendees} going</div>
            </Link>
          ))}
        </div>
      </section>

      <p className="text-[11px] text-muted-foreground leading-relaxed">
        © Pulse — built as a demo. All content is fictional.
      </p>
    </div>
  );
}
