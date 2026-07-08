import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { fmtToman, fmtNumber } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export const Route = createFileRoute("/_authenticated/app/reports")({
  component: ReportsPage,
});

function ReportsPage() {
  const { t, lang } = useI18n();

  const { data: shipments = [] } = useQuery({
    queryKey: ["all-shipments-reports"],
    queryFn: async () => {
      const { data, error } = await supabase.from("shipments").select("*");
      if (error) throw error;
      return data;
    },
  });

  // Revenue by month (last 6)
  const months: { label: string; revenue: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(); d.setMonth(d.getMonth() - i); d.setDate(1); d.setHours(0,0,0,0);
    const end = new Date(d); end.setMonth(end.getMonth() + 1);
    const rev = shipments
      .filter((s) => s.status === "completed" && new Date(s.updated_at) >= d && new Date(s.updated_at) < end)
      .reduce((sum, s) => sum + (s.price_toman ?? 0), 0);
    months.push({
      label: new Intl.DateTimeFormat(lang === "fa" ? "fa-IR" : "en-US", { month: "short" }).format(d),
      revenue: rev,
    });
  }

  // Top routes
  const routeMap = new Map<string, number>();
  shipments.forEach((s) => {
    const k = `${s.origin_city} → ${s.destination_city}`;
    routeMap.set(k, (routeMap.get(k) ?? 0) + 1);
  });
  const topRoutes = [...routeMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold md:text-3xl">{t("nav_reports")}</h1>

      <Card>
        <CardHeader><CardTitle className="text-base">{t("mgr_revenue_chart")}</CardTitle></CardHeader>
        <CardContent style={{ height: 320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={months}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => new Intl.NumberFormat(lang === "fa" ? "fa-IR" : "en-US", { notation: "compact" }).format(v)} />
              <Tooltip formatter={(v: number) => fmtToman(v, lang)} />
              <Bar dataKey="revenue" fill="oklch(0.58 0.16 250)" radius={[6,6,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">{t("mgr_top_routes")}</CardTitle></CardHeader>
          <CardContent>
            {topRoutes.length === 0 ? (
              <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">{t("empty")}</div>
            ) : (
              <ul className="space-y-2 text-sm">
                {topRoutes.map(([r, n]) => (
                  <li key={r} className="flex items-center justify-between border-b border-border pb-2 last:border-0">
                    <span>{r}</span>
                    <span className="text-muted-foreground">{fmtNumber(n, lang)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">توزیع وضعیت</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {Object.entries(shipments.reduce<Record<string, number>>((acc, s) => { acc[s.status] = (acc[s.status] ?? 0) + 1; return acc; }, {})).map(([k, v]) => (
                <li key={k} className="flex items-center justify-between border-b border-border pb-2 last:border-0">
                  <span>{t(("st_" + k) as never)}</span>
                  <span className="text-muted-foreground">{fmtNumber(v, lang)}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
