import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, type Role } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/app/profile")({
  component: ProfilePage,
});

const ALL_ROLES: Role[] = ["customer", "operator", "manager", "driver"];

function ProfilePage() {
  const { t } = useI18n();
  const { user, roles, refreshRoles } = useAuth();
  const [profile, setProfile] = useState<{ full_name: string; phone: string; job_title: string }>({ full_name: "", phone: "", job_title: "" });

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("full_name, phone, job_title").eq("id", user.id).maybeSingle()
      .then(({ data }) => {
        if (data) setProfile({ full_name: data.full_name ?? "", phone: data.phone ?? "", job_title: data.job_title ?? "" });
      });
  }, [user]);

  const save = async () => {
    if (!user) return;
    const { error } = await supabase.from("profiles").update(profile).eq("id", user.id);
    if (error) toast.error(error.message); else toast.success("ذخیره شد");
  };

  const toggleRole = async (r: Role) => {
    if (!user) return;
    if (roles.includes(r)) {
      await supabase.from("user_roles").delete().eq("user_id", user.id).eq("role", r);
    } else {
      await supabase.from("user_roles").insert({ user_id: user.id, role: r });
    }
    await refreshRoles();
  };

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold md:text-3xl">{t("nav_profile")}</h1>

      <Card>
        <CardHeader><CardTitle className="text-base">اطلاعات کاربر</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5"><Label>{t("auth_full_name")}</Label><Input value={profile.full_name} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>{t("auth_phone")}</Label><Input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} /></div>
            <div className="space-y-1.5 sm:col-span-2"><Label>{t("auth_job")}</Label><Input value={profile.job_title} onChange={(e) => setProfile({ ...profile, job_title: e.target.value })} /></div>
          </div>
          <div className="flex justify-end"><Button onClick={save}>{t("save")}</Button></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("role_switcher")}</CardTitle>
          <p className="text-xs text-muted-foreground">{t("demo_note")}</p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {ALL_ROLES.map((r) => {
              const active = roles.includes(r);
              return (
                <Button key={r} type="button" variant={active ? "default" : "outline"} onClick={() => toggleRole(r)}>
                  {t(("role_" + r) as never)}
                  {active && <Badge className="bg-brand-foreground text-brand ms-2">✓</Badge>}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
