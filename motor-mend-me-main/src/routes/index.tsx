import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Start My Car — Fix It Yourself" },
      { name: "description", content: "Search your car make and problem. Get video guides and manuals to fix your car." },
      { property: "og:title", content: "Start My Car — Fix It Yourself" },
      { property: "og:description", content: "Search your car make and problem. Get video guides and manuals to fix your car." },
    ],
  }),
  component: Index,
});

interface User {
  id: number;
  username: string;
  email: string;
}

function Index() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    fetch("http://localhost:8080/me", { credentials: "include" })
      .then((res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((data) => {
        console.log("me response:", data);

        if (data && data.id) {
          setUser(data);
        }
      })
      .catch(() => setUser(null));
  }, []);

  const handleLogout = async () => {
    await fetch("http://localhost:8080/logout", {
      method: "POST",
      credentials: "include",
    });
    setUser(null);
    window.location.href = "/login";
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between px-6 py-5 md:px-10">
        <span className="text-lg font-bold tracking-tight text-foreground">
          Start My Car
        </span>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-sm">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-medium">{user.username}</span>
              </div>
              <button
                onClick={handleLogout}
                className="text-sm text-muted-foreground hover:text-destructive transition-colors"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm">Sign in</Button>
              </Link>
              <Link to="/register">
                <Button size="sm" className="font-semibold">Get started</Button>
              </Link>
            </>
          )}
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <h1 className="max-w-md text-4xl font-bold leading-tight tracking-tight text-foreground md:max-w-lg md:text-5xl">
          Diagnose &amp; fix your car
        </h1>
        <p className="mt-4 max-w-sm text-base text-muted-foreground md:max-w-md md:text-lg">
          Search by make and problem. Access video guides and repair manuals — subscribe or pay per guide.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link to="/register">
            <Button size="lg" className="h-12 px-8 text-base font-semibold">
              Get started
            </Button>
          </Link>
          <Link to="/login">
            <Button variant="outline" size="lg" className="h-12 px-8 text-base font-semibold">
              Sign in
            </Button>
          </Link>
        </div>
      </main>

      <footer className="px-6 py-6 text-center text-xs text-muted-foreground md:px-10">
        Start My Car. Built for DIY mechanics.
      </footer>
    </div>
  );
}