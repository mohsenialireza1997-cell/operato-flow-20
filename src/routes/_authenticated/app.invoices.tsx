import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { fmtDate, fmtToman } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/app/invoices")({
  component: InvoicesPage,
});

function InvoicesPage() {
  const { t, lang } = useI18n();
  const { data = [], isLoading } = useQuery({
    queryKey: ["invoices"],
    queryFn: async () => {
      const { data, error } = await supabase.from("invoices").select("*").order("issued_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const total = data.reduce((s, r) => s + Number(r.amount_toman), 0);

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      paid: "bg-success text-success-foreground",
      unpaid: "bg-warning text-warning-foreground",
      partial: "bg-brand text-brand-foreground",
      void: "bg-muted text-muted-foreground",
    };
    return <Badge className={"border-transparent " + (map[s] ?? "")}>{s}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold md:text-3xl">{t("nav_invoices")}</h1>
        <div className="text-sm text-muted-foreground">
          {lang === "fa" ? "جمع کل: " : "Total: "}<span className="font-semibold text-foreground">{fmtToman(total, lang)}</span>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">{t("nav_invoices")}</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="p-6 text-center text-sm text-muted-foreground">{t("loading")}</div>
          ) : data.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">{t("empty")}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-muted-foreground">
                  <tr className="border-b border-border">
                    <th className="p-3 text-start font-medium">#</th>
                    <th className="p-3 text-start font-medium">{lang === "fa" ? "تاریخ" : "Date"}</th>
                    <th className="p-3 text-start font-medium">{t("ship_price")}</th>
                    <th className="p-3 text-start font-medium">{t("ship_status")}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((r) => (
                    <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/40">
                      <td className="p-3 font-mono text-xs">{r.number}</td>
                      <td className="p-3 text-muted-foreground">{fmtDate(r.issued_at, lang)}</td>
                      <td className="p-3 font-medium">{fmtToman(Number(r.amount_toman), lang)}</td>
                      <td className="p-3">{statusBadge(r.status)}</td>
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
