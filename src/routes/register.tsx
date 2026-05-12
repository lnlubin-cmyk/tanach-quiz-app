import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";

export const Route = createFileRoute("/register")({
  component: RegisterPage,
  head: () => ({ meta: [{ title: "הרשמה - חידון התנ״ך" }] }),
});

const schema = z.object({
  group_user_name: z
    .string()
    .min(3, "שם משתמש חייב להיות באורך 3 תווים לפחות")
    .max(50)
    .regex(/^[a-zA-Z0-9_.-]+$/, "שם משתמש באנגלית בלבד"),
  group_display_name: z.string().min(2, "נא למלא שם קבוצה / משפחה").max(120),
  password: z.string().min(6, "סיסמא חייבת להיות באורך 6 תווים לפחות").max(100),
  contact_first_name: z.string().min(1, "נא למלא שם פרטי").max(80),
  contact_last_name: z.string().min(1, "נא למלא שם משפחה").max(80),
  contact_id: z.string().min(5, "תעודת זהות לא תקינה").max(20),
  contact_email: z.string().email("אימייל לא תקין"),
  contact_phone: z.string().min(7, "מספר טלפון לא תקין").max(20),
  contact_pref_channel: z.enum(["SMS", "WhatsApp", "Email"]),
});
type FormVals = z.infer<typeof schema>;

function RegisterPage() {
  const nav = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const form = useForm<FormVals>({
    resolver: zodResolver(schema),
    defaultValues: { contact_pref_channel: "Email" },
  });

  async function onSubmit(values: FormVals) {
    setSubmitting(true);
    try {
      // check username uniqueness via RPC
      const { data: existing } = await supabase.rpc("email_for_username", {
        _username: values.group_user_name,
      });
      if (existing) {
        toast.error("שם המשתמש כבר תפוס, נא לבחור שם אחר");
        setSubmitting(false);
        return;
      }
      const redirectUrl = `${window.location.origin}/`;
      const { data, error } = await supabase.auth.signUp({
        email: values.contact_email,
        password: values.password,
        options: { emailRedirectTo: redirectUrl },
      });
      if (error) throw error;
      const userId = data.user?.id;
      if (!userId) throw new Error("לא נוצר משתמש");

      const { error: pErr } = await supabase.from("profiles").insert({
        user_id: userId,
        group_user_name: values.group_user_name,
        group_display_name: values.group_display_name,
        contact_first_name: values.contact_first_name,
        contact_last_name: values.contact_last_name,
        contact_id: values.contact_id,
        contact_email: values.contact_email,
        contact_phone: values.contact_phone,
        contact_pref_channel: values.contact_pref_channel,
      });
      if (pErr) throw pErr;

      toast.success("ההרשמה בוצעה בהצלחה!");
      nav({ to: "/quiz" });
    } catch (e: any) {
      toast.error(e.message ?? "שגיאה בהרשמה");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-10">
      <h1 className="font-display text-3xl font-bold text-primary md:text-4xl">
        הרשמת קבוצה / משפחה
      </h1>
      <p className="mt-2 text-muted-foreground">כבר נרשמתם? <Link to="/login" className="text-primary underline">לכניסה</Link></p>

      <form onSubmit={form.handleSubmit(onSubmit)} className="mt-8 grid gap-5 rounded-2xl border border-border/60 bg-card/80 p-6 shadow-soft md:p-8">
        <Field label="שם משתמש באנגלית" error={form.formState.errors.group_user_name?.message}>
          <Input dir="ltr" {...form.register("group_user_name")} />
        </Field>
        <Field label="שם הקבוצה / משפחה" error={form.formState.errors.group_display_name?.message}>
          <Input {...form.register("group_display_name")} />
        </Field>
        <Field label="סיסמא" error={form.formState.errors.password?.message}>
          <Input type="password" {...form.register("password")} />
        </Field>

        <div className="mt-2 border-t border-border/60 pt-5">
          <h2 className="font-display text-xl font-bold">פרטי איש קשר</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="שם פרטי" error={form.formState.errors.contact_first_name?.message}>
            <Input {...form.register("contact_first_name")} />
          </Field>
          <Field label="שם משפחה" error={form.formState.errors.contact_last_name?.message}>
            <Input {...form.register("contact_last_name")} />
          </Field>
          <Field label="תעודת זהות" error={form.formState.errors.contact_id?.message}>
            <Input dir="ltr" {...form.register("contact_id")} />
          </Field>
          <Field label="אימייל" error={form.formState.errors.contact_email?.message}>
            <Input dir="ltr" type="email" {...form.register("contact_email")} />
          </Field>
          <Field label="טלפון" error={form.formState.errors.contact_phone?.message}>
            <Input dir="ltr" {...form.register("contact_phone")} />
          </Field>
        </div>

        <div>
          <Label className="mb-2 block">ערוץ תקשורת מועדף</Label>
          <RadioGroup
            defaultValue="Email"
            onValueChange={(v) => form.setValue("contact_pref_channel", v as any)}
            className="flex flex-wrap gap-4"
          >
            {(["SMS", "WhatsApp", "Email"] as const).map((c) => (
              <div key={c} className="flex items-center gap-2">
                <RadioGroupItem value={c} id={`ch-${c}`} />
                <Label htmlFor={`ch-${c}`}>{c}</Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        <Button type="submit" disabled={submitting} className="mt-2">
          {submitting ? "שולח..." : "הירשם"}
        </Button>
      </form>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="mb-1.5 block">{label}</Label>
      {children}
      {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
    </div>
  );
}
