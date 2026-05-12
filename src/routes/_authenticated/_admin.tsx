import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/_admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const { isAdmin, loading } = useAuth();
  if (loading) return <div className="container mx-auto px-4 py-12 text-center text-muted-foreground">טוען...</div>;
  if (!isAdmin) {
    return (
      <div className="container mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="font-display text-2xl font-bold text-destructive">אין הרשאה</h1>
        <p className="mt-2 text-muted-foreground">העמוד פתוח למנהלים בלבד.</p>
      </div>
    );
  }
  return <Outlet />;
}
