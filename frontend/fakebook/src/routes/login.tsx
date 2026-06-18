import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles } from "lucide-react";
import { useState } from "react";
import { authService } from "@/services/mockApi";
import { useAuthStore } from "@/stores/auth";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — Pulse" }] }),
  component: LoginPage,
});

function LoginPage() {
   const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("http://localhost:8080/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Login failed");
      }

      // Handle success — token will be in response, connect to your auth flow
      const data = await res.json();
      console.log("Login success:", data);

      localStorage.setItem("token", data.token);

      window.location.href = "/";
      // TODO: store token, redirect to dashboard
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };
  return <AuthShell title="Welcome back" subtitle="Sign in to your Pulse account.">

     {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label>Email</Label>
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div className="space-y-1.5">
        <div className="flex justify-between">
          <Label>Password</Label>
          <Link to="/forgot-password" className="text-xs text-primary hover:underline">Forgot?</Link>
        </div>
        <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? "Signing in…" : "Sign in"}</Button>
      <p className="text-center text-sm text-muted-foreground">
        New here? <Link to="/register" className="text-primary font-medium hover:underline">Create an account</Link>
      </p>
    </form>
  </AuthShell>;
}

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="min-h-dvh grid lg:grid-cols-2">
      <div className="hidden lg:flex bg-gradient-to-br from-primary to-fuchsia-600 text-primary-foreground p-12 flex-col justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/20"><Sparkles className="h-5 w-5" /></div>
          <span className="font-bold text-lg">Pulse</span>
        </Link>
        <div>
          <h1 className="text-4xl font-bold leading-tight max-w-md">A calmer place for the people and ideas you care about.</h1>
          <p className="mt-4 text-white/80 max-w-md">Pulse is a community-first social network — built for conversations that last longer than a scroll.</p>
        </div>
        <p className="text-xs text-white/60">© Pulse 2026 — demo only.</p>
      </div>
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <Link to="/" className="lg:hidden mb-8 inline-flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground"><Sparkles className="h-5 w-5" /></div>
            <span className="font-bold text-lg">Pulse</span>
          </Link>
          <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
          <p className="text-sm text-muted-foreground mt-1 mb-6">{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  );
}
