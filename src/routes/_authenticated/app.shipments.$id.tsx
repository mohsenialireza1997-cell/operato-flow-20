import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { useAuth, primaryRole } from "@/lib/auth-context";
import { fmtDate, fmtDateTime, fmtToman, fmtNumber } from "@/lib/format";
import { StatusBadge, STATUS_ORDER } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type Status = Database["public"]["Enums"]["shipment_status"];

export const Route = createFileRoute("/_authenticated/app/shipments/$id")({
  component: ShipmentDetail,
});

function ShipmentDetail() {
  const { id } = Route.useParams();
  const { t, lang } = useI18n();
  const { roles } = useAuth();
  const staff = ["operator", "manager", "admin"].includes(primaryRole(roles));
  const qc = useQueryClient();

  const { data: ship, isLoading } = useQuery({
    queryKey: ["shipment", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("shipments").select("*").eq("id", id).single();
      if (error) throw error;
      return data;
    },
  });

  const { data: history = [] } = useQuery({
    queryKey: ["shipment-history", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("shipment_status_history").select("*").eq("shipment_id", id).order("changed_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: drivers = [] } = useQuery({
    queryKey: ["drivers-active"],
    queryFn: async () => {
      const { data } = await supabase.from("drivers").select("id, full_name, license_plate").eq("is_active", true);
      return data ?? [];
    },
    enabled: staff,
  });

  const [newStatus, setNewStatus] = useState<Status | "">("");
  const [price, setPrice] = useState("");
  const [driverId, setDriverId] = useState("");

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["shipment", id] });
    qc.invalidateQueries({ queryKey: ["shipment-history", id] });
  };

  const updateStatus = async () => {
    if (!newStatus) return;
    const { error } = await supabase.from("shipments").update({ status: newStatus }).eq("id", id);
    if (error) toast.error(error.message); else { toast.success("وضعیت به‌روزرسانی شد"); refresh(); setNewStatus(""); }
  };

  const setPriceAction = async () => {
    const n = Number(price);
    if (!n) return;
    const { error } = await supabase.from("shipments").update({ price_toman: n, status: "price_approved" }).eq("id", id);
    if (error) toast.error(error.message); else { toast.success("قیمت ثبت شد"); refresh(); setPrice(""); }
  };

  const assignDriver = async () => {
    if (!driverId) return;
    const { error } = await supabase.from("shipments").update({ driver_id: driverId, status: "truck_assigned" }).eq("id", id);
    if (error) toast.error(error.message); else { toast.success("راننده تخصیص یافت"); refresh(); setDriverId(""); }
  };

  if (isLoading || !ship) return <div className="text-sm text-muted-foreground">{t("loading")}</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="font-mono text-xs text-muted-foreground">{ship.code}</div>
          <h1 className="text-2xl font-bold md:text-3xl">{ship.origin_city} → {ship.destination_city}</h1>
        </div>
        <StatusBadge status={ship.status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">{lang === "fa" ? "جزئیات محموله" : "Shipment details"}</CardTitle></CardHeader>
          <CardContent>
            <dl className="grid gap-4 sm:grid-cols-2 text-sm">
              <Row label={t("ship_cargo")} value={ship.cargo_type} />
              <Row label={t("ship_truck")} value={ship.truck_type ?? "—"} />
              <Row label={t("ship_weight")} value={ship.weight_kg ? fmtNumber(Number(ship.weight_kg), lang) : "—"} />
              <Row label={t("ship_volume")} value={ship.volume_m3 ? fmtNumber(Number(ship.volume_m3), lang) : "—"} />
              <Row label={t("ship_date")} value={fmtDate(ship.loading_date, lang)} />
              <Row label={t("ship_price")} value={fmtToman(ship.price_toman, lang)} />
              <Row label={t("ship_origin")} value={`${ship.origin_city}${ship.origin_province ? "، " + ship.origin_province : ""}`} />
              <Row label={t("ship_destination")} value={`${ship.destination_city}${ship.destination_province ? "، " + ship.destination_province : ""}`} />
              {ship.special_instructions && <Row label={t("ship_notes")} value={ship.special_instructions} full />}
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">{t("ship_timeline")}</CardTitle></CardHeader>
          <CardContent>
            <ol className="relative space-y-4 border-s ps-4 border-border">
              {history.map((h) => (
                <li key={h.id} className="relative">
                  <span className="absolute -start-[21px] top-1.5 grid h-3 w-3 place-items-center rounded-full bg-brand" />
                  <StatusBadge status={h.to_status} />
                  <div className="mt-1 text-xs text-muted-foreground">{fmtDateTime(h.changed_at, lang)}</div>
                </li>
              ))}
              {history.length === 0 && <li className="text-sm text-muted-foreground">{t("empty")}</li>}
            </ol>
          </CardContent>
        </Card>
      </div>

      {staff && (
        <Card>
          <CardHeader><CardTitle className="text-base">{lang === "fa" ? "عملیات اپراتور" : "Operator actions"}</CardTitle></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>{t("ship_set_price")}</Label>
              <div className="flex gap-2">
                <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0" />
                <Button onClick={setPriceAction}>{t("save")}</Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t("ship_assign_driver")}</Label>
              <div className="flex gap-2">
                <Select value={driverId} onValueChange={setDriverId}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>
                    {drivers.map((d) => <SelectItem key={d.id} value={d.id}>{d.full_name} — {d.license_plate ?? ""}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button onClick={assignDriver}>{t("save")}</Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t("ship_update_status")}</Label>
              <div className="flex gap-2">
                <Select value={newStatus} onValueChange={(v) => setNewStatus(v as Status)}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>
                    {STATUS_ORDER.map((s) => <SelectItem key={s} value={s}>{t(("st_" + s) as never)}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button onClick={updateStatus}>{t("save")}</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Row({ label, value, full }: { label: string; value: string; full?: boolean }) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-medium">{value}</dd>
    </div>
  );
}
