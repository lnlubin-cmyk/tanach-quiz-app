import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { BookOpen, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

type NavItem = { to: string; label: string; auth: boolean; adminOnly?: boolean; hideWhenAuth?: boolean };
const items: NavItem[] = [
  { to: "/register", label: "הרשמה", auth: false, hideWhenAuth: true },
  { to: "/login", label: "כניסת משתמש רשום", auth: false, hideWhenAuth: true },
  { to: "/quiz", label: "לחידון היומי", auth: true },
  { to: "/old-quizzes", label: "חידונים ישנים", auth: true },
  { to: "/memorial", label: "דברים לזכרה", auth: false },
  { to: "/admin", label: "ניהול החידון", auth: true, adminOnly: true },
];

export function TopNav() {
  const { isAuthenticated, isAdmin, signOut, user } = useAuth();
  const nav = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  const visible = items.filter((i) => {
    if (i.adminOnly && !isAdmin) return false;
    if (i.auth && !isAuthenticated) return false;
    if (i.hideWhenAuth && isAuthenticated) return false;
    return true;
  });

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold text-primary">
          <BookOpen className="h-6 w-6 text-accent" />
          <span>חידון התנ״ך</span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {visible.map((i) => (
            <Link
              key={i.to}
              to={i.to as any}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                path === i.to
                  ? "bg-accent/15 text-primary"
                  : "text-foreground/80 hover:bg-accent/10 hover:text-primary",
              )}
            >
              {i.label}
            </Link>
          ))}
          {isAuthenticated && (
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                await signOut();
                nav({ to: "/" });
              }}
              className="ms-2 gap-1"
            >
              <LogOut className="h-4 w-4" /> יציאה
            </Button>
          )}
        </nav>
        <button className="md:hidden" onClick={() => setOpen((v) => !v)} aria-label="תפריט">
          {open ? <X /> : <Menu />}
        </button>
      </div>
      {open && (
        <div className="border-t border-border/60 bg-background/95 md:hidden">
          <nav className="container mx-auto flex flex-col gap-1 p-3">
            {visible.map((i) => (
              <Link
                key={i.to}
                to={i.to as any}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-base font-medium text-foreground/90 hover:bg-accent/10"
              >
                {i.label}
              </Link>
            ))}
            {isAuthenticated && (
              <button
                onClick={async () => {
                  setOpen(false);
                  await signOut();
                  nav({ to: "/" });
                }}
                className="rounded-md px-3 py-2 text-start text-base font-medium text-foreground/90 hover:bg-accent/10"
              >
                יציאה ({user?.email})
              </button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
