import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  component: ResetPage,
  head: () => ({ meta: [{ title: "איפוס סיסמא" }] }),
});

function ResetPage() {
  const nav = useNavigate();
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: pw });
      if (error) throw error;
      toast.success("הסיסמא עודכנה");
      nav({ to: "/quiz" });
    } catch (e: any) {
      toast.error(e.message ?? "שגיאה");
    } finally { setBusy(false); }
  }

  return (
    <div className="container mx-auto max-w-md px-4 py-12">
      <h1 className="font-display text-3xl font-bold text-primary">איפוס סיסמא</h1>
      <form onSubmit={submit} className="mt-6 grid gap-4 rounded-2xl border border-border/60 bg-card/80 p-6 shadow-soft">
        <div>
          <Label className="mb-1.5 block">סיסמא חדשה</Label>
          <Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} required minLength={6} />
        </div>
        <Button type="submit" disabled={busy}>{busy ? "..." : "עדכן סיסמא"}</Button>
      </form>
    </div>
  );
}
