import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationService, userService } from "@/services/mockApi";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { relTime } from "@/lib/format";
import { Bell, Check, UserPlus, MessageCircle, Heart, Users, Calendar, AtSign } from "lucide-react";
import type { Notification } from "@/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/notifications")({
  head: () => ({ meta: [{ title: "Notifications — Pulse" }] }),
  component: NotificationsPage,
});

const ICON: Record<Notification["type"], any> = {
  follow_request: UserPlus,
  follow_accepted: Check,
  group_invite: Users,
  event: Calendar,
  like: Heart,
  comment: MessageCircle,
  mention: AtSign,
  message: MessageCircle,
};

function NotificationsPage() {
  const qc = useQueryClient();
  const { data: notifs = [], isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationService.list("all"),
  });
  const markAll = useMutation({
    mutationFn: () => notificationService.markAllRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const group = (filter: (n: Notification) => boolean) => notifs.filter(filter);

  return (
    <AppShell>
      <header className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
        <Button variant="ghost" size="sm" onClick={() => markAll.mutate()}>Mark all read</Button>
      </header>

      <Tabs defaultValue="all">
        <TabsList className="w-full overflow-x-auto justify-start">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="follow">Follow requests</TabsTrigger>
          <TabsTrigger value="groups">Groups</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="mentions">Mentions</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          <List items={notifs} loading={isLoading} />
        </TabsContent>
        <TabsContent value="follow" className="mt-4">
          <List items={group((n) => n.type === "follow_request" || n.type === "follow_accepted")} loading={isLoading} />
        </TabsContent>
        <TabsContent value="groups" className="mt-4">
          <List items={group((n) => n.type === "group_invite")} loading={isLoading} />
        </TabsContent>
        <TabsContent value="events" className="mt-4">
          <List items={group((n) => n.type === "event")} loading={isLoading} />
        </TabsContent>
        <TabsContent value="mentions" className="mt-4">
          <List items={group((n) => n.type === "mention")} loading={isLoading} />
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}

function List({ items, loading }: { items: Notification[]; loading: boolean }) {
  if (loading) return <div className="surface-card p-10 animate-pulse text-center text-muted-foreground">Loading…</div>;
  if (items.length === 0) {
    return (
      <div className="surface-card p-12 text-center">
        <div className="mx-auto h-12 w-12 rounded-full bg-muted grid place-items-center mb-3">
          <Bell className="h-5 w-5 text-muted-foreground" />
        </div>
        <h3 className="font-semibold">You're all caught up</h3>
        <p className="text-sm text-muted-foreground mt-1">New activity will show up here.</p>
      </div>
    );
  }
  return (
    <div className="surface-card divide-y">
      {items.map((n) => <Item key={n.id} n={n} />)}
    </div>
  );
}

function Item({ n }: { n: Notification }) {
  const { data: actor } = useQuery({
    queryKey: ["user", n.actorId],
    queryFn: () => userService.getUser(n.actorId),
  });
  const Icon = ICON[n.type];
  if (!actor) return null;
  return (
    <div className={cn("flex items-start gap-3 p-4 transition-colors", !n.read && "bg-primary-soft/30")}>
      <div className="relative shrink-0">
        <Avatar className="h-10 w-10">
          <AvatarImage src={actor.avatar} alt={actor.name} />
          <AvatarFallback>{actor.name[0]}</AvatarFallback>
        </Avatar>
        <span className="absolute -bottom-1 -right-1 h-5 w-5 grid place-items-center rounded-full bg-primary text-primary-foreground">
          <Icon className="h-3 w-3" />
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm"><span className="font-semibold">{actor.name}</span> {n.text.replace(actor.name, "")}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{relTime(n.createdAt)}</div>
        {n.type === "follow_request" && (
          <div className="flex gap-2 mt-2">
            <Button size="sm">Accept</Button>
            <Button size="sm" variant="outline">Decline</Button>
          </div>
        )}
      </div>
      {!n.read && <span className="mt-1 h-2 w-2 rounded-full bg-primary live-dot" />}
    </div>
  );
}
