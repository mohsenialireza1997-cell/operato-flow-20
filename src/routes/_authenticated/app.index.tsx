import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, primaryRole } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import { fmtToman, fmtDate, fmtNumber } from "@/lib/format";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Truck, Clock, CheckCircle2, Wallet, Plus, ArrowLeft, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/_authenticated/app/")({
  component: Dashboard,
});

function Dashboard() {
  const { t, lang } = useI18n();
  const { user, roles } = useAuth();
  const role = primaryRole(roles);
  const Arrow = lang === "fa" ? ArrowLeft : ArrowRight;

  const { data: shipments = [] } = useQuery({
    queryKey: ["dashboard-shipments", user?.id, role],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shipments")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const activeCount = shipments.filter((s) => !["completed", "archived", "delivered"].includes(s.status)).length;
  const pendingCount = shipments.filter((s) => ["submitted", "under_review"].includes(s.status)).length;
  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0,0,0,0);
  const monthCompleted = shipments.filter((s) => s.status === "completed" && new Date(s.updated_at) >= monthStart);
  const monthRevenue = monthCompleted.reduce((sum, s) => sum + (s.price_toman ?? 0), 0);

  const stats = [
    { icon: Truck, label: t("dash_active"), value: fmtNumber(activeCount, lang), tone: "text-brand" },
    { icon: Clock, label: t("dash_pending"), value: fmtNumber(pendingCount, lang), tone: "text-warning" },
    { icon: CheckCircle2, label: t("dash_completed"), value: fmtNumber(monthCompleted.length, lang), tone: "text-success" },
    { icon: Wallet, label: t("dash_revenue"), value: fmtToman(monthRevenue, lang), tone: "text-foreground" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-sm text-muted-foreground">{t("dash_hello")}</div>
          <h1 className="text-2xl font-bold md:text-3xl">{user?.email}</h1>
        </div>
        <Button asChild className="bg-warning text-warning-foreground hover:bg-warning/90">
          <Link to="/app/shipments/new">
            <Plus className="h-4 w-4" />
            {t("nav_new_shipment")}
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="text-xs text-muted-foreground">{s.label}</div>
                <s.icon className={`h-4 w-4 ${s.tone}`} />
              </div>
              <div className="mt-2 text-2xl font-bold">{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">{t("dash_recent")}</CardTitle>
          <Button asChild variant="ghost" size="sm">
            <Link to="/app/shipments">
              {t("dash_view_all")} <Arrow className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {shipments.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
              {t("ship_none")}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-muted-foreground">
                  <tr className="border-b border-border">
                    <th className="p-3 text-start font-medium">{t("ship_code")}</th>
                    <th className="p-3 text-start font-medium">{t("ship_origin")} → {t("ship_destination")}</th>
                    <th className="p-3 text-start font-medium">{t("ship_cargo")}</th>
                    <th className="p-3 text-start font-medium">{t("ship_status")}</th>
                    <th className="p-3 text-start font-medium">{t("ship_date")}</th>
                    <th className="p-3 text-start font-medium">{t("ship_price")}</th>
                  </tr>
                </thead>
                <tbody>
                  {shipments.slice(0, 8).map((s) => (
                    <tr key={s.id} className="border-b border-border last:border-0 hover:bg-muted/40">
                      <td className="p-3">
                        <Link to="/app/shipments/$id" params={{ id: s.id }} className="font-mono text-xs text-brand hover:underline">
                          {s.code}
                        </Link>
                      </td>
                      <td className="p-3">{s.origin_city} → {s.destination_city}</td>
                      <td className="p-3 text-muted-foreground">{s.cargo_type}</td>
                      <td className="p-3"><StatusBadge status={s.status} /></td>
                      <td className="p-3 text-muted-foreground">{fmtDate(s.loading_date, lang)}</td>
                      <td className="p-3">{fmtToman(s.price_toman, lang)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
