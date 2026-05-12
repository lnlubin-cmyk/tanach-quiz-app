## Hebrew Bible Quiz — Full-Stack App Plan

A Hebrew, RTL, full-stack quiz application with Lovable Cloud (auth + database + storage), admin tools, Excel import/export, and a memorial section.

### 1. Backend (Lovable Cloud)

Enable Lovable Cloud, then create these tables with RLS:

- `quiz_session` — session_id, effective_date, expiration_date, description
- `quiz` — quiz_id, session_id (FK), subject, effective_date, expiration_date
- `questions` — quiz_id (FK), question_num, question_text, answers (text, `;`-separated), correct_answer (PK: quiz_id+question_num)
- `score` — user_id, session_id, last_update_date, score (PK: user_id+session_id)
- `profiles` — group_user_name (unique), group_display_name, contact_first_name/last_name/id/email/phone, contact_pref_channel, effective_date, linked to `auth.users` via user_id
- `user_roles` — separate roles table (`admin` / `user`) + `has_role()` SECURITY DEFINER function (no role on profile, no recursion)
- `system_definitions` — single row, `question_timeout` default 25
- `memorial_content` — content_id, text, image_url, created_at

RLS policies:
- Profiles: user reads/updates own; admins read all
- Score: user reads/updates own; admins read all
- Quiz/quiz_session/questions: anyone authenticated reads; admins write
- Memorial_content: anyone reads; admins write
- System_definitions: anyone reads; admins update
- User_roles: user reads own; admins manage

Auth: email/password login. Username (`group_user_name`) is stored on `profiles`; we look it up to resolve the email at login. Password reset via Supabase email with redirect to `/reset-password`.

### 2. Frontend (TanStack Start, Hebrew RTL)

- `dir="rtl"` and `lang="he"` on `<html>`; Hebrew display font (Heebo or Assistant via Google Fonts) in design tokens.
- Elegant warm/parchment palette defined in `src/styles.css` with oklch tokens (no ad-hoc colors).
- Top nav with menu items in Hebrew; "ניהול החידון" only when role = admin.
- Responsive (mobile + desktop), smooth transitions on quiz questions.

Routes:
- `/` — Home: memorial hero image + memorial text
- `/register` — Group/family registration form (creates auth user + profile)
- `/login` — Login by username + password, with "שכחתי סיסמא"
- `/reset-password` — Public, sets new password from recovery link
- `/_authenticated/quiz` — Daily quiz: picks active quiz via the rule (active session + active quiz dates), shows one question at a time with countdown using `system_definitions.question_timeout`, scoring via server fn
- `/_authenticated/old-quizzes` — list past quizzes; click to view questions + correct answers (read-only, no scoring)
- `/memorial` — public memorial content list; admins get inline add/edit/delete
- `/_authenticated/_admin/admin` — admin panel with two buttons
- `/_authenticated/_admin/upload-quiz` — subject + dates + Excel drag/drop upload (uses `xlsx` package), creates `quiz` row and inserts questions from rows 2+
- `/_authenticated/_admin/export-scores` — triggers Excel download with the exact 6 Hebrew columns

### 3. Server Functions (createServerFn)

- `registerGroup` — admin client creates auth user + profile row
- `loginByUsername` — resolves username → email, returns email for client signIn
- `getActiveQuiz` — returns active quiz + questions per the rule
- `submitAnswer` — validates correct_answer server-side, updates `score` (RLS-safe with auth middleware)
- `getUserTotalScore` — sums score across sessions
- `getOldQuizzes` / `getQuizQuestions` (admin reveals correct answers; user view shows correct answers in old mode)
- `uploadQuizQuestions` — admin: insert quiz + bulk insert parsed rows
- `exportScores` — admin: returns rows for Excel; client builds `.xlsx` with `xlsx`
- `upsertMemorial`, `deleteMemorial` — admin

### 4. UX Details

- Question countdown: starts at `question_timeout`, disables radios at 0, shows "זמנכם עבר", auto-advances after 5s.
- Correct → 😊 + "!תשובה נכונה! כל הכבוד" + score +1.
- Incorrect → 😞 + "התשובה איננה נכונה. התשובה הנכונה היא: <answer>".
- After feedback, 5s pause then next question. End of quiz shows summary.
- Form validation with zod (Hebrew error messages); toast notifications.
- SEO `<head>` per route with Hebrew titles and descriptions; sitemap.xml + robots.txt.

### 5. Deliverables

- All schema as Lovable Cloud migrations (idempotent, with RLS)
- Default `system_definitions.question_timeout = 25` seeded
- First registered user can be promoted to admin via a one-line SQL (documented in README)
- Clean modular components under `src/components/`, hooks under `src/hooks/`, server fns under `src/lib/*.functions.ts`
- README with setup + how to make a user admin

### Open question

The spec stores password in `users.pw`. For security I'll use Lovable Cloud Auth (managed bcrypt + reset emails) instead of a plaintext `pw` column — this is the only deviation. Confirm and I'll proceed.
