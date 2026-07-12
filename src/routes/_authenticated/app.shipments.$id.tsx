import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useRef } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Upload, MapPin, FileText } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Status = Database["public"]["Enums"]["shipment_status"];

export const Route = createFileRoute("/_authenticated/app/shipments/$id")({
  component: ShipmentDetail,
});

const EVENT_TYPES = [
  "loaded",
  "departed",
  "checkpoint",
  "delayed",
  "arrived",
  "unloaded",
  "issue",
];

const DOC_TYPES = [
  "cargo_photo",
  "waybill",
  "loading_receipt",
  "delivery_receipt",
  "invoice",
  "other",
];

function ShipmentDetail() {
  const { id } = Route.useParams();
  const { t, lang } = useI18n();
  const { user, roles } = useAuth();
  const staff = ["operator", "manager", "admin"].includes(primaryRole(roles));
  const isDriver = primaryRole(roles) === "driver";
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

  const { data: events = [] } = useQuery({
    queryKey: ["shipment-events", id],
    queryFn: async () => {
      const { data } = await supabase.from("shipment_tracking_events").select("*").eq("shipment_id", id).order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const { data: docs = [] } = useQuery({
    queryKey: ["shipment-docs", id],
    queryFn: async () => {
      const { data } = await supabase.from("shipment_documents").select("*").eq("shipment_id", id).order("created_at", { ascending: false });
      if (!data) return [];
      const withUrls = await Promise.all(
        data.map(async (d) => {
          const { data: signed } = await supabase.storage.from("shipment-docs").createSignedUrl(d.storage_path, 3600);
          return { ...d, url: signed?.signedUrl ?? null };
        }),
      );
      return withUrls;
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
  const [eventType, setEventType] = useState("checkpoint");
  const [eventNote, setEventNote] = useState("");
  const [docType, setDocType] = useState("cargo_photo");
  const [docCaption, setDocCaption] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["shipment", id] });
    qc.invalidateQueries({ queryKey: ["shipment-history", id] });
    qc.invalidateQueries({ queryKey: ["shipment-events", id] });
    qc.invalidateQueries({ queryKey: ["shipment-docs", id] });
  };

  const updateStatus = async () => {
    if (!newStatus) return;
    const { error } = await supabase.from("shipments").update({ status: newStatus }).eq("id", id);
    if (error) toast.error(error.message); else { toast.success(lang === "fa" ? "وضعیت به‌روزرسانی شد" : "Status updated"); refresh(); setNewStatus(""); }
  };

  const setPriceAction = async () => {
    const n = Number(price);
    if (!n) return;
    const { error } = await supabase.from("shipments").update({ price_toman: n, status: "price_approved" }).eq("id", id);
    if (error) toast.error(error.message); else { toast.success(lang === "fa" ? "قیمت ثبت شد" : "Price saved"); refresh(); setPrice(""); }
  };

  const assignDriver = async () => {
    if (!driverId) return;
    const { error } = await supabase.from("shipments").update({ driver_id: driverId, status: "truck_assigned" }).eq("id", id);
    if (error) toast.error(error.message); else { toast.success(lang === "fa" ? "راننده تخصیص یافت" : "Driver assigned"); refresh(); setDriverId(""); }
  };

  const addEvent = async () => {
    if (!eventType) return;
    const { error } = await supabase.from("shipment_tracking_events").insert({
      shipment_id: id,
      event_type: eventType,
      note: eventNote.trim() || null,
      created_by: user?.id ?? null,
    });
    if (error) toast.error(error.message); else { toast.success(lang === "fa" ? "رویداد ثبت شد" : "Event logged"); setEventNote(""); refresh(); }
  };

  const uploadDoc = async (file: File) => {
    setUploading(true);
    const path = `${id}/${crypto.randomUUID()}-${file.name}`;
    const { error: upErr } = await supabase.storage.from("shipment-docs").upload(path, file, { upsert: false });
    if (upErr) { setUploading(false); toast.error(upErr.message); return; }
    const { error } = await supabase.from("shipment_documents").insert({
      shipment_id: id,
      doc_type: docType,
      storage_path: path,
      caption: docCaption.trim() || null,
      uploaded_by: user?.id ?? null,
    });
    setUploading(false);
    if (error) toast.error(error.message);
    else { toast.success(lang === "fa" ? "سند بارگذاری شد" : "Document uploaded"); setDocCaption(""); if (fileRef.current) fileRef.current.value = ""; refresh(); }
  };

  if (isLoading || !ship) return <div className="text-sm text-muted-foreground">{t("loading")}</div>;

  // Merge timeline
  type Item = { key: string; ts: string; label: string; note?: string | null; kind: "status" | "event" };
  const timeline: Item[] = [
    ...history.map((h) => ({ key: "h" + h.id, ts: h.changed_at, label: t(("st_" + h.to_status) as never), kind: "status" as const })),
    ...events.map((e) => ({ key: "e" + e.id, ts: e.created_at, label: e.event_type, note: e.note, kind: "event" as const })),
  ].sort((a, b) => (a.ts < b.ts ? 1 : -1));

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
              <Row label={lang === "fa" ? "دسته بار" : "Category"} value={ship.cargo_category ?? "—"} />
              <Row label={t("ship_truck")} value={ship.truck_type ?? "—"} />
              <Row label={t("ship_weight")} value={ship.weight_kg ? fmtNumber(Number(ship.weight_kg), lang) : "—"} />
              <Row label={t("ship_volume")} value={ship.volume_m3 ? fmtNumber(Number(ship.volume_m3), lang) : "—"} />
              <Row label={lang === "fa" ? "تعداد بسته" : "Pieces"} value={ship.pieces_count?.toString() ?? "—"} />
              <Row label={lang === "fa" ? "ارزش بار" : "Cargo value"} value={ship.cargo_value_toman ? fmtToman(ship.cargo_value_toman, lang) : "—"} />
              <Row label={lang === "fa" ? "شرایط نگهداری" : "Handling"} value={ship.handling_requirements ?? "—"} />
              <Row label={t("ship_date")} value={fmtDate(ship.loading_date, lang)} />
              <Row label={lang === "fa" ? "پیشنهاد کرایه" : "Suggested price"} value={ship.suggested_price_toman ? fmtToman(ship.suggested_price_toman, lang) : "—"} />
              <Row label={t("ship_price")} value={fmtToman(ship.price_toman, lang)} />
              <Row label={lang === "fa" ? "شرایط پرداخت" : "Payment"} value={ship.payment_terms ?? "—"} />
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
              {timeline.map((item) => (
                <li key={item.key} className="relative">
                  <span className={`absolute -start-[21px] top-1.5 grid h-3 w-3 place-items-center rounded-full ${item.kind === "event" ? "bg-warning" : "bg-brand"}`} />
                  <div className="flex items-center gap-1.5 text-sm font-medium">
                    {item.kind === "event" && <MapPin className="h-3.5 w-3.5 text-warning" />}
                    {item.label}
                  </div>
                  {item.note && <div className="mt-0.5 text-xs">{item.note}</div>}
                  <div className="mt-0.5 text-xs text-muted-foreground">{fmtDateTime(item.ts, lang)}</div>
                </li>
              ))}
              {timeline.length === 0 && <li className="text-sm text-muted-foreground">{t("empty")}</li>}
            </ol>
          </CardContent>
        </Card>
      </div>

      {/* Documents */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><FileText className="h-4 w-4" />{lang === "fa" ? "اسناد و عکس‌ها" : "Documents & photos"}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {docs.length === 0 ? (
            <p className="text-sm text-muted-foreground">{lang === "fa" ? "سندی بارگذاری نشده است." : "No documents yet."}</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {docs.map((d) => (
                <a key={d.id} href={d.url ?? "#"} target="_blank" rel="noreferrer" className="block border rounded-lg overflow-hidden hover:border-brand transition">
                  {d.url && /\.(png|jpe?g|webp|gif)$/i.test(d.storage_path) ? (
                    <img src={d.url} alt={d.caption ?? d.doc_type} className="h-28 w-full object-cover" />
                  ) : (
                    <div className="h-28 w-full grid place-items-center bg-muted"><FileText className="h-8 w-8 text-muted-foreground" /></div>
                  )}
                  <div className="p-2 text-xs">
                    <div className="font-medium truncate">{d.doc_type}</div>
                    {d.caption && <div className="text-muted-foreground truncate">{d.caption}</div>}
                  </div>
                </a>
              ))}
            </div>
          )}

          {(staff || isDriver || ship.customer_id === user?.id) && (
            <div className="border-t pt-4 grid gap-3 md:grid-cols-4 items-end">
              <div className="space-y-1.5">
                <Label className="text-xs">{lang === "fa" ? "نوع سند" : "Type"}</Label>
                <Select value={docType} onValueChange={setDocType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DOC_TYPES.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label className="text-xs">{lang === "fa" ? "توضیح" : "Caption"}</Label>
                <Input value={docCaption} onChange={(e) => setDocCaption(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{lang === "fa" ? "فایل" : "File"}</Label>
                <Input ref={fileRef} type="file" disabled={uploading} onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadDoc(f); }} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Driver / staff tracking event logger */}
      {(staff || isDriver) && (
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><MapPin className="h-4 w-4" />{lang === "fa" ? "ثبت رویداد میدانی" : "Log field event"}</CardTitle></CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            <div className="space-y-1.5">
              <Label className="text-xs">{lang === "fa" ? "نوع رویداد" : "Event type"}</Label>
              <Select value={eventType} onValueChange={setEventType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs">{lang === "fa" ? "توضیح" : "Note"}</Label>
              <div className="flex gap-2">
                <Textarea rows={1} value={eventNote} onChange={(e) => setEventNote(e.target.value)} />
                <Button onClick={addEvent} className="shrink-0"><Upload className="h-4 w-4" /></Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
