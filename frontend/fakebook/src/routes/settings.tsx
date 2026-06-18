import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/stores/auth";
import { useUIStore } from "@/stores/ui";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Moon, SunMedium, Bell, Eye, Lock, AccessibilityIcon, User } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — Pulse" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const { theme, setTheme } = useUIStore();
  if (!user) return null;
  return (
    <AppShell>
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your account, privacy, and preferences.</p>
      </header>
      <Tabs defaultValue="account" orientation="vertical">
        <div className="grid md:grid-cols-[180px_1fr] gap-6">
          <TabsList className="flex md:flex-col h-auto bg-transparent gap-1 p-0 overflow-x-auto md:overflow-visible">
            {[
              { v: "account", l: "Account", I: User },
              { v: "privacy", l: "Privacy", I: Lock },
              { v: "appearance", l: "Appearance", I: Eye },
              { v: "notifications", l: "Notifications", I: Bell },
              { v: "accessibility", l: "Accessibility", I: AccessibilityIcon },
            ].map((t) => (
              <TabsTrigger key={t.v} value={t.v} className="md:w-full md:justify-start gap-2 data-[state=active]:bg-accent">
                <t.I className="h-4 w-4" />{t.l}
              </TabsTrigger>
            ))}
          </TabsList>
          <div className="space-y-4 min-w-0">
            <TabsContent value="account" className="space-y-4">
              <Card title="Profile">
                <div className="flex items-center gap-4 mb-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback>{user.name[0]}</AvatarFallback>
                  </Avatar>
                  <Button variant="outline" size="sm">Change avatar</Button>
                </div>
                <Field label="Display name" defaultValue={user.name} />
                <Field label="Handle" defaultValue={user.handle} prefix="@" />
                <Field label="Bio" defaultValue={user.bio} />
                <Field label="Location" defaultValue={user.location} />
                <div className="pt-2">
                  <Button onClick={() => toast.success("Profile saved")}>Save changes</Button>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="privacy" className="space-y-4">
              <Card title="Privacy">
                <Toggle label="Private profile" hint="Only your followers can see your posts." />
                <Toggle label="Allow follow requests" defaultChecked hint="Requires approval before following." />
                <Toggle label="Show online status" defaultChecked />
                <Toggle label="Allow message requests from anyone" />
              </Card>
            </TabsContent>

            <TabsContent value="appearance" className="space-y-4">
              <Card title="Theme">
                <div className="grid grid-cols-2 gap-3">
                  <ThemeChoice active={theme === "light"} onClick={() => setTheme("light")} icon={<SunMedium className="h-4 w-4" />} label="Light" />
                  <ThemeChoice active={theme === "dark"} onClick={() => setTheme("dark")} icon={<Moon className="h-4 w-4" />} label="Dark" />
                </div>
              </Card>
              <Card title="Density">
                <div className="grid grid-cols-2 gap-3">
                  <ThemeChoice active label="Comfortable" />
                  <ThemeChoice label="Compact" />
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-4">
              <Card title="Notifications">
                <Toggle label="Mentions" defaultChecked />
                <Toggle label="Comments on your posts" defaultChecked />
                <Toggle label="New followers" defaultChecked />
                <Toggle label="Group invitations" defaultChecked />
                <Toggle label="Event reminders" defaultChecked />
                <Toggle label="Email digest" hint="Weekly summary of activity" />
              </Card>
            </TabsContent>

            <TabsContent value="accessibility" className="space-y-4">
              <Card title="Accessibility">
                <Toggle label="Reduce motion" hint="Limits animations and parallax." />
                <Toggle label="Larger text" />
                <Toggle label="High contrast borders" />
              </Card>
            </TabsContent>
          </div>
        </div>
      </Tabs>
    </AppShell>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="surface-card p-5">
      <h2 className="font-semibold mb-4">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Field({ label, defaultValue, prefix }: { label: string; defaultValue?: string; prefix?: string }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="flex">
        {prefix && <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 bg-muted text-muted-foreground text-sm">{prefix}</span>}
        <Input defaultValue={defaultValue} className={prefix ? "rounded-l-none" : ""} />
      </div>
    </div>
  );
}

function Toggle({ label, hint, defaultChecked }: { label: string; hint?: string; defaultChecked?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3 py-1.5 border-b last:border-0">
      <div className="min-w-0">
        <div className="text-sm font-medium">{label}</div>
        {hint && <div className="text-xs text-muted-foreground mt-0.5">{hint}</div>}
      </div>
      <Switch defaultChecked={defaultChecked} />
    </div>
  );
}

function ThemeChoice({ label, active, onClick, icon }: { label: string; active?: boolean; onClick?: () => void; icon?: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-lg border p-3 text-sm font-medium transition-colors ${active ? "border-primary bg-primary-soft" : "hover:bg-accent"}`}
    >
      {icon}{label}
    </button>
  );
}
