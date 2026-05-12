import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { UploadCloud } from "lucide-react";

export const Route = createFileRoute("/_authenticated/_admin/upload-quiz")({
  component: UploadQuizPage,
  head: () => ({ meta: [{ title: "טעינת שאלות לחידון" }] }),
});

type Row = { question_num: number; question_text: string; answers: string; correct_answer: string };

function UploadQuizPage() {
  const nav = useNavigate();
  const [subject, setSubject] = useState("");
  const [effective, setEffective] = useState<string>(new Date().toISOString().slice(0, 10));
  const [expiration, setExpiration] = useState<string>("");
  const [rows, setRows] = useState<Row[]>([]);
  const [fileName, setFileName] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);

  function handleFile(file: File) {
    setFileName(file.name);
    const r = new FileReader();
    r.onload = (e) => {
      const ab = e.target?.result as ArrayBuffer;
      const wb = XLSX.read(ab, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const arr = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1 });
      const parsed: Row[] = [];
      // start from row 2 → index 1
      for (let i = 1; i < arr.length; i++) {
        const r = arr[i];
        if (!r || r.length === 0) continue;
        const [a, b, c, d] = r;
        if (a == null && b == null) continue;
        parsed.push({
          question_num: Number(a),
          question_text: String(b ?? "").trim(),
          answers: String(c ?? "").trim(),
          correct_answer: String(d ?? "").trim(),
        });
      }
      setRows(parsed);
      toast.success(`נטענו ${parsed.length} שאלות מהקובץ`);
    };
    r.readAsArrayBuffer(file);
  }

  async function ensureActiveSession(): Promise<number> {
    const today = new Date().toISOString().slice(0, 10);
    const { data: sessions } = await supabase
      .from("quiz_session")
      .select("session_id, effective_date, expiration_date")
      .lt("effective_date", today)
      .is("expiration_date", null)
      .order("effective_date", { ascending: false })
      .limit(1);
    if (sessions && sessions.length > 0) return sessions[0].session_id;
    // create one effective yesterday
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const { data, error } = await supabase
      .from("quiz_session")
      .insert({ effective_date: yesterday, expiration_date: null, description: "מחזור חידונים" })
      .select("session_id")
      .single();
    if (error) throw error;
    return data.session_id;
  }

  async function submit() {
    if (!subject || !effective || !expiration) return toast.error("נא למלא נושא ותאריכים");
    if (rows.length === 0) return toast.error("נא להעלות קובץ אקסל עם שאלות");
    setBusy(true);
    try {
      const session_id = await ensureActiveSession();
      const { data: quiz, error } = await supabase
        .from("quiz")
        .insert({ subject, effective_date: effective, expiration_date: expiration, session_id })
        .select("quiz_id")
        .single();
      if (error) throw error;
      const payload = rows.map((r) => ({ ...r, quiz_id: quiz.quiz_id }));
      const { error: qErr } = await supabase.from("questions").insert(payload);
      if (qErr) throw qErr;
      toast.success("החידון נשמר בהצלחה");
      nav({ to: "/admin" });
    } catch (e: any) {
      toast.error(e.message ?? "שגיאה בשמירה");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-10">
      <h1 className="font-display text-3xl font-bold text-primary">טעינת שאלות לחידון</h1>

      <div className="mt-6 grid gap-4 rounded-2xl border border-border/60 bg-card/85 p-6 shadow-soft">
        <div>
          <Label className="mb-1.5 block">נושא החידון (לדוגמא: יהושע פרק א')</Label>
          <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label className="mb-1.5 block">תאריך התחלה</Label>
            <Input type="date" value={effective} onChange={(e) => setEffective(e.target.value)} />
          </div>
          <div>
            <Label className="mb-1.5 block">תאריך סיום</Label>
            <Input type="date" value={expiration} onChange={(e) => setExpiration(e.target.value)} />
          </div>
        </div>

        <div
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault(); setDrag(false);
            const f = e.dataTransfer.files?.[0];
            if (f) handleFile(f);
          }}
          className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition ${drag ? "border-accent bg-accent/10" : "border-border bg-background/60"}`}
        >
          <UploadCloud className="h-10 w-10 text-accent" />
          <p className="mt-2 font-semibold">גרור לכאן קובץ אקסל</p>
          <p className="text-sm text-muted-foreground">או</p>
          <label className="mt-2 cursor-pointer rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            עיון בקבצים
            <input type="file" accept=".xlsx,.xls" hidden onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
          </label>
          {fileName && <p className="mt-3 text-sm text-muted-foreground">קובץ: {fileName} · {rows.length} שאלות</p>}
        </div>

        <Button onClick={submit} disabled={busy} size="lg">{busy ? "שומר..." : "שמור חידון"}</Button>
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        מבנה האקסל (מתחיל משורה 2): A=מספר שאלה, B=טקסט שאלה, C=תשובות מופרדות בפסיק-נקודה (;), D=התשובה הנכונה.
      </p>
    </div>
  );
}
