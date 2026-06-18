import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { useQuery } from "@tanstack/react-query";
import { userService, postService, groupService } from "@/services/mockApi";
import { PersonRow } from "@/components/social/FollowButton";
import { PostCard } from "@/components/feed/PostCard";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Link } from "@tanstack/react-router";
import { TrendingUp, Hash } from "lucide-react";

export const Route = createFileRoute("/explore")({
  head: () => ({ meta: [{ title: "Explore — Pulse" }] }),
  component: ExplorePage,
});

function ExplorePage() {
  const { data: people = [] } = useQuery({ queryKey: ["explore-people"], queryFn: () => userService.listUsers() });
  const { data: posts = [] } = useQuery({ queryKey: ["explore-posts"], queryFn: () => postService.feed("top") });
  const { data: groups = [] } = useQuery({ queryKey: ["explore-groups"], queryFn: () => groupService.list("trending") });

  return (
    <AppShell>
      <header className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight">Explore</h1>
        <p className="text-sm text-muted-foreground mt-1">Trending posts, communities, and people across Pulse.</p>
      </header>

      <div className="surface-card p-4 mb-4">
        <div className="flex items-center gap-2 text-sm font-semibold mb-3"><TrendingUp className="h-4 w-4" /> Trending tags</div>
        <div className="flex flex-wrap gap-2">
          {["#designeng","#slowweb","#building","#typography","#books","#climbing","#pottery","#newsletter"].map((t) => (
            <span key={t} className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs font-medium"><Hash className="h-3 w-3" />{t.slice(1)}</span>
          ))}
        </div>
      </div>

      <Tabs defaultValue="posts">
        <TabsList>
          <TabsTrigger value="posts">Top posts</TabsTrigger>
          <TabsTrigger value="people">People</TabsTrigger>
          <TabsTrigger value="groups">Groups</TabsTrigger>
        </TabsList>
        <TabsContent value="posts" className="space-y-4 mt-4">
          {posts.slice(0, 10).map((p) => <PostCard key={p.id} post={p} />)}
        </TabsContent>
        <TabsContent value="people" className="mt-4 surface-card divide-y">
          {people.slice(0, 16).map((u) => <div key={u.id} className="px-3"><PersonRow userId={u.id} /></div>)}
        </TabsContent>
        <TabsContent value="groups" className="mt-4 grid sm:grid-cols-2 gap-4">
          {groups.slice(0, 6).map((g) => (
            <Link to="/groups" key={g.id} className="surface-card overflow-hidden hover:shadow-elevated transition-shadow">
              <div className="h-20 bg-muted"><img src={g.cover} alt="" className="w-full h-full object-cover" /></div>
              <div className="p-3">
                <div className="font-semibold text-sm truncate">{g.name}</div>
                <div className="text-xs text-muted-foreground truncate">{g.description}</div>
              </div>
            </Link>
          ))}
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
