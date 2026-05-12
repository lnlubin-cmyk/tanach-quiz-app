import { createFileRoute, Link } from "@tanstack/react-router";
import { Upload, Download } from "lucide-react";

export const Route = createFileRoute("/_authenticated/_admin/admin")({
  component: AdminHome,
  head: () => ({ meta: [{ title: "ניהול החידון" }] }),
});

function AdminHome() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-display text-3xl font-bold text-primary md:text-4xl">ניהול החידון</h1>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <Link to="/upload-quiz" className="group rounded-2xl border border-border/60 bg-card/85 p-6 shadow-soft transition hover:bg-accent/5 hover:shadow-warm">
          <Upload className="h-8 w-8 text-accent" />
          <h2 className="mt-3 font-display text-xl font-bold">טעינת שאלות לחידון</h2>
          <p className="mt-1 text-sm text-muted-foreground">העלאת קובץ אקסל ויצירת חידון חדש.</p>
        </Link>
        <Link to="/export-scores" className="group rounded-2xl border border-border/60 bg-card/85 p-6 shadow-soft transition hover:bg-accent/5 hover:shadow-warm">
          <Download className="h-8 w-8 text-accent" />
          <h2 className="mt-3 font-display text-xl font-bold">תוצאות מעודכנות</h2>
          <p className="mt-1 text-sm text-muted-foreground">הורדת קובץ אקסל עם רשימת המשתמשים והניקוד.</p>
        </Link>
      </div>
    </div>
  );
}
