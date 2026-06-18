import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { eventService } from "@/services/mockApi";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Calendar, MapPin, Users, Globe } from "lucide-react";
import type { EventItem } from "@/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/events")({
  head: () => ({ meta: [{ title: "Events — Pulse" }] }),
  component: EventsPage,
});

function EventsPage() {
  return (
    <AppShell>
      <header className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Events</h1>
          <p className="text-sm text-muted-foreground mt-1">In-person, online, and everywhere in between.</p>
        </div>
        <Button>Create event</Button>
      </header>

      <Tabs defaultValue="upcoming">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="joined">Going</TabsTrigger>
          <TabsTrigger value="created">Hosting</TabsTrigger>
        </TabsList>
        <TabsContent value="upcoming" className="mt-4"><Grid filter="upcoming" /></TabsContent>
        <TabsContent value="joined" className="mt-4"><Grid filter="joined" /></TabsContent>
        <TabsContent value="created" className="mt-4"><Grid filter="created" /></TabsContent>
      </Tabs>
    </AppShell>
  );
}

function Grid({ filter }: { filter: "upcoming" | "joined" | "created" }) {
  const { data = [], isLoading } = useQuery({
    queryKey: ["events", filter],
    queryFn: () => eventService.list(filter),
  });
  if (isLoading) return <div className="grid sm:grid-cols-2 gap-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-56 surface-card animate-pulse" />)}</div>;
  if (data.length === 0) {
    return (
      <div className="surface-card p-12 text-center">
        <div className="mx-auto h-12 w-12 rounded-full bg-muted grid place-items-center mb-3">
          <Calendar className="h-5 w-5 text-muted-foreground" />
        </div>
        <h3 className="font-semibold">Nothing here yet</h3>
        <p className="text-sm text-muted-foreground mt-1">Events you're attending or hosting will show up here.</p>
      </div>
    );
  }
  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {data.map((e) => <EventCard key={e.id} e={e} />)}
    </div>
  );
}

function EventCard({ e }: { e: EventItem }) {
  const qc = useQueryClient();
  const toggle = useMutation({
    mutationFn: () => eventService.toggleGoing(e.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["events"] }),
  });
  const date = new Date(e.startsAt);
  return (
    <article className="surface-card overflow-hidden">
      <div className="relative h-32 bg-muted">
        <img src={e.cover} alt="" className="w-full h-full object-cover" />
        <div className="absolute top-3 left-3 rounded-md bg-background/90 backdrop-blur px-2 py-1 text-center min-w-[44px]">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{date.toLocaleString(undefined, { month: "short" })}</div>
          <div className="text-lg font-bold leading-none">{date.getDate()}</div>
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-semibold truncate">{e.title}</h3>
        <div className="mt-2 space-y-1 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />{date.toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</div>
          <div className="flex items-center gap-1.5">{e.online ? <Globe className="h-3.5 w-3.5" /> : <MapPin className="h-3.5 w-3.5" />}{e.location}</div>
          <div className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" />{e.attendees} going</div>
        </div>
        <div className="mt-3 flex gap-2">
          <Button size="sm" variant={e.going ? "secondary" : "default"} onClick={() => toggle.mutate()} className={cn("flex-1")}>
            {e.going ? "Going" : "Join event"}
          </Button>
          <Button size="sm" variant="outline">Details</Button>
        </div>
      </div>
    </article>
  );
}
