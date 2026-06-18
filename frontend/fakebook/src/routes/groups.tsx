import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { groupService } from "@/services/mockApi";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Users, Lock, Globe, Sparkles } from "lucide-react";
import { fmtCount } from "@/lib/format";
import type { Group } from "@/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/groups")({
  head: () => ({ meta: [{ title: "Groups — Pulse" }] }),
  component: GroupsPage,
});

function GroupsPage() {
  return (
    <AppShell>
      <header className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight">Groups</h1>
        <p className="text-sm text-muted-foreground mt-1">Discover communities, attend events, and meet people who share your interests.</p>
      </header>

      <Tabs defaultValue="discover">
        <TabsList>
          <TabsTrigger value="discover">Discover</TabsTrigger>
          <TabsTrigger value="trending">Trending</TabsTrigger>
          <TabsTrigger value="new">New</TabsTrigger>
          <TabsTrigger value="yours">Your groups</TabsTrigger>
        </TabsList>

        <TabsContent value="discover" className="mt-4"><GroupList filter="all" /></TabsContent>
        <TabsContent value="trending" className="mt-4"><GroupList filter="trending" /></TabsContent>
        <TabsContent value="new" className="mt-4"><GroupList filter="new" /></TabsContent>
        <TabsContent value="yours" className="mt-4"><GroupList filter="yours" /></TabsContent>
      </Tabs>
    </AppShell>
  );
}

function GroupList({ filter }: { filter: "all" | "trending" | "new" | "yours" }) {
  const { data: groups = [], isLoading } = useQuery({
    queryKey: ["groups", filter],
    queryFn: () => groupService.list(filter),
  });
  if (isLoading) return <div className="grid sm:grid-cols-2 gap-4">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-48 surface-card animate-pulse" />)}</div>;
  if (groups.length === 0) return <div className="surface-card p-10 text-center text-sm text-muted-foreground">Nothing here yet.</div>;
  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {groups.map((g) => <GroupCard key={g.id} g={g} />)}
    </div>
  );
}

function GroupCard({ g }: { g: Group }) {
  const qc = useQueryClient();
  const join = useMutation({
    mutationFn: () => groupService.join(g.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["groups"] }),
  });
  const leave = useMutation({
    mutationFn: () => groupService.leave(g.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["groups"] }),
  });

  return (
    <article className="surface-card overflow-hidden flex flex-col">
      <div className="h-24 bg-muted">
        <img src={g.cover} alt="" className="w-full h-full object-cover" />
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-start gap-3">
          <div className="-mt-8 h-12 w-12 rounded-xl bg-background ring-4 ring-background overflow-hidden shrink-0">
            <img src={g.icon} alt="" className="w-full h-full" />
          </div>
          <div className="min-w-0 flex-1">
            <Link to="/groups" className="font-semibold text-sm truncate block hover:underline">{g.name}</Link>
            <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
              {g.privacy === "private" ? <Lock className="h-3 w-3" /> : <Globe className="h-3 w-3" />}
              <span>{g.privacy === "private" ? "Private" : "Public"}</span>
              <span>·</span>
              <span>{g.category}</span>
            </div>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-3 line-clamp-2">{g.description}</p>
        <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5"><Users className="h-3.5 w-3.5" />{fmtCount(g.members)} members</span>
          <span className={cn("inline-flex items-center gap-1.5", g.activity === "high" && "text-success")}>
            <span className={cn("h-1.5 w-1.5 rounded-full", g.activity === "high" ? "bg-success live-dot" : "bg-muted-foreground/50")} />
            {g.online} online
          </span>
        </div>
        <div className="mt-4 flex gap-2">
          {g.membership === "owner" && <Button size="sm" variant="outline" className="flex-1"><Sparkles className="h-3.5 w-3.5 mr-1" />Owner</Button>}
          {g.membership === "member" && <Button size="sm" variant="secondary" className="flex-1" onClick={() => leave.mutate()}>Joined</Button>}
          {g.membership === "pending" && <Button size="sm" variant="outline" className="flex-1" disabled>Request sent</Button>}
          {g.membership === "invited" && (
            <>
              <Button size="sm" className="flex-1" onClick={() => join.mutate()}>Accept</Button>
              <Button size="sm" variant="outline" className="flex-1">Decline</Button>
            </>
          )}
          {g.membership === "none" && <Button size="sm" className="flex-1" onClick={() => join.mutate()}>{g.privacy === "private" ? "Request to join" : "Join group"}</Button>}
          <Button size="sm" variant="ghost">View</Button>
        </div>
      </div>
    </article>
  );
}
