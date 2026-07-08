import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { fmtDate, fmtToman } from "@/lib/format";
import { StatusBadge, STATUS_ORDER } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/_authenticated/app/shipments/")({
  component: ShipmentsPage,
});

function ShipmentsPage() {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("all");

  const { data = [], isLoading } = useQuery({
    queryKey: ["shipments", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("shipments").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const filtered = useMemo(() => {
    return data.filter((s) => {
      if (status !== "all" && s.status !== status) return false;
      if (!q) return true;
      const t = `${s.code} ${s.origin_city} ${s.destination_city} ${s.cargo_type}`.toLowerCase();
      return t.includes(q.toLowerCase());
    });
  }, [data, q, status]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold md:text-3xl">{t("nav_shipments")}</h1>
        <Button asChild className="bg-warning text-warning-foreground hover:bg-warning/90">
          <Link to="/app/shipments/new"><Plus className="h-4 w-4" />{t("nav_new_shipment")}</Link>
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute inset-y-0 start-3 my-auto h-4 w-4 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("ship_search")} className="ps-9" />
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="sm:w-56"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("ship_all_status")}</SelectItem>
                {STATUS_ORDER.map((s) => (
                  <SelectItem key={s} value={s}>{t(("st_" + s) as never)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="mt-4 overflow-x-auto">
            {isLoading ? (
              <div className="p-6 text-center text-sm text-muted-foreground">{t("loading")}</div>
            ) : filtered.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">{t("empty")}</div>
            ) : (
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
                  {filtered.map((s) => (
                    <tr key={s.id} className="border-b border-border last:border-0 hover:bg-muted/40">
                      <td className="p-3">
                        <Link to="/app/shipments/$id" params={{ id: s.id }} className="font-mono text-xs text-brand hover:underline">{s.code}</Link>
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
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
