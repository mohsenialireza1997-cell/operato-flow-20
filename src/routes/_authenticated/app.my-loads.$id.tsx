import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";
import { fmtDate, fmtToman, fmtNumber } from "@/lib/format";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { MapPin, Phone, Wallet, Package, Truck } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Status = Database["public"]["Enums"]["shipment_status"];

export const Route = createFileRoute("/_authenticated/app/my-loads/$id")({
  component: MyLoadDetail,
});

const NEXT: Partial<Record<Status, Status>> = {
  truck_assigned: "loading",
  loading: "in_transit",
  in_transit: "delivered",
};

function MyLoadDetail() {
  const { id } = Route.useParams();
  const { lang, t } = useI18n();
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: ship, isLoading } = useQuery({
    queryKey: ["my-load", id, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("driver_assigned_shipments").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const advance = async () => {
    if (!ship?.status) return;
    const next = NEXT[ship.status];
    if (!next) return;
    // update against base table; RLS + trigger enforce driver whitelist
    const { error } = await supabase.from("shipments").update({ status: next }).eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success(lang === "fa" ? "وضعیت به‌روزرسانی شد" : "Status updated");
      qc.invalidateQueries({ queryKey: ["my-load", id] });
      qc.invalidateQueries({ queryKey: ["my-assigned-loads"] });
    }
  };

  if (isLoading) return <div className="text-sm text-muted-foreground">{t("loading")}</div>;
  if (!ship) return <Card><CardContent className="p-8 text-sm text-muted-foreground">{lang === "fa" ? "این بار به شما تخصیص داده نشده است." : "This load is not assigned to you."}</CardContent></Card>;

  const nextStatus = ship.status ? NEXT[ship.status] : undefined;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="font-mono text-xs text-muted-foreground">{ship.code}</div>
          <h1 className="text-2xl font-bold md:text-3xl">{ship.origin_city} → {ship.destination_city}</h1>
        </div>
        {ship.status && <StatusBadge status={ship.status} />}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><MapPin className="h-4 w-4" />{lang === "fa" ? "مبدأ (بارگیری)" : "Pickup"}</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="font-medium">{ship.origin_city}{ship.origin_province ? "، " + ship.origin_province : ""}</div>
            {ship.origin_address && <div className="text-muted-foreground">{ship.origin_address}</div>}
            {ship.loading_date && <div>{lang === "fa" ? "تاریخ: " : "Date: "}{fmtDate(ship.loading_date, lang)}</div>}
            {(ship.pickup_contact_name || ship.pickup_contact_phone) && (
              <div className="flex items-center gap-2 pt-2 border-t">
                <Phone className="h-4 w-4 text-brand" />
                <div>
                  {ship.pickup_contact_name && <div className="font-medium">{ship.pickup_contact_name}</div>}
                  {ship.pickup_contact_phone && <a href={`tel:${ship.pickup_contact_phone}`} className="text-brand" dir="ltr">{ship.pickup_contact_phone}</a>}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><MapPin className="h-4 w-4" />{lang === "fa" ? "مقصد (تحویل)" : "Delivery"}</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="font-medium">{ship.destination_city}{ship.destination_province ? "، " + ship.destination_province : ""}</div>
            {ship.destination_address && <div className="text-muted-foreground">{ship.destination_address}</div>}
            {(ship.delivery_contact_name || ship.delivery_contact_phone) && (
              <div className="flex items-center gap-2 pt-2 border-t">
                <Phone className="h-4 w-4 text-brand" />
                <div>
                  {ship.delivery_contact_name && <div className="font-medium">{ship.delivery_contact_name}</div>}
                  {ship.delivery_contact_phone && <a href={`tel:${ship.delivery_contact_phone}`} className="text-brand" dir="ltr">{ship.delivery_contact_phone}</a>}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">{lang === "fa" ? "بار" : "Cargo"}</CardTitle></CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 text-sm">
          <div className="flex items-center gap-2"><Package className="h-4 w-4 text-muted-foreground" />{ship.cargo_type}</div>
          {ship.cargo_category && <div>{lang === "fa" ? "دسته: " : "Category: "}{ship.cargo_category}</div>}
          {ship.weight_kg && <div>{lang === "fa" ? "وزن: " : "Weight: "}{fmtNumber(Number(ship.weight_kg), lang)} kg</div>}
          {ship.volume_m3 && <div>{lang === "fa" ? "حجم: " : "Volume: "}{fmtNumber(Number(ship.volume_m3), lang)} m³</div>}
          {ship.pieces_count != null && <div>{lang === "fa" ? "تعداد: " : "Pieces: "}{ship.pieces_count}</div>}
          {ship.truck_type && <div className="flex items-center gap-2"><Truck className="h-4 w-4 text-muted-foreground" />{ship.truck_type}</div>}
          {ship.handling_requirements && <div className="sm:col-span-2 md:col-span-3 text-muted-foreground">{ship.handling_requirements}</div>}
          {ship.special_instructions && <div className="sm:col-span-2 md:col-span-3">{ship.special_instructions}</div>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Wallet className="h-4 w-4" />{lang === "fa" ? "پرداختی به شما" : "Your payout"}</CardTitle></CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-success">
            {ship.driver_payout_toman ? fmtToman(ship.driver_payout_toman, lang) : (lang === "fa" ? "—" : "—")}
          </div>
        </CardContent>
      </Card>

      {nextStatus && (
        <Card>
          <CardContent className="p-4 flex items-center justify-between gap-3 flex-wrap">
            <div className="text-sm">
              {lang === "fa" ? "مرحله بعدی: " : "Next step: "}
              <span className="font-semibold">{t(("st_" + nextStatus) as never)}</span>
            </div>
            <Button onClick={advance}>{lang === "fa" ? "ثبت این مرحله" : "Mark as " + nextStatus}</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
