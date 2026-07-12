import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import { fmtDate, fmtNumber, fmtToman } from "@/lib/format";
import { requestShipment } from "@/lib/onboarding.functions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { MapPin, Package, Truck, Calendar, Wallet } from "lucide-react";

export const Route = createFileRoute("/_authenticated/app/available-loads")({
  component: AvailableLoadsPage,
});

function AvailableLoadsPage() {
  const { lang } = useI18n();
  const { user } = useAuth();
  const qc = useQueryClient();
  const reqFn = useServerFn(requestShipment);
  const [q, setQ] = useState("");

  const { data: driver } = useQuery({
    queryKey: ["my-driver-min", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("drivers")
        .select("id, preferred_origin_cities, preferred_destination_cities, truck_type")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  // Uses the driver_available_shipments view: no price_toman, no addresses,
  // no customer PII. RLS on drivers table (via security_invoker) gates access.
  const { data: loads = [], isLoading } = useQuery({
    queryKey: ["available-loads-view", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("driver_available_shipments")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  const { data: myRequests = [] } = useQuery({
    queryKey: ["my-requests", driver?.id],
    queryFn: async () => {
      const { data } = await supabase.from("shipment_requests").select("shipment_id, status").eq("driver_id", driver!.id);
      return data ?? [];
    },
    enabled: !!driver?.id,
  });
  const requestedIds = useMemo(() => new Set(myRequests.map((r) => r.shipment_id)), [myRequests]);

  const filtered = useMemo(() => {
    return loads.filter((l) => {
      if (!q) return true;
      const s = `${l.origin_city} ${l.destination_city} ${l.cargo_type}`.toLowerCase();
      return s.includes(q.toLowerCase());
    });
  }, [loads, q]);

  const matched = useMemo(() => {
    if (!driver) return new Set<string>();
    const set = new Set<string>();
    const originsPref = new Set((driver.preferred_origin_cities ?? []).map((c: string) => c.toLowerCase()));
    const destsPref = new Set((driver.preferred_destination_cities ?? []).map((c: string) => c.toLowerCase()));
    for (const l of loads) {
      if (!l.id) continue;
      if ((l.origin_city && originsPref.has(l.origin_city.toLowerCase())) || (l.destination_city && destsPref.has(l.destination_city.toLowerCase()))) {
        set.add(l.id);
      }
    }
    return set;
  }, [driver, loads]);

  const onRequest = async (id: string) => {
    try {
      await reqFn({ data: { shipment_id: id } });
      toast.success(lang === "fa" ? "درخواست ارسال شد" : "Request sent");
      qc.invalidateQueries({ queryKey: ["my-requests"] });
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">{lang === "fa" ? "بارهای موجود" : "Available loads"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {lang === "fa"
              ? "فقط شهر مبدأ/مقصد و مبلغ پرداختی به شما نمایش داده می‌شود. آدرس دقیق و تماس، پس از تخصیص باز می‌شود."
              : "Only cities and your payout are shown here. Exact address and contact unlock after assignment."}
          </p>
        </div>
        <Link to="/app/my-loads" className="text-sm text-brand hover:underline">
          {lang === "fa" ? "بارهای تخصیص‌یافته من ←" : "My assigned loads →"}
        </Link>
      </div>

      <Input placeholder={lang === "fa" ? "جستجو در مبدأ، مقصد یا نوع بار…" : "Search origin, destination or cargo…"} value={q} onChange={(e) => setQ(e.target.value)} className="max-w-md" />

      {!driver && (
        <Card><CardContent className="p-4 text-sm text-warning">
          {lang === "fa" ? "برای درخواست بار، ابتدا پروفایل راننده را تکمیل کنید." : "Complete your driver profile to request loads."}
        </CardContent></Card>
      )}

      {isLoading ? (
        <div className="text-sm text-muted-foreground">…</div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">{lang === "fa" ? "بار موجودی نیست" : "No available loads"}</CardContent></Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((l) => {
            const id = l.id!;
            const isMatch = matched.has(id);
            const isRequested = requestedIds.has(id);
            return (
              <Card key={id} className={isMatch ? "border-brand" : ""}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-mono text-xs text-muted-foreground">{l.code}</div>
                    {isMatch && <Badge className="bg-brand text-brand-foreground text-[10px]">{lang === "fa" ? "مطابق مسیر شما" : "Route match"}</Badge>}
                  </div>
                  <div className="text-base font-semibold flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-brand" />
                    {l.origin_city} → {l.destination_city}
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div className="flex items-center gap-1.5"><Package className="h-3.5 w-3.5" />{l.cargo_type}{l.weight_kg ? ` — ${fmtNumber(Number(l.weight_kg), lang)} kg` : ""}</div>
                    {l.truck_type && <div className="flex items-center gap-1.5"><Truck className="h-3.5 w-3.5" />{l.truck_type}</div>}
                    {l.loading_date && <div className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />{fmtDate(l.loading_date, lang)}</div>}
                  </div>
                  {l.driver_payout_toman ? (
                    <div className="text-sm font-semibold text-success flex items-center gap-1.5">
                      <Wallet className="h-4 w-4" />
                      {lang === "fa" ? "پرداختی به شما: " : "Your payout: "}
                      {fmtToman(l.driver_payout_toman, lang)}
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground">{lang === "fa" ? "مبلغ پرداختی هنوز اعلام نشده" : "Payout not yet set"}</div>
                  )}
                  <Button
                    size="sm" className="w-full"
                    disabled={!driver || isRequested}
                    onClick={() => onRequest(id)}
                  >
                    {isRequested ? (lang === "fa" ? "درخواست ثبت شده" : "Request sent") : (lang === "fa" ? "درخواست این بار" : "Request this load")}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
