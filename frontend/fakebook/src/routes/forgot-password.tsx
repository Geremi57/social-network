import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { AuthShell } from "./login";
import { toast } from "sonner";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Reset password — Pulse" }] }),
  component: ForgotPage,
});

function ForgotPage() {
  const [email, setEmail] = useState("");
  return (
    <AuthShell title="Reset your password" subtitle="We'll send a reset link to your email.">
      <form onSubmit={(e) => { e.preventDefault(); toast.success("Reset link sent (demo)"); }} className="space-y-4">
        <div className="space-y-1.5">
          <Label>Email</Label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <Button type="submit" className="w-full">Send reset link</Button>
        <p className="text-center text-sm text-muted-foreground">
          Remembered? <Link to="/login" className="text-primary font-medium hover:underline">Back to sign in</Link>
        </p>
      </form>
    </AuthShell>
  );
}
