import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { useQuery } from "@tanstack/react-query";
import { postService } from "@/services/mockApi";
import { PostCard } from "@/components/feed/PostCard";
import { Bookmark } from "lucide-react";

export const Route = createFileRoute("/saved")({
  head: () => ({ meta: [{ title: "Saved — Pulse" }] }),
  component: SavedPage,
});

function SavedPage() {
  const { data = [] } = useQuery({ queryKey: ["feed", "latest"], queryFn: () => postService.feed("latest") });
  const saved = data.filter((p) => p.saved);
  return (
    <AppShell>
      <header className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight">Saved</h1>
        <p className="text-sm text-muted-foreground mt-1">Posts you've bookmarked to revisit later.</p>
      </header>
      {saved.length === 0 ? (
        <div className="surface-card p-12 text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-muted grid place-items-center mb-3">
            <Bookmark className="h-5 w-5 text-muted-foreground" />
          </div>
          <h3 className="font-semibold">No saved posts yet</h3>
          <p className="text-sm text-muted-foreground mt-1">Tap the bookmark icon on any post to save it here.</p>
        </div>
      ) : (
        <div className="space-y-4">{saved.map((p) => <PostCard key={p.id} post={p} />)}</div>
      )}
    </AppShell>
  );
}
