import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, type Role, primaryRole } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import { assignRole, listUsersWithRoles } from "@/lib/roles.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/app/profile")({
  component: ProfilePage,
});

const MANAGEABLE_ROLES: Role[] = ["customer", "operator", "manager", "driver", "admin"];

function ProfilePage() {
  const { t } = useI18n();
  const { user, roles } = useAuth();
  const [profile, setProfile] = useState({ full_name: "", phone: "", job_title: "" });
  const canManageRoles = ["admin", "manager"].includes(primaryRole(roles));

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("full_name, phone, job_title")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setProfile({ full_name: data.full_name ?? "", phone: data.phone ?? "", job_title: data.job_title ?? "" });
      });
  }, [user]);

  const save = async () => {
    if (!user) return;
    const { error } = await supabase.from("profiles").update(profile).eq("id", user.id);
    if (error) toast.error(error.message);
    else toast.success("ذخیره شد");
  };

  return (
    <div className="max-w-4xl space-y-6">
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
          <CardTitle className="text-base">نقش‌های فعلی شما</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {roles.length === 0 && <span className="text-sm text-muted-foreground">فقط مشتری</span>}
            {roles.map((r) => (
              <Badge key={r} variant="secondary" className="border-transparent bg-brand text-brand-foreground">
                {t(("role_" + r) as never)}
              </Badge>
            ))}
          </div>
          {!canManageRoles && (
            <p className="mt-3 text-xs text-muted-foreground">
              برای تغییر نقش با مدیر سیستم تماس بگیرید. کاربران نمی‌توانند نقش خود را تغییر دهند.
            </p>
          )}
        </CardContent>
      </Card>

      {canManageRoles && <RoleAdmin currentUserId={user?.id ?? ""} />}
    </div>
  );
}

function RoleAdmin({ currentUserId }: { currentUserId: string }) {
  const qc = useQueryClient();
  const listFn = useServerFn(listUsersWithRoles);
  const assignFn = useServerFn(assignRole);

  const { data = [], isLoading } = useQuery({
    queryKey: ["users-roles"],
    queryFn: () => listFn(),
  });

  const toggle = async (userId: string, role: Role, grant: boolean) => {
    try {
      await assignFn({ data: { userId, role, grant } });
      toast.success(grant ? "نقش اضافه شد" : "نقش حذف شد");
      qc.invalidateQueries({ queryKey: ["users-roles"] });
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">مدیریت نقش کاربران</CardTitle>
        <p className="text-xs text-muted-foreground">فقط admin و manager به این بخش دسترسی دارند. اعتبارسنجی روی سرور انجام می‌شود.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading && <div className="text-sm text-muted-foreground">در حال بارگذاری…</div>}
        {data.map((u) => (
          <div key={u.id} className="rounded-lg border border-border p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="font-medium">{u.full_name || "بدون نام"} {u.id === currentUserId && <span className="text-xs text-muted-foreground">(شما)</span>}</div>
                <div className="text-xs text-muted-foreground">{u.phone || "—"} · {u.job_title || "—"}</div>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {MANAGEABLE_ROLES.map((r) => {
                const active = u.roles.includes(r);
                return (
                  <Button
                    key={r}
                    type="button"
                    size="sm"
                    variant={active ? "default" : "outline"}
                    onClick={() => toggle(u.id, r, !active)}
                  >
                    {r}{active ? " ✓" : ""}
                  </Button>
                );
              })}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
