import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/_admin/export-scores")({
  component: ExportScores,
  head: () => ({ meta: [{ title: "תוצאות מעודכנות" }] }),
});

function ExportScores() {
  const [busy, setBusy] = useState(false);

  async function exportXlsx() {
    setBusy(true);
    try {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("user_id, group_user_name, group_display_name, contact_first_name, contact_last_name, contact_email, contact_phone, contact_pref_channel");
      if (error) throw error;
      const { data: scores, error: sErr } = await supabase.from("score").select("user_id, score");
      if (sErr) throw sErr;
      const totals = new Map<string, number>();
      (scores ?? []).forEach((s) => totals.set(s.user_id, (totals.get(s.user_id) ?? 0) + (s.score ?? 0)));

      const rows = (profiles ?? []).map((p) => ({
        "שם משתמש": p.group_user_name,
        "שם הקבוצה/משפחה": p.group_display_name,
        "שם איש הקשר": `${p.contact_first_name ?? ""} ${p.contact_last_name ?? ""}`.trim(),
        "אימייל": p.contact_email ?? "",
        "טלפון": p.contact_phone ?? "",
        "תקשורת מועדפת": p.contact_pref_channel ?? "",
        "ניקוד מצטבר": totals.get(p.user_id) ?? 0,
      }));

      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "תוצאות");
      const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
      XLSX.writeFile(wb, `תוצאות אחרונות_${ts}.xlsx`);
      toast.success("הקובץ ירד בהצלחה");
    } catch (e: any) {
      toast.error(e.message ?? "שגיאה");
    } finally { setBusy(false); }
  }

  return (
    <div className="container mx-auto max-w-xl px-4 py-12 text-center">
      <h1 className="font-display text-3xl font-bold text-primary">תוצאות מעודכנות</h1>
      <p className="mt-3 text-muted-foreground">לחיצה על הכפתור תוריד קובץ Excel עם רשימת המשתמשים, פרטי קשר וניקוד מצטבר.</p>
      <Button onClick={exportXlsx} disabled={busy} size="lg" className="mt-6">{busy ? "מייצא..." : "הורדת קובץ Excel"}</Button>
    </div>
  );
}
