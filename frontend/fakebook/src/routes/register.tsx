import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { authService } from "@/services/mockApi";
import { useAuthStore } from "@/stores/auth";
import { AuthShell } from "./login";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Create account — Pulse" }] }),
  component: RegisterPage,
});

function RegisterPage() {
   const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
   const [dateOfBirth, setDateOfBirth] = useState("");
  const [nickname, setNickname] = useState("");
  const [aboutMe, setAboutMe] = useState("");
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);


  const [loading, setLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const signIn = useAuthStore((s) => s.signIn);
  const navigate = useNavigate();

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatar(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // if (password !== confirmPassword) {
    //   setError("Passwords do not match");
    //   return;
    // }

    if (!firstName || !lastName || !email || !password || !dateOfBirth ) {
    setError("All fields are required");
    return;
}

    setIsLoading(true);

    try {
       const formData = new FormData();
      formData.append("firstName", firstName);
      formData.append("lastName", lastName);
      formData.append("email", email);
      formData.append("password", password);
      formData.append("dateOfBirth", dateOfBirth);

      if (nickname) formData.append("nickname", nickname);
      if (aboutMe) formData.append("aboutMe", aboutMe);
      if (avatar) formData.append("avatar", avatar);

      const res = await fetch("http://localhost:8080/register", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Registration failed");
      }

      const data = await res.json();
      console.log("Register success:", data);

      window.location.href = "/"
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <AuthShell title="Create your account" subtitle="Two minutes and you're in.">
      <form
        onSubmit={handleSubmit}
        className="space-y-4"
      >

        <div className="space-y-1.5">
          <Label>First name</Label>
          <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
        </div>

        <div className="space-y-1.5">
          <Label>Last name</Label>
          <Input value={lastName} onChange={(e) => setLastName(e.target.value)} required />
        </div>

        <div className="space-y-1.5">
          <Label>Email</Label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label>Password</Label>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        
        <div className="space-y-1.5">
          <Label>Date of birth</Label>
          <Input
            type="date"
            value={dateOfBirth}
            onChange={(e) => setDateOfBirth(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label>
            Nickname <span className="text-muted-foreground text-xs">(optional)</span>
          </Label>
          <Input value={nickname} onChange={(e) => setNickname(e.target.value)} />
        </div>

        <div className="space-y-1.5">
          <Label>
            About me <span className="text-muted-foreground text-xs">(optional)</span>
          </Label>
          <Textarea
            value={aboutMe}
            onChange={(e) => setAboutMe(e.target.value)}
            rows={3}
            className="resize-none"
          />
        </div>

         <div className="space-y-1.5">
          <Label>
            Avatar <span className="text-muted-foreground text-xs">(optional)</span>
          </Label>
          <div className="flex items-center gap-3">
            {avatarPreview && (
              <img
                src={avatarPreview}
                alt="avatar preview"
                className="h-12 w-12 rounded-full object-cover border"
              />
            )}
            <Input type="file" accept="image/jpeg,image/png,image/gif" onChange={handleAvatarChange} />
          </div>
        </div>

         {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        <Button type="submit" className="w-full" disabled={loading}>{loading ? "Creating…" : "Create account"}</Button>
        <p className="text-center text-sm text-muted-foreground">
          Already have an account? <Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link>
        </p>
      </form>
    </AuthShell>
  );
}
