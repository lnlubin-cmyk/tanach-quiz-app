import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { toast } from "sonner";
import { Pencil, Trash2, Plus } from "lucide-react";

export const Route = createFileRoute("/memorial")({
  component: MemorialPage,
  head: () => ({ meta: [{ title: "דברים לזכרה" }] }),
});

function MemorialPage() {
  const { isAdmin } = useAuth();
  const qc = useQueryClient();
  const { data: items = [], isLoading } = useQuery({
    queryKey: ["memorial-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("memorial_content")
        .select("content_id, text, image_url, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const [newText, setNewText] = useState("");
  const [newImg, setNewImg] = useState("");
  const [editId, setEditId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");

  async function add() {
    if (!newText.trim()) return;
    const { error } = await supabase.from("memorial_content").insert({ text: newText, image_url: newImg || null });
    if (error) return toast.error(error.message);
    setNewText(""); setNewImg("");
    qc.invalidateQueries({ queryKey: ["memorial-list"] });
    qc.invalidateQueries({ queryKey: ["memorial-public"] });
    toast.success("נוסף בהצלחה");
  }
  async function update(id: number) {
    const { error } = await supabase.from("memorial_content").update({ text: editText }).eq("content_id", id);
    if (error) return toast.error(error.message);
    setEditId(null);
    qc.invalidateQueries({ queryKey: ["memorial-list"] });
    qc.invalidateQueries({ queryKey: ["memorial-public"] });
  }
  async function del(id: number) {
    if (!confirm("למחוק תוכן זה?")) return;
    const { error } = await supabase.from("memorial_content").delete().eq("content_id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["memorial-list"] });
    qc.invalidateQueries({ queryKey: ["memorial-public"] });
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-display text-3xl font-bold text-primary md:text-4xl">דברים לזכרה</h1>

      {isAdmin && (
        <div className="mt-6 rounded-xl border border-border/60 bg-card/80 p-5 shadow-soft">
          <h2 className="mb-3 font-display text-lg font-bold">הוספת תוכן חדש</h2>
          <Input placeholder="כתובת תמונה (לא חובה)" value={newImg} onChange={(e) => setNewImg(e.target.value)} className="mb-2" />
          <Textarea placeholder="טקסט לזכרה..." value={newText} onChange={(e) => setNewText(e.target.value)} rows={4} />
          <Button onClick={add} className="mt-3 gap-1"><Plus className="h-4 w-4" /> הוסף</Button>
        </div>
      )}

      <div className="mt-8 grid gap-5">
        {isLoading && <p className="text-muted-foreground">טוען...</p>}
        {!isLoading && items.length === 0 && <p className="text-muted-foreground">עדיין אין תוכן לזכרה.</p>}
        {items.map((it) => (
          <article key={it.content_id} className="rounded-xl border border-border/60 bg-card/80 p-6 shadow-soft">
            {it.image_url && <img src={it.image_url} alt="" loading="lazy" className="mb-4 max-h-72 w-full rounded-lg object-cover" />}
            {editId === it.content_id ? (
              <>
                <Textarea value={editText} onChange={(e) => setEditText(e.target.value)} rows={5} />
                <div className="mt-3 flex gap-2">
                  <Button onClick={() => update(it.content_id)}>שמור</Button>
                  <Button variant="ghost" onClick={() => setEditId(null)}>בטל</Button>
                </div>
              </>
            ) : (
              <p className="whitespace-pre-line text-base leading-relaxed">{it.text}</p>
            )}
            {isAdmin && editId !== it.content_id && (
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="ghost" onClick={() => { setEditId(it.content_id); setEditText(it.text); }}>
                  <Pencil className="h-4 w-4" /> ערוך
                </Button>
                <Button size="sm" variant="ghost" onClick={() => del(it.content_id)} className="text-destructive">
                  <Trash2 className="h-4 w-4" /> מחק
                </Button>
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
