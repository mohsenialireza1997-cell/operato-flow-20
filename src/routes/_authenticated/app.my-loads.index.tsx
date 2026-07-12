import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import { fmtDate, fmtToman } from "@/lib/format";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Wallet, Truck } from "lucide-react";

export const Route = createFileRoute("/_authenticated/app/my-loads/")({
  component: MyLoads,
});

function MyLoads() {
  const { lang } = useI18n();
  const { user } = useAuth();

  const { data: loads = [], isLoading } = useQuery({
    queryKey: ["my-assigned-loads", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("driver_assigned_shipments")
        .select("*")
        .order("loading_date", { ascending: false, nullsFirst: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">{lang === "fa" ? "بارهای من" : "My loads"}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {lang === "fa" ? "بارهای تخصیص‌یافته به شما — با آدرس دقیق و شماره تماس محل بارگیری." : "Loads assigned to you — with exact address and pickup contact."}
        </p>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">…</div>
      ) : loads.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">{lang === "fa" ? "بار تخصیص‌یافته‌ای ندارید" : "No assigned loads"}</CardContent></Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {loads.map((l) => (
            <Link
              key={l.id!}
              to="/app/my-loads/$id"
              params={{ id: l.id! }}
              className="block"
            >
              <Card className="hover:border-brand transition">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="font-mono text-xs text-muted-foreground">{l.code}</div>
                    {l.status && <StatusBadge status={l.status} />}
                  </div>
                  <div className="text-base font-semibold flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-brand" />
                    {l.origin_city} → {l.destination_city}
                  </div>
                  <div className="text-sm text-muted-foreground flex items-center gap-3 flex-wrap">
                    {l.truck_type && <span className="flex items-center gap-1"><Truck className="h-3.5 w-3.5" />{l.truck_type}</span>}
                    {l.loading_date && <span>{fmtDate(l.loading_date, lang)}</span>}
                  </div>
                  {l.driver_payout_toman ? (
                    <div className="text-sm font-semibold text-success flex items-center gap-1.5">
                      <Wallet className="h-4 w-4" />
                      {fmtToman(l.driver_payout_toman, lang)}
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
