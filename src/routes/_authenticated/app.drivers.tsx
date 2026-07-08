import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/app/drivers")({
  component: DriversPage,
});

function DriversPage() {
  const { t } = useI18n();
  const qc = useQueryClient();
  const [form, setForm] = useState({ full_name: "", phone: "", license_plate: "", truck_type: "" });

  const { data = [], isLoading } = useQuery({
    queryKey: ["drivers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("drivers").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const add = async () => {
    if (!form.full_name) return;
    const { error } = await supabase.from("drivers").insert(form);
    if (error) toast.error(error.message);
    else {
      toast.success("راننده افزوده شد");
      setForm({ full_name: "", phone: "", license_plate: "", truck_type: "" });
      qc.invalidateQueries({ queryKey: ["drivers"] });
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold md:text-3xl">{t("nav_drivers")}</h1>

      <Card>
        <CardHeader><CardTitle className="text-base">افزودن راننده</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-4">
            <div className="space-y-1.5"><Label>نام کامل *</Label><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>موبایل</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>پلاک</Label><Input value={form.license_plate} onChange={(e) => setForm({ ...form, license_plate: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>نوع کامیون</Label><Input value={form.truck_type} onChange={(e) => setForm({ ...form, truck_type: e.target.value })} /></div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={add}>افزودن</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">ناوگان</CardTitle></CardHeader>
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
                    <th className="p-3 text-start font-medium">نام</th>
                    <th className="p-3 text-start font-medium">موبایل</th>
                    <th className="p-3 text-start font-medium">پلاک</th>
                    <th className="p-3 text-start font-medium">نوع کامیون</th>
                    <th className="p-3 text-start font-medium">وضعیت</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((d) => (
                    <tr key={d.id} className="border-b border-border last:border-0">
                      <td className="p-3 font-medium">{d.full_name}</td>
                      <td className="p-3 text-muted-foreground">{d.phone ?? "—"}</td>
                      <td className="p-3">{d.license_plate ?? "—"}</td>
                      <td className="p-3">{d.truck_type ?? "—"}</td>
                      <td className="p-3">{d.is_active ? <Badge className="bg-success text-success-foreground">فعال</Badge> : <Badge variant="secondary">غیرفعال</Badge>}</td>
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
