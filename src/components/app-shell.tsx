import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Truck, Plus, Receipt, Users, UserCog, BarChart3, LogOut, User } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useAuth, primaryRole } from "@/lib/auth-context";
import { BrandMark, LangToggle } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";

const nav = [
  { to: "/app", icon: LayoutDashboard, key: "nav_dashboard", roles: ["customer","operator","manager","driver","admin"] },
  { to: "/app/shipments", icon: Truck, key: "nav_shipments", roles: ["customer","operator","manager","driver","admin"] },
  { to: "/app/shipments/new", icon: Plus, key: "nav_new_shipment", roles: ["customer","operator","manager","admin"] },
  { to: "/app/invoices", icon: Receipt, key: "nav_invoices", roles: ["customer","operator","manager","admin"] },
  { to: "/app/drivers", icon: UserCog, key: "nav_drivers", roles: ["operator","manager","admin"] },
  { to: "/app/reports", icon: BarChart3, key: "nav_reports", roles: ["manager","admin"] },
  { to: "/app/profile", icon: User, key: "nav_profile", roles: ["customer","operator","manager","driver","admin"] },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const { user, roles, signOut } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const role = primaryRole(roles);

  const visibleNav = nav.filter((n) => n.roles.includes(role));

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/auth", replace: true });
  };

  const initials = (user?.email ?? "?").slice(0, 2).toUpperCase();

  const Sidebar = (
    <aside className="flex h-full w-64 flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 items-center px-5 border-b border-sidebar-border">
        <BrandMark />
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {visibleNav.map(({ to, icon: Icon, key }) => {
          const active = pathname === to || (to !== "/app" && pathname.startsWith(to));
          return (
            <Link
              key={to}
              to={to}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{t(key as never)}</span>
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-sidebar-border p-3">
        <div className="mb-3 flex items-center gap-3 px-2">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-brand text-brand-foreground text-xs">{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">{user?.email}</div>
            <div className="text-xs text-sidebar-foreground/60 capitalize">{t(("role_" + role) as never)}</div>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={handleSignOut} className="w-full justify-start text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
          <LogOut className="h-4 w-4" />
          {t("nav_signout")}
        </Button>
      </div>
    </aside>
  );

  return (
    <div className="flex min-h-screen w-full bg-background">
      <div className="hidden md:block sticky top-0 h-screen shrink-0">{Sidebar}</div>
      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border bg-background/80 px-4 backdrop-blur md:px-8">
          <div className="flex items-center gap-2">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64 p-0 bg-sidebar text-sidebar-foreground">
                {Sidebar}
              </SheetContent>
            </Sheet>
          </div>
          <div className="flex items-center gap-2">
            <LangToggle />
          </div>
        </header>
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
