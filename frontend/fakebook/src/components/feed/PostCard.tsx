import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, Globe, Users as UsersIcon, Lock } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";


interface Post {
  id: number;
  content: string;
  image_path: string;
  privacy: string;
  created_at: string;
  author_id: number;
  firstname: string;
  avatar: string;
  likes_count: number;
  liked_by_me: boolean;
}

const PRIVACY: Record<string, { Icon: typeof Globe; label: string }> = {
  public: { Icon: Globe, label: "Public" },
  almost_private: { Icon: UsersIcon, label: "Followers" },
  private: { Icon: Lock, label: "Only me" },
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function PostCard({ post }: { post: Post }) {
  
  // const author = postService.getAuthor(post.authorId);
  const qc = useQueryClient();
  const [optimistic, setOptimistic] = useState<{ liked: boolean; likes: number } | null>(null);

   const likeMut = useMutation({
    mutationFn: async () => {
      const res = await fetch(`http://localhost:8080/posts/${post.id}/like`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to toggle like");
      return res.json();
    },
    onMutate: () => {
      setOptimistic({
        liked: !post.liked_by_me,
        count: post.likes_count + (post.liked_by_me ? -1 : 1),
      });
    },
    onError: () => {
      setOptimistic(null);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["feed"] });
      qc.invalidateQueries({ queryKey: ["user-posts"] });
    },

    
  });

  // const Priv = PRIVACY[post.privacy] ?? PRIVACY.public;

   const liked = optimistic?.liked ?? post.liked_by_me;
  const likesCount = optimistic?.count ?? post.likes_count;

  const Priv = PRIVACY[post.privacy];

  return (
    <article className="surface-card overflow-hidden">
      <header className="flex items-start gap-3 p-4">
        <Link to="/profile/$id" params={{ id: String(post.author_id) }}>
          <Avatar className="h-10 w-10">
              <AvatarImage src={`http://localhost:8080/${post.avatar}`} alt={post.firstname} />
            <AvatarFallback>{post.firstname?.[0]}</AvatarFallback>
          </Avatar>
        </Link>
        <div className="min-w-0 flex-1">
          <Link
            to="/profile/$id"
            params={{ id: String(post.author_id) }}
            className="font-semibold text-sm hover:underline truncate"
          >
            {post.firstname}
          </Link>
          <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
            <span>{timeAgo(post.created_at)}</span>
            <span>·</span>
            <Priv.Icon className="h-3 w-3" />
            <span>{Priv.label}</span>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" aria-label="More">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </header>

      {post.content && (
        <div className="px-4 pb-3 text-[15px] leading-relaxed whitespace-pre-wrap">
          {post.content}
        </div>
      )}

      {post.image_path && (
        <div className="border-y bg-muted/40">
          <img
            src={`http://localhost:8080/${post.image_path}`}
            alt=""
            loading="lazy"
            className="w-full max-h-[520px] object-cover"
          />
        </div>
      )}

      {likesCount > 0 && (
        <div className="px-4 py-2 text-xs text-muted-foreground border-t">
          {likesCount} {likesCount === 1 ? "like" : "likes"}
        </div>
      )}

      <div className="px-2 pb-2 grid grid-cols-2 gap-1 border-t pt-1">
        <Action
          onClick={() => likeMut.mutate()}
          active={liked}
          activeClass="text-rose-500"
          icon={<Heart className={cn("h-[18px] w-[18px]", liked && "fill-current")} />}
          label="Like"
        />
        <Action icon={<MessageCircle className="h-[18px] w-[18px]" />} label="Comment" />
      </div>
    </article>
  );
}

function Action({
  icon, label, onClick, active, activeClass,
}: { icon: React.ReactNode; label: string; onClick?: () => void; active?: boolean; activeClass?: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition-colors",
        "text-muted-foreground hover:bg-accent hover:text-foreground",
        active && activeClass,
      )}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}