import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Smile, Frown, Clock } from "lucide-react";

export const Route = createFileRoute("/_authenticated/quiz")({
  component: QuizPage,
  head: () => ({ meta: [{ title: "החידון היומי - חידון התנ״ך" }] }),
});

type Q = { quiz_id: number; question_num: number; question_text: string; answers: string; correct_answer: string };

function QuizPage() {
  const { user, isAdmin } = useAuth();
  const userId = user?.id;

  const { data: defs } = useQuery({
    queryKey: ["sysdefs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("system_definitions").select("question_timeout").eq("id", 1).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const timeout = defs?.question_timeout ?? 25;

  const { data: active, isLoading } = useQuery({
    queryKey: ["active-quiz"],
    queryFn: async () => {
      const today = new Date().toISOString().slice(0, 10);
      const { data: sessions, error: sErr } = await supabase
        .from("quiz_session")
        .select("session_id, effective_date, expiration_date")
        .lt("effective_date", today)
        .is("expiration_date", null)
        .order("effective_date", { ascending: false });
      if (sErr) throw sErr;
      const sessionIds = (sessions ?? []).map((s) => s.session_id);
      if (sessionIds.length === 0) return null;
      const { data: quizzes, error: qErr } = await supabase
        .from("quiz")
        .select("quiz_id, session_id, subject, effective_date, expiration_date")
        .in("session_id", sessionIds)
        .lte("effective_date", today)
        .gt("expiration_date", today)
        .order("effective_date", { ascending: false })
        .limit(1);
      if (qErr) throw qErr;
      const quiz = quizzes?.[0];
      if (!quiz) return null;
      const { data: questions, error: qsErr } = await supabase
        .from("questions")
        .select("*")
        .eq("quiz_id", quiz.quiz_id)
        .order("question_num", { ascending: true });
      if (qsErr) throw qsErr;
      return { quiz, questions: (questions ?? []) as Q[] };
    },
  });

  const { data: totalScore = 0, refetch: refetchScore } = useQuery({
    queryKey: ["total-score", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.from("score").select("score").eq("user_id", userId!);
      if (error) throw error;
      return (data ?? []).reduce((s, r) => s + (r.score ?? 0), 0);
    },
  });

  const quizId = active?.quiz.quiz_id;
  const { data: alreadyAttempted, isLoading: attemptLoading } = useQuery({
    queryKey: ["quiz-attempt", userId, quizId],
    enabled: !!userId && !!quizId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quiz_attempt")
        .select("quiz_id")
        .eq("user_id", userId!)
        .eq("quiz_id", quizId!)
        .maybeSingle();
      if (error) throw error;
      return !!data;
    },
  });

  // Record the attempt as soon as the user opens an unplayed active quiz
  useEffect(() => {
    if (!userId || !quizId || attemptLoading || alreadyAttempted || isAdmin) return;
    supabase.from("quiz_attempt").insert({ user_id: userId, quiz_id: quizId }).then(() => {});
  }, [userId, quizId, attemptLoading, alreadyAttempted, isAdmin]);

  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [phase, setPhase] = useState<"answering" | "timeup" | "result">("answering");
  const [secondsLeft, setSecondsLeft] = useState<number>(timeout);
  const [resultCorrect, setResultCorrect] = useState<boolean | null>(null);
  const advanceRef = useRef<number | null>(null);

  useEffect(() => { setSecondsLeft(timeout); }, [timeout, idx]);

  // countdown
  useEffect(() => {
    if (phase !== "answering") return;
    if (secondsLeft <= 0) {
      setPhase("timeup");
      scheduleAdvance();
      return;
    }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft, phase]);

  function scheduleAdvance() {
    if (advanceRef.current) window.clearTimeout(advanceRef.current);
    advanceRef.current = window.setTimeout(() => next(), 5000);
  }

  function next() {
    setSelected(null);
    setResultCorrect(null);
    setSecondsLeft(timeout);
    setPhase("answering");
    setIdx((i) => i + 1);
  }

  const questions = active?.questions ?? [];
  const current = questions[idx];
  const answersList = useMemo(
    () =>
      current
        ? current.answers
            .split(";")
            .map((a) => a.trim().replace(/^["']+|["']+$/g, "").trim())
            .filter(Boolean)
        : [],
    [current],
  );

  // correct_answer is stored as a 1-based index of the answer
  const correctIndex = current ? parseInt(String(current.correct_answer).trim(), 10) - 1 : -1;
  const correctAnswerText = answersList[correctIndex] ?? String(current?.correct_answer ?? "");

  async function submit() {
    if (!current || !selected || !userId || !active) return;
    const selectedIndex = answersList.indexOf(selected);
    const correct = selectedIndex === correctIndex;
    setResultCorrect(correct);
    setPhase("result");
    if (correct) {
      // upsert score: increment by 1
      const { data: existing } = await supabase
        .from("score")
        .select("score")
        .eq("user_id", userId)
        .eq("session_id", active.quiz.session_id!)
        .maybeSingle();
      const newScore = (existing?.score ?? 0) + 1;
      await supabase.from("score").upsert({
        user_id: userId,
        session_id: active.quiz.session_id!,
        score: newScore,
        last_update_date: new Date().toISOString(),
      });
      refetchScore();
    }
    scheduleAdvance();
  }

  if (isLoading) return <div className="container mx-auto px-4 py-16 text-center text-muted-foreground">טוען חידון...</div>;
  if (!active) {
    return (
      <div className="container mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="font-display text-2xl font-bold text-primary">אין כרגע חידון פעיל</h1>
        <p className="mt-2 text-muted-foreground">בקרוב ייפתח חידון חדש. בינתיים ניתן לעיין בחידונים ישנים.</p>
      </div>
    );
  }
  if (alreadyAttempted && !isAdmin) {
    return (
      <div className="container mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="font-display text-2xl font-bold text-primary">כבר עניתם על החידון הזה</h1>
        <p className="mt-2 text-muted-foreground">ניתן להשתתף בכל חידון פעם אחת בלבד. נשמח לראותכם בחידון הבא.</p>
        <a href="/old-quizzes" className="mt-6 inline-block rounded-lg bg-primary px-5 py-2.5 font-semibold text-primary-foreground">לחידונים קודמים</a>
      </div>
    );
  }
  if (idx >= questions.length) {
    return (
      <div className="container mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="font-display text-3xl font-bold text-primary">סיימתם את החידון!</h1>
        <p className="mt-3 text-lg">סה״כ נקודות (כולל כל החידונים): <strong>{totalScore}</strong></p>
        <a href="/" className="mt-6 inline-block rounded-lg bg-primary px-5 py-2.5 font-semibold text-primary-foreground">חזרה לעמוד הבית</a>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="flex items-center gap-2 rounded-lg bg-card px-3 py-2 shadow-soft">
          <Clock className="h-5 w-5 text-accent" />
          <span className="font-mono text-2xl font-bold text-primary">{Math.max(0, secondsLeft)}</span>
        </div>
        <div className="text-center">
          <h1 className="font-display text-2xl font-bold text-primary md:text-3xl">
            נושא החידון: {active.quiz.subject}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">סה״כ נקודות (כולל כל החידונים): <strong className="text-foreground">{totalScore}</strong></p>
          <p className="mt-1 text-xs text-muted-foreground">שאלה {idx + 1} מתוך {questions.length}</p>
        </div>
        <div className="w-[88px]" />
      </div>

      <div key={current.question_num} className="rounded-2xl border border-border/60 bg-card/85 p-6 shadow-warm transition-all duration-300 md:p-8">
        <h2 className="font-display text-xl font-semibold text-foreground md:text-2xl">{current.question_text}</h2>

        <RadioGroup
          value={selected ?? ""}
          onValueChange={(v) => phase === "answering" && setSelected(v)}
          className="mt-6 grid gap-3"
        >
          {answersList.map((a, i) => (
            <label
              key={i}
              className={`flex cursor-pointer items-center gap-3 rounded-lg border bg-background/60 p-4 transition ${
                selected === a ? "border-accent bg-accent/10" : "border-border hover:bg-accent/5"
              } ${phase !== "answering" ? "pointer-events-none opacity-90" : ""}`}
            >
              <RadioGroupItem value={a} id={`a-${i}`} />
              <span className="font-mono text-sm text-muted-foreground">{i + 1}.</span>
              <span className="text-base">{a}</span>
            </label>
          ))}
        </RadioGroup>

        {phase === "answering" && (
          <div className="mt-6 flex justify-start">
            <Button onClick={submit} disabled={!selected} size="lg">שלח תשובה</Button>
          </div>
        )}

        {phase === "timeup" && (
          <div className="mt-6 rounded-lg bg-destructive/10 p-4 text-center text-destructive">
            <p className="text-xl font-bold">זמנכם עבר</p>
            <p className="mt-1 text-sm">השאלה הבאה בעוד 5 שניות...</p>
          </div>
        )}

        {phase === "result" && (
          <div className={`mt-6 rounded-lg p-4 text-center ${resultCorrect ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
            {resultCorrect ? (
              <div className="flex flex-col items-center gap-2">
                <Smile className="h-12 w-12" />
                <p className="text-xl font-bold">!תשובה נכונה! כל הכבוד</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Frown className="h-12 w-12" />
                <p className="text-lg font-semibold">התשובה איננה נכונה. התשובה הנכונה היא: "{correctAnswerText}"</p>
              </div>
            )}
            <p className="mt-3 text-xs text-muted-foreground">השאלה הבאה בעוד 5 שניות...</p>
          </div>
        )}
      </div>
    </div>
  );
}
