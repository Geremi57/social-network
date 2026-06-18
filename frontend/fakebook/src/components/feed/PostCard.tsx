import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MessageCircle, MoreHorizontal, Globe, Users as UsersIcon, Lock } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

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
  const Priv = PRIVACY[post.privacy] ?? PRIVACY.public;

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

      <div className="px-2 pb-2 grid grid-cols-2 gap-1 border-t pt-1">
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