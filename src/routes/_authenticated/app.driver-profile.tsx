import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/app/driver-profile")({
  component: DriverProfilePage,
});

function DriverProfilePage() {
  const { lang } = useI18n();
  const { user } = useAuth();
  const { data: driver, isLoading } = useQuery({
    queryKey: ["my-driver", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("drivers").select("*").eq("user_id", user!.id).maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  if (isLoading) return <div className="text-sm text-muted-foreground">…</div>;

  if (!driver) {
    return (
      <Card>
        <CardContent className="p-8 text-center space-y-4">
          <p>{lang === "fa" ? "هنوز پروفایل راننده نساخته‌اید." : "You don't have a driver profile yet."}</p>
          <Button asChild><Link to="/app/onboarding">{lang === "fa" ? "ساخت پروفایل" : "Create profile"}</Link></Button>
        </CardContent>
      </Card>
    );
  }

  const insuranceExpired = driver.insurance_expiry && new Date(driver.insurance_expiry) < new Date();
  const inspectionExpired = driver.technical_inspection_expiry && new Date(driver.technical_inspection_expiry) < new Date();

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold md:text-3xl">{driver.full_name}</h1>
        <Button asChild variant="outline"><Link to="/app/onboarding">{lang === "fa" ? "ویرایش" : "Edit"}</Link></Button>
      </div>

      {(insuranceExpired || inspectionExpired) && (
        <Card className="border-destructive">
          <CardContent className="p-4 flex items-start gap-3 text-sm">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div>
              {insuranceExpired && <div>{lang === "fa" ? "بیمه شما منقضی شده است." : "Your insurance has expired."}</div>}
              {inspectionExpired && <div>{lang === "fa" ? "معاینه فنی منقضی شده است." : "Technical inspection has expired."}</div>}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">{lang === "fa" ? "اطلاعات فردی" : "Personal"}</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row k={lang === "fa" ? "موبایل" : "Phone"} v={driver.phone ?? "—"} />
            <Row k={lang === "fa" ? "کد ملی" : "National ID"} v={driver.national_id ?? "—"} />
            <Row k={lang === "fa" ? "امتیاز" : "Rating"} v={String(driver.rating_avg ?? 0)} />
            <Row k={lang === "fa" ? "سفر تکمیل‌شده" : "Completed trips"} v={String(driver.completed_trips ?? 0)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">{lang === "fa" ? "خودرو" : "Vehicle"}</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row k={lang === "fa" ? "نوع" : "Type"} v={driver.truck_type ?? "—"} />
            <Row k={lang === "fa" ? "مدل" : "Model"} v={driver.vehicle_model ?? "—"} />
            <Row k={lang === "fa" ? "سال" : "Year"} v={driver.vehicle_year?.toString() ?? "—"} />
            <Row k={lang === "fa" ? "پلاک" : "Plate"} v={driver.license_plate ?? "—"} />
            <Row k={lang === "fa" ? "ظرفیت (تن)" : "Capacity (t)"} v={driver.capacity_ton?.toString() ?? "—"} />
            <Row k={lang === "fa" ? "مالکیت" : "Ownership"} v={driver.ownership ?? "—"} />
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader><CardTitle className="text-base">{lang === "fa" ? "ترجیحات کاری" : "Work preferences"}</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <div className="text-xs text-muted-foreground mb-1">{lang === "fa" ? "مبدأهای پرتردد" : "Preferred origins"}</div>
              <div className="flex flex-wrap gap-1.5">
                {(driver.preferred_origin_cities ?? []).length === 0 ? "—" :
                  driver.preferred_origin_cities.map((c: string) => <Badge key={c} variant="secondary">{c}</Badge>)}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">{lang === "fa" ? "مقصدهای پرتردد" : "Preferred destinations"}</div>
              <div className="flex flex-wrap gap-1.5">
                {(driver.preferred_destination_cities ?? []).length === 0 ? "—" :
                  driver.preferred_destination_cities.map((c: string) => <Badge key={c} variant="secondary">{c}</Badge>)}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">{lang === "fa" ? "انواع بار" : "Cargo types"}</div>
              <div className="flex flex-wrap gap-1.5">
                {(driver.preferred_cargo_types ?? []).length === 0 ? "—" :
                  driver.preferred_cargo_types.map((c: string) => <Badge key={c} variant="secondary">{c}</Badge>)}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return <div className="flex justify-between border-b border-border/50 pb-1.5"><span className="text-muted-foreground">{k}</span><span className="font-medium">{v}</span></div>;
}
