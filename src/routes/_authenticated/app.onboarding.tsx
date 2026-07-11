import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import { completeShipperOnboarding, completeDriverOnboarding } from "@/lib/onboarding.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Building2, Truck } from "lucide-react";

export const Route = createFileRoute("/_authenticated/app/onboarding")({
  component: OnboardingPage,
});

function OnboardingPage() {
  const { lang } = useI18n();
  const nav = useNavigate();
  const { refreshRoles } = useAuth();
  const shipperFn = useServerFn(completeShipperOnboarding);
  const driverFn = useServerFn(completeDriverOnboarding);
  const [busy, setBusy] = useState(false);

  // Shipper form
  const [sp, setSp] = useState({ company_name: "", industry: "", contact_person: "", city: "", address: "" });
  const submitShipper = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await shipperFn({ data: sp });
      await refreshRoles();
      toast.success(lang === "fa" ? "پروفایل ثبت شد" : "Profile saved");
      nav({ to: "/app" });
    } catch (err) {
      toast.error((err as Error).message);
    } finally { setBusy(false); }
  };

  // Driver form
  const [dr, setDr] = useState({
    full_name: "", phone: "", national_id: "",
    truck_type: "", license_plate: "", vehicle_model: "",
    vehicle_year: "", capacity_ton: "", ownership: "owner",
    preferred_origin_cities: "", preferred_destination_cities: "", preferred_cargo_types: "",
    insurance_expiry: "", technical_inspection_expiry: "",
  });
  const submitDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await driverFn({
        data: {
          full_name: dr.full_name,
          phone: dr.phone,
          national_id: dr.national_id || undefined,
          truck_type: dr.truck_type || undefined,
          license_plate: dr.license_plate || undefined,
          vehicle_model: dr.vehicle_model || undefined,
          vehicle_year: dr.vehicle_year ? Number(dr.vehicle_year) : undefined,
          capacity_ton: dr.capacity_ton ? Number(dr.capacity_ton) : undefined,
          ownership: (dr.ownership as "owner" | "rental") || undefined,
          preferred_origin_cities: splitList(dr.preferred_origin_cities),
          preferred_destination_cities: splitList(dr.preferred_destination_cities),
          preferred_cargo_types: splitList(dr.preferred_cargo_types),
          insurance_expiry: dr.insurance_expiry || undefined,
          technical_inspection_expiry: dr.technical_inspection_expiry || undefined,
        },
      });
      await refreshRoles();
      toast.success(lang === "fa" ? "پروفایل راننده ثبت شد" : "Driver profile saved");
      nav({ to: "/app" });
    } catch (err) {
      toast.error((err as Error).message);
    } finally { setBusy(false); }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">
          {lang === "fa" ? "تکمیل پروفایل" : "Complete your profile"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {lang === "fa"
            ? "برای شروع کار، نوع حساب و اطلاعات پایه را وارد کنید."
            : "Choose your account type and fill in the essentials."}
        </p>
      </div>

      <Tabs defaultValue="shipper">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="shipper" className="gap-2"><Building2 className="h-4 w-4" />{lang === "fa" ? "صاحب کالا" : "Shipper"}</TabsTrigger>
          <TabsTrigger value="driver" className="gap-2"><Truck className="h-4 w-4" />{lang === "fa" ? "راننده" : "Driver"}</TabsTrigger>
        </TabsList>

        <TabsContent value="shipper" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">{lang === "fa" ? "اطلاعات شرکت" : "Company info"}</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={submitShipper} className="space-y-4">
                <Field label={lang === "fa" ? "نام شرکت *" : "Company name *"}>
                  <Input required value={sp.company_name} onChange={(e) => setSp({ ...sp, company_name: e.target.value })} />
                </Field>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label={lang === "fa" ? "صنعت" : "Industry"}>
                    <Input placeholder={lang === "fa" ? "ساختمانی، غذایی، …" : "Construction, Food, …"} value={sp.industry} onChange={(e) => setSp({ ...sp, industry: e.target.value })} />
                  </Field>
                  <Field label={lang === "fa" ? "شخص رابط" : "Contact person"}>
                    <Input value={sp.contact_person} onChange={(e) => setSp({ ...sp, contact_person: e.target.value })} />
                  </Field>
                </div>
                <Field label={lang === "fa" ? "شهر" : "City"}>
                  <Input value={sp.city} onChange={(e) => setSp({ ...sp, city: e.target.value })} />
                </Field>
                <Field label={lang === "fa" ? "آدرس" : "Address"}>
                  <Textarea rows={2} value={sp.address} onChange={(e) => setSp({ ...sp, address: e.target.value })} />
                </Field>
                <Button type="submit" disabled={busy} className="w-full bg-warning text-warning-foreground hover:bg-warning/90">
                  {lang === "fa" ? "ذخیره و ادامه" : "Save & continue"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="driver" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">{lang === "fa" ? "پروفایل راننده" : "Driver profile"}</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={submitDriver} className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label={lang === "fa" ? "نام کامل *" : "Full name *"}>
                    <Input required value={dr.full_name} onChange={(e) => setDr({ ...dr, full_name: e.target.value })} />
                  </Field>
                  <Field label={lang === "fa" ? "موبایل *" : "Phone *"}>
                    <Input required value={dr.phone} onChange={(e) => setDr({ ...dr, phone: e.target.value })} />
                  </Field>
                  <Field label={lang === "fa" ? "کد ملی" : "National ID"}>
                    <Input value={dr.national_id} onChange={(e) => setDr({ ...dr, national_id: e.target.value })} />
                  </Field>
                  <Field label={lang === "fa" ? "پلاک" : "License plate"}>
                    <Input value={dr.license_plate} onChange={(e) => setDr({ ...dr, license_plate: e.target.value })} />
                  </Field>
                  <Field label={lang === "fa" ? "نوع کامیون" : "Truck type"}>
                    <Input placeholder={lang === "fa" ? "ده چرخ، تریلی کفی…" : "10-wheel, flatbed…"} value={dr.truck_type} onChange={(e) => setDr({ ...dr, truck_type: e.target.value })} />
                  </Field>
                  <Field label={lang === "fa" ? "مدل خودرو" : "Vehicle model"}>
                    <Input value={dr.vehicle_model} onChange={(e) => setDr({ ...dr, vehicle_model: e.target.value })} />
                  </Field>
                  <Field label={lang === "fa" ? "سال ساخت" : "Year"}>
                    <Input type="number" value={dr.vehicle_year} onChange={(e) => setDr({ ...dr, vehicle_year: e.target.value })} />
                  </Field>
                  <Field label={lang === "fa" ? "ظرفیت (تن)" : "Capacity (t)"}>
                    <Input type="number" step="0.1" value={dr.capacity_ton} onChange={(e) => setDr({ ...dr, capacity_ton: e.target.value })} />
                  </Field>
                  <Field label={lang === "fa" ? "مالکیت" : "Ownership"}>
                    <select className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm" value={dr.ownership} onChange={(e) => setDr({ ...dr, ownership: e.target.value })}>
                      <option value="owner">{lang === "fa" ? "شخصی" : "Owner"}</option>
                      <option value="rental">{lang === "fa" ? "استیجاری" : "Rental"}</option>
                    </select>
                  </Field>
                  <Field label={lang === "fa" ? "انقضای بیمه" : "Insurance expiry"}>
                    <Input type="date" value={dr.insurance_expiry} onChange={(e) => setDr({ ...dr, insurance_expiry: e.target.value })} />
                  </Field>
                  <Field label={lang === "fa" ? "انقضای معاینه فنی" : "Tech. insp. expiry"}>
                    <Input type="date" value={dr.technical_inspection_expiry} onChange={(e) => setDr({ ...dr, technical_inspection_expiry: e.target.value })} />
                  </Field>
                </div>
                <Field label={lang === "fa" ? "شهرهای مبدأ پرتردد (با کاما جدا کنید)" : "Preferred origin cities (comma separated)"}>
                  <Input placeholder="تهران, اصفهان, مشهد" value={dr.preferred_origin_cities} onChange={(e) => setDr({ ...dr, preferred_origin_cities: e.target.value })} />
                </Field>
                <Field label={lang === "fa" ? "شهرهای مقصد پرتردد" : "Preferred destination cities"}>
                  <Input value={dr.preferred_destination_cities} onChange={(e) => setDr({ ...dr, preferred_destination_cities: e.target.value })} />
                </Field>
                <Field label={lang === "fa" ? "انواع بار قابل حمل" : "Cargo types you carry"}>
                  <Input placeholder={lang === "fa" ? "سیمان, فولاد, مواد غذایی" : "cement, steel, food"} value={dr.preferred_cargo_types} onChange={(e) => setDr({ ...dr, preferred_cargo_types: e.target.value })} />
                </Field>
                <Button type="submit" disabled={busy} className="w-full bg-warning text-warning-foreground hover:bg-warning/90">
                  {lang === "fa" ? "ذخیره پروفایل راننده" : "Save driver profile"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function splitList(s: string): string[] {
  return s.split(/[,،]/).map((x) => x.trim()).filter(Boolean);
}
