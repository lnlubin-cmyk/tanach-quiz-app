import { createFileRoute, Outlet, Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated")({
  component: AuthLayout,
});

function AuthLayout() {
  const { loading, isAuthenticated } = useAuth();
  if (loading) {
    return <div className="container mx-auto px-4 py-16 text-center text-muted-foreground">טוען...</div>;
  }
  if (!isAuthenticated) {
    return (
      <div className="container mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="font-display text-2xl font-bold text-primary">נדרשת כניסה</h1>
        <p className="mt-2 text-muted-foreground">העמוד זמין למשתמשים רשומים בלבד.</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link to="/login" className="rounded-lg bg-primary px-5 py-2.5 font-semibold text-primary-foreground hover:bg-primary/90">כניסה</Link>
          <Link to="/register" className="rounded-lg border border-border bg-card px-5 py-2.5 font-semibold hover:bg-accent/10">הרשמה</Link>
        </div>
      </div>
    );
  }
  return <Outlet />;
}
