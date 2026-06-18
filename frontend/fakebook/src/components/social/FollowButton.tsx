import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { userService } from "@/services/mockApi";
import { Check, UserPlus, Clock } from "lucide-react";
import type { FollowState } from "@/types";

export function FollowButton({ userId, size = "sm" }: { userId: string; size?: "sm" | "default" }) {
  const qc = useQueryClient();
  const { data: state } = useQuery({
    queryKey: ["follow-state", userId],
    queryFn: () => userService.getFollowState(userId),
  });

  const follow = useMutation({
    mutationFn: () => userService.follow(userId),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ["follow-state", userId] });
      const prev = qc.getQueryData<FollowState>(["follow-state", userId]);
      qc.setQueryData(["follow-state", userId], "following");
      return { prev };
    },
    onError: (_e, _v, ctx) => qc.setQueryData(["follow-state", userId], ctx?.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: ["follow-state", userId] }),
  });

  const unfollow = useMutation({
    mutationFn: () => userService.unfollow(userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["follow-state", userId] }),
  });

  const cancel = useMutation({
    mutationFn: () => userService.cancelRequest(userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["follow-state", userId] }),
  });

  if (!state) return <Button size={size} disabled variant="secondary">…</Button>;

  if (state === "following" || state === "mutual") {
    return (
      <Button size={size} variant="secondary" onClick={() => unfollow.mutate()}>
        <Check className="h-4 w-4 mr-1.5" />
        {state === "mutual" ? "Friends" : "Following"}
      </Button>
    );
  }
  if (state === "request_sent") {
    return (
      <Button size={size} variant="outline" onClick={() => cancel.mutate()}>
        <Clock className="h-4 w-4 mr-1.5" />
        Requested
      </Button>
    );
  }
  return (
    <Button size={size} onClick={() => follow.mutate()}>
      <UserPlus className="h-4 w-4 mr-1.5" />
      {state === "follows_you" ? "Follow back" : "Follow"}
    </Button>
  );
}

export function PersonRow({ userId }: { userId: string }) {
  const { data: user } = useQuery({
    queryKey: ["user", userId],
    queryFn: () => userService.getUser(userId),
  });
  if (!user) return null;
  return (
    <div className="flex items-center gap-3 py-2">
      <Link to="/profile/$id" params={{ id: user.id }}>
        <Avatar className="h-10 w-10">
          <AvatarImage src={user.avatar} alt={user.name} />
          <AvatarFallback>{user.name[0]}</AvatarFallback>
        </Avatar>
      </Link>
      <div className="min-w-0 flex-1">
        <Link to="/profile/$id" params={{ id: user.id }} className="block font-semibold text-sm truncate hover:underline">
          {user.name}
        </Link>
        <div className="text-xs text-muted-foreground truncate">@{user.handle} · {user.bio}</div>
      </div>
      <FollowButton userId={user.id} />
    </div>
  );
}
