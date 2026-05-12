import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/old-quizzes")({
  component: OldQuizzes,
  head: () => ({ meta: [{ title: "חידונים ישנים" }] }),
});

function OldQuizzes() {
  const [openId, setOpenId] = useState<number | null>(null);
  const { data: quizzes = [], isLoading } = useQuery({
    queryKey: ["all-quizzes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quiz")
        .select("quiz_id, subject, effective_date, expiration_date")
        .order("effective_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: questions = [] } = useQuery({
    queryKey: ["q-of-quiz", openId],
    enabled: !!openId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("questions")
        .select("*")
        .eq("quiz_id", openId!)
        .order("question_num", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="container mx-auto max-w-4xl px-4 py-10">
      <h1 className="font-display text-3xl font-bold text-primary md:text-4xl">חידונים ישנים</h1>
      <p className="mt-2 text-muted-foreground">צפייה בחידונים קודמים והתשובות הנכונות. אין ספירת ניקוד במצב זה.</p>

      {isLoading ? (
        <p className="mt-8 text-muted-foreground">טוען...</p>
      ) : (
        <div className="mt-8 grid gap-3">
          {quizzes.length === 0 && <p className="text-muted-foreground">אין חידונים להצגה.</p>}
          {quizzes.map((q) => (
            <div key={q.quiz_id} className="rounded-xl border border-border/60 bg-card/80 p-4 shadow-soft">
              <button onClick={() => setOpenId(openId === q.quiz_id ? null : q.quiz_id)} className="flex w-full items-center justify-between gap-3 text-start">
                <div>
                  <h2 className="font-display text-lg font-semibold text-primary">{q.subject}</h2>
                  <p className="text-sm text-muted-foreground">{q.effective_date} ← {q.expiration_date}</p>
                </div>
                <span className="text-sm text-primary underline">{openId === q.quiz_id ? "סגור" : "פתח"}</span>
              </button>

              {openId === q.quiz_id && (
                <div className="mt-4 grid gap-4 border-t border-border/60 pt-4">
                  {questions.map((qn) => {
                    const ans = qn.answers.split(";").map((a) => a.trim()).filter(Boolean);
                    return (
                      <div key={qn.question_num} className="rounded-lg bg-background/60 p-4">
                        <p className="font-semibold">{qn.question_num}. {qn.question_text}</p>
                        <ul className="mt-2 grid gap-1 text-sm">
                          {ans.map((a, i) => (
                            <li key={i} className={a === qn.correct_answer ? "font-semibold text-success" : "text-foreground/80"}>
                              {i + 1}. {a} {a === qn.correct_answer && " ✓"}
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
