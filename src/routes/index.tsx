import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import heroImg from "@/assets/memorial-hero.jpg";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "חידון התנ״ך - בית" },
      { name: "description", content: "ברוכים הבאים לחידון התנ״ך - חידון יומי לזכרה." },
    ],
  }),
});

function Index() {
  const { data: memorial } = useQuery({
    queryKey: ["memorial-public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("memorial_content")
        .select("content_id, text")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="container mx-auto px-4 py-10 md:py-16">
      <section className="mx-auto max-w-4xl text-center">
        <h1 className="font-display text-4xl font-bold text-primary md:text-6xl text-balance">
          חידון התנ״ך
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
          חידון יומי על ספרי התנ״ך, נלמד ונזכור יחד. לעילוי נשמתה.
        </p>

        <div className="relative mx-auto mt-10 overflow-hidden rounded-2xl shadow-warm ring-1 ring-border/60">
          <img
            src={heroImg}
            alt="פתיח לזכרה - ספר תנ״ך פתוח לאור נר"
            width={1920}
            height={1080}
            className="h-auto w-full"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/40 to-transparent" />
        </div>

        <div className="mx-auto mt-8 max-w-3xl rounded-xl border border-border/60 bg-card/80 p-6 shadow-soft md:p-8">
          <h2 className="font-display text-2xl font-bold text-primary md:text-3xl">לזכרה</h2>
          <p className="mt-4 whitespace-pre-line text-base leading-relaxed text-foreground/90 md:text-lg">
            {memorial?.text ??
              "במקום הזה ייכתבו דברי הזכרה והגעגוע. ניתן לערוך את התוכן דרך עמוד הניהול."}
          </p>
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link
            to="/quiz"
            className="rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-soft transition hover:bg-primary/90"
          >
            התחל בחידון היומי
          </Link>
          <Link
            to="/register"
            className="rounded-lg border border-border bg-card px-6 py-3 font-semibold text-foreground hover:bg-accent/10"
          >
            הרשמה
          </Link>
        </div>
      </section>
    </div>
  );
}
