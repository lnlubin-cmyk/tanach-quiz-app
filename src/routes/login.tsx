import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({ meta: [{ title: "כניסה - חידון התנ״ך" }] }),
});

function LoginPage() {
  const nav = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [showReset, setShowReset] = useState(false);
  const [busy, setBusy] = useState(false);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const { data: email, error: rErr } = await supabase.rpc("email_for_username", { _username: username });
      if (rErr) throw rErr;
      if (!email) {
        toast.error("שם משתמש לא קיים");
        return;
      }
      const { error } = await supabase.auth.signInWithPassword({ email: email as string, password });
      if (error) throw error;
      toast.success("ברוכים הבאים!");
      nav({ to: "/quiz" });
    } catch (e: any) {
      toast.error(e.message ?? "שגיאה בכניסה");
    } finally {
      setBusy(false);
    }
  }

  async function reset(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success("נשלח אימייל לאיפוס הסיסמא");
      setShowReset(false);
    } catch (e: any) {
      toast.error(e.message ?? "שגיאה");
    } finally {
      setBusy(false);
    }
  }

  async function oauth(provider: "google" | "apple") {
    setBusy(true);
    try {
      const result = await lovable.auth.signInWithOAuth(provider, {
        redirect_uri: `${window.location.origin}/quiz`,
      });
      if (result.error) throw result.error;
      if (!result.redirected) nav({ to: "/quiz" });
    } catch (e: any) {
      toast.error(e.message ?? "שגיאה בכניסה");
      setBusy(false);
    }
  }

  return (
    <div className="container mx-auto max-w-md px-4 py-12">
      <h1 className="font-display text-3xl font-bold text-primary md:text-4xl">כניסת משתמש רשום</h1>
      <p className="mt-2 text-muted-foreground">אין לכם חשבון? <Link to="/register" className="text-primary underline">להרשמה</Link></p>

      {!showReset ? (
        <>
        <div className="mt-8 grid gap-3">
          <Button type="button" variant="outline" disabled={busy} onClick={() => oauth("google")}>
            המשך עם Google
          </Button>
          <Button type="button" variant="outline" disabled={busy} onClick={() => oauth("apple")}>
            המשך עם Apple
          </Button>
          <div className="relative my-2 text-center text-xs text-muted-foreground">
            <span className="bg-background px-2 relative z-10">או</span>
            <div className="absolute inset-x-0 top-1/2 h-px bg-border" />
          </div>
        </div>
        <form onSubmit={login} className="grid gap-4 rounded-2xl border border-border/60 bg-card/80 p-6 shadow-soft">
          <div>
            <Label className="mb-1.5 block">שם משתמש</Label>
            <Input dir="ltr" value={username} onChange={(e) => setUsername(e.target.value)} required />
          </div>
          <div>
            <Label className="mb-1.5 block">סיסמא</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <Button type="submit" disabled={busy}>{busy ? "..." : "כניסה"}</Button>
          <button type="button" className="text-sm text-primary underline" onClick={() => setShowReset(true)}>
            שכחתי סיסמא
          </button>
        </form>
        </>
      ) : (
        <form onSubmit={reset} className="mt-8 grid gap-4 rounded-2xl border border-border/60 bg-card/80 p-6 shadow-soft">
          <div>
            <Label className="mb-1.5 block">אימייל לאיפוס סיסמא</Label>
            <Input dir="ltr" type="email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} required />
          </div>
          <Button type="submit" disabled={busy}>{busy ? "..." : "שלח קישור איפוס"}</Button>
          <button type="button" className="text-sm text-muted-foreground underline" onClick={() => setShowReset(false)}>
            חזרה לכניסה
          </button>
        </form>
      )}
    </div>
  );
}
