import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/app/shipments/new")({
  component: NewShipment,
});

const TRUCK_TYPES = ["ده چرخ", "تریلی کفی", "تریلی چادری", "خاور", "نیسان", "کامیونت", "تانکر"];
const CARGO_CATEGORIES = ["industrial", "food", "construction", "chemical", "agricultural", "consumer", "other"];
const PAYMENT_TERMS = ["cash", "credit", "on_delivery"];

function NewShipment() {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    origin_city: "", origin_province: "",
    destination_city: "", destination_province: "",
    cargo_type: "", cargo_category: "", weight_kg: "", volume_m3: "",
    pieces_count: "", cargo_value_toman: "", handling_requirements: "",
    truck_type: "", loading_date: "",
    suggested_price_toman: "", payment_terms: "",
    special_instructions: "",
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    const { data: profile } = await supabase.from("profiles").select("company_id").eq("id", user.id).maybeSingle();
    const { data, error } = await supabase.from("shipments").insert({
      customer_id: user.id,
      company_id: profile?.company_id ?? null,
      origin_city: form.origin_city,
      origin_province: form.origin_province || null,
      destination_city: form.destination_city,
      destination_province: form.destination_province || null,
      cargo_type: form.cargo_type,
      cargo_category: form.cargo_category || null,
      weight_kg: form.weight_kg ? Number(form.weight_kg) : null,
      volume_m3: form.volume_m3 ? Number(form.volume_m3) : null,
      pieces_count: form.pieces_count ? Number(form.pieces_count) : null,
      cargo_value_toman: form.cargo_value_toman ? Number(form.cargo_value_toman) : null,
      handling_requirements: form.handling_requirements || null,
      truck_type: form.truck_type || null,
      loading_date: form.loading_date || null,
      suggested_price_toman: form.suggested_price_toman ? Number(form.suggested_price_toman) : null,
      payment_terms: form.payment_terms || null,
      special_instructions: form.special_instructions || null,
    }).select("id").single();
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success(lang === "fa" ? "محموله ثبت شد" : "Shipment submitted");
    nav({ to: "/app/shipments/$id", params: { id: data!.id } });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">{t("ship_create")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("ship_create_sub")}</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">{lang === "fa" ? "مسیر" : "Route"}</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>{t("ship_origin")} — {t("ship_city")} *</Label>
                <Input required value={form.origin_city} onChange={set("origin_city")} />
              </div>
              <div className="space-y-1.5">
                <Label>{t("ship_origin")} — {t("ship_province")}</Label>
                <Input value={form.origin_province} onChange={set("origin_province")} />
              </div>
              <div className="space-y-1.5">
                <Label>{t("ship_destination")} — {t("ship_city")} *</Label>
                <Input required value={form.destination_city} onChange={set("destination_city")} />
              </div>
              <div className="space-y-1.5">
                <Label>{t("ship_destination")} — {t("ship_province")}</Label>
                <Input value={form.destination_province} onChange={set("destination_province")} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>{t("ship_date")}</Label>
                <Input type="date" value={form.loading_date} onChange={set("loading_date")} />
              </div>
            </div>

            <div className="border-t pt-5">
              <h3 className="mb-3 font-semibold text-sm">{lang === "fa" ? "مشخصات بار" : "Cargo"}</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>{t("ship_cargo")} *</Label>
                  <Input required placeholder={lang === "fa" ? "سیمان، فولاد، مواد غذایی…" : "steel, food, cement…"} value={form.cargo_type} onChange={set("cargo_type")} />
                </div>
                <div className="space-y-1.5">
                  <Label>{lang === "fa" ? "دسته بار" : "Category"}</Label>
                  <Select value={form.cargo_category} onValueChange={(v) => setForm((f) => ({ ...f, cargo_category: v }))}>
                    <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                    <SelectContent>
                      {CARGO_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>{t("ship_weight")}</Label>
                  <Input type="number" min={0} value={form.weight_kg} onChange={set("weight_kg")} />
                </div>
                <div className="space-y-1.5">
                  <Label>{t("ship_volume")}</Label>
                  <Input type="number" min={0} step="0.1" value={form.volume_m3} onChange={set("volume_m3")} />
                </div>
                <div className="space-y-1.5">
                  <Label>{lang === "fa" ? "تعداد بسته" : "Pieces"}</Label>
                  <Input type="number" min={0} value={form.pieces_count} onChange={set("pieces_count")} />
                </div>
                <div className="space-y-1.5">
                  <Label>{lang === "fa" ? "ارزش بار (تومان)" : "Cargo value (Toman)"}</Label>
                  <Input type="number" min={0} value={form.cargo_value_toman} onChange={set("cargo_value_toman")} />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>{lang === "fa" ? "شرایط نگهداری" : "Handling requirements"}</Label>
                  <Input placeholder={lang === "fa" ? "یخچالی، شکستنی، خطرناک…" : "refrigerated, fragile…"} value={form.handling_requirements} onChange={set("handling_requirements")} />
                </div>
              </div>
            </div>

            <div className="border-t pt-5">
              <h3 className="mb-3 font-semibold text-sm">{lang === "fa" ? "خودرو و مالی" : "Vehicle & finance"}</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>{t("ship_truck")}</Label>
                  <Select value={form.truck_type} onValueChange={(v) => setForm((f) => ({ ...f, truck_type: v }))}>
                    <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                    <SelectContent>
                      {TRUCK_TYPES.map((tt) => <SelectItem key={tt} value={tt}>{tt}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>{lang === "fa" ? "شرایط پرداخت" : "Payment terms"}</Label>
                  <Select value={form.payment_terms} onValueChange={(v) => setForm((f) => ({ ...f, payment_terms: v }))}>
                    <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                    <SelectContent>
                      {PAYMENT_TERMS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>{lang === "fa" ? "پیشنهاد کرایه (تومان)" : "Suggested price (Toman)"}</Label>
                  <Input type="number" min={0} value={form.suggested_price_toman} onChange={set("suggested_price_toman")} />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>{t("ship_notes")}</Label>
              <Textarea rows={3} value={form.special_instructions} onChange={set("special_instructions")} />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => nav({ to: "/app/shipments" })}>{t("cancel")}</Button>
              <Button type="submit" disabled={busy} className="bg-warning text-warning-foreground hover:bg-warning/90">{t("submit")}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
