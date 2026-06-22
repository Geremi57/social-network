import { Link, useRouterState } from "@tanstack/react-router";
import {
  Home, Bell, MessageCircle, Users, Calendar, Settings, Search,
  Bookmark, Compass, Sparkles, Moon, SunMedium, LogOut,
} from "lucide-react";
import { useUIStore } from "@/stores/ui";
import { useAuthStore } from "@/stores/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { notificationService } from "@/services/mockApi";
import { userDetails } from "@/routes";

const NAV: { to: string; label: string; icon: typeof Home; key?: string }[] = [
  { to: "/", label: "Home", icon: Home },
  { to: "/explore", label: "Explore", icon: Compass },
  { to: "/notifications", label: "Notifications", icon: Bell, key: "notif" },
  { to: "/messages", label: "Messages", icon: MessageCircle },
  { to: "/groups", label: "Groups", icon: Users },
  { to: "/events", label: "Events", icon: Calendar },
  { to: "/saved", label: "Saved", icon: Bookmark },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const theme = useUIStore((s) => s.theme);
  const toggleTheme = useUIStore((s) => s.toggleTheme);
  const user = useAuthStore((s) => s.user);
  const { data: unread = 0 } = useQuery({
    queryKey: ["notif-unread"],
    queryFn: () => notificationService.unreadCount(),
    refetchInterval: 60000,
  });

  console.log(user)
  return (
    <aside className="hidden md:flex md:w-64 lg:w-72 shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground h-dvh sticky top-0">
      <div className="px-5 pt-5 pb-3">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="font-bold text-lg tracking-tight">Pulse</div>
        </Link>
      </div>

      <nav className="px-3 flex-1 overflow-y-auto scrollbar-thin">
        <ul className="space-y-0.5">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.to || (item.to !== "/" && pathname.startsWith(item.to));
            return (
              <li key={item.to}>
                <Link
                  to={item.to as "/"}
                  className={cn(
                    "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                  )}
                >
                  <Icon className={cn("h-[18px] w-[18px]", active && "text-primary")} />
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.key === "notif" && unread > 0 && (
                    <Badge className="h-5 min-w-5 rounded-full px-1.5 text-[10px] bg-primary text-primary-foreground">
                      {unread}
                    </Badge>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="mt-6 px-2 text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
          Your spaces
        </div>
        <ul className="mt-2 space-y-0.5">
          {["Slow Web Club", "Design Engineering", "Reading Together", "Brooklyn Climbers"].map((g) => (
            <li key={g}>
              <Link
                to="/groups"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
              >
                <span className="h-6 w-6 rounded-md bg-gradient-to-br from-primary/30 to-primary/60" />
                <span className="truncate">{g}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t p-3 space-y-2">
        <Button variant="ghost" size="sm" className="w-full justify-start gap-2" onClick={toggleTheme}>
          {theme === "dark" ? <SunMedium className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          <span className="text-sm">{theme === "dark" ? "Light mode" : "Dark mode"}</span>
        </Button>
        {user && (
          <Link
            to="/profile/$id"
            params={{ id: user.id }}
            className="flex items-center gap-3 rounded-lg p-2 hover:bg-sidebar-accent/60 transition-colors"
          >
            <Avatar className="h-9 w-9">
              <AvatarImage src={`http://localhost:8080/${user?.avatar}`} alt={user?.firstname} />
              <AvatarFallback>{user?.firstname?.[0]}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold truncate">{user?.firstname}</div>
              <div className="text-xs text-muted-foreground truncate">@{user.email}</div>
            </div>
            <LogOut className="h-4 w-4 text-muted-foreground" />
          </Link>
        )}
      </div>
    </aside>
  );
}

export function TopNav() {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/80 backdrop-blur px-4 md:px-6">
      <Link to="/" className="md:hidden flex items-center gap-2">
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
          <Sparkles className="h-4 w-4" />
        </div>
        <span className="font-bold">Pulse</span>
      </Link>
      <div className="relative flex-1 max-w-xl mx-auto">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="search"
          placeholder="Search people, groups, posts…"
          className="h-9 w-full rounded-full border bg-muted/40 pl-9 pr-3 text-sm placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-ring/40"
        />
      </div>
      <Link
        to="/messages"
        className="hidden sm:grid h-9 w-9 place-items-center rounded-full hover:bg-accent text-muted-foreground"
        aria-label="Messages"
      >
        <MessageCircle className="h-[18px] w-[18px]" />
      </Link>
    </header>
  );
}

export function MobileNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const items = [
    { to: "/", icon: Home, label: "Home" },
    { to: "/explore", icon: Compass, label: "Explore" },
    { to: "/notifications", icon: Bell, label: "Alerts" },
    { to: "/messages", icon: MessageCircle, label: "Chat" },
    { to: "/groups", icon: Users, label: "Groups" },
  ] as const;
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 grid grid-cols-5 border-t bg-background/95 backdrop-blur">
      {items.map((it) => {
        const Icon = it.icon;
        const active = pathname === it.to;
        return (
          <Link
            key={it.to}
            to={it.to as "/"}
            className={cn(
              "flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium",
              active ? "text-primary" : "text-muted-foreground",
            )}
          >
            <Icon className="h-5 w-5" />
            <span>{it.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
