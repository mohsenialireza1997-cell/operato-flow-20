import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { BrandMark, LangToggle } from "@/components/brand";
import { useAuth } from "@/lib/auth-context";
import { useEffect } from "react";

const searchSchema = z.object({ redirect: z.string().optional() });

export const Route = createFileRoute("/auth")({
  validateSearch: (s) => searchSchema.parse(s),
  component: AuthPage,
});

function AuthPage() {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { redirect } = useSearch({ from: "/auth" });

  useEffect(() => {
    if (!loading && user) {
      navigate({ to: redirect || "/app" });
    }
  }, [user, loading, navigate, redirect]);

  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const [suEmail, setSuEmail] = useState("");
  const [suPass, setSuPass] = useState("");
  const [suName, setSuName] = useState("");
  const [suPhone, setSuPhone] = useState("");
  const [suCompany, setSuCompany] = useState("");
  const [suJob, setSuJob] = useState("");

  const onSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: signInEmail, password: signInPassword });
    setBusy(false);
    if (error) toast.error(error.message);
    else toast.success(lang === "fa" ? "خوش آمدید" : "Welcome");
  };

  const onSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email: suEmail,
      password: suPass,
      options: {
        emailRedirectTo: window.location.origin + "/app",
        data: { full_name: suName, phone: suPhone, job_title: suJob },
      },
    });
    if (error) { setBusy(false); toast.error(error.message); return; }

    // Optionally create company right away
    if (suCompany && data.user) {
      const { data: comp } = await supabase.from("companies").insert({ name: suCompany, created_by: data.user.id }).select("id").single();
      if (comp?.id) await supabase.from("profiles").update({ company_id: comp.id }).eq("id", data.user.id);
    }
    setBusy(false);
    toast.success(lang === "fa" ? "حساب ایجاد شد" : "Account created");
  };

  const onGoogle = async () => {
    const res = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth" });
    if (res.error) toast.error(res.error.message);
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      {/* Visual side */}
      <div className="relative hidden md:block hero-bg text-white">
        <div className="absolute inset-0 opacity-30 [background:radial-gradient(circle_at_30%_30%,oklch(0.7_0.15_245/0.4),transparent_50%)]" />
        <div className="relative flex h-full flex-col p-10">
          <BrandMark />
          <div className="my-auto max-w-md">
            <h2 className="text-3xl font-bold leading-tight">{t("hero_title_1")} {t("hero_title_2")}</h2>
            <p className="mt-4 text-white/70">{t("hero_desc")}</p>
          </div>
          <div className="text-xs text-white/50">© {new Date().getFullYear()} — {t("brand")}</div>
        </div>
      </div>

      {/* Form side */}
      <div className="flex flex-col p-6 md:p-10">
        <div className="flex items-center justify-between md:justify-end">
          <div className="md:hidden"><BrandMark /></div>
          <LangToggle />
        </div>

        <div className="my-auto w-full max-w-md mx-auto">
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">{t("auth_signin")}</TabsTrigger>
              <TabsTrigger value="signup">{t("auth_signup")}</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="mt-6">
              <form onSubmit={onSignIn} className="space-y-4">
                <div className="space-y-1.5">
                  <Label>{t("auth_email")}</Label>
                  <Input type="email" required value={signInEmail} onChange={(e) => setSignInEmail(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>{t("auth_password")}</Label>
                  <Input type="password" required value={signInPassword} onChange={(e) => setSignInPassword(e.target.value)} />
                </div>
                <Button type="submit" disabled={busy} className="w-full bg-warning text-warning-foreground hover:bg-warning/90">
                  {t("auth_submit_signin")}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="mt-6">
              <form onSubmit={onSignUp} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>{t("auth_full_name")}</Label>
                    <Input required value={suName} onChange={(e) => setSuName(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t("auth_phone")}</Label>
                    <Input required value={suPhone} onChange={(e) => setSuPhone(e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>{t("auth_company")}</Label>
                    <Input value={suCompany} onChange={(e) => setSuCompany(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t("auth_job")}</Label>
                    <Input value={suJob} onChange={(e) => setSuJob(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>{t("auth_email")}</Label>
                  <Input type="email" required value={suEmail} onChange={(e) => setSuEmail(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>{t("auth_password")}</Label>
                  <Input type="password" required minLength={6} value={suPass} onChange={(e) => setSuPass(e.target.value)} />
                </div>
                <Button type="submit" disabled={busy} className="w-full bg-warning text-warning-foreground hover:bg-warning/90">
                  {t("auth_submit_signup")}
                </Button>
                <p className="text-center text-xs text-muted-foreground">{t("auth_terms")}</p>
              </form>
            </TabsContent>
          </Tabs>

          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" />
            {t("auth_or")}
            <div className="h-px flex-1 bg-border" />
          </div>

          <Button variant="outline" className="w-full" onClick={onGoogle}>
            <svg viewBox="0 0 24 24" className="h-4 w-4"><path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.4-1.7 4.1-5.5 4.1-3.3 0-6-2.7-6-6.2s2.7-6.2 6-6.2c1.9 0 3.1.8 3.9 1.5l2.6-2.5C16.9 3.3 14.7 2.3 12 2.3 6.9 2.3 2.8 6.5 2.8 12S6.9 21.7 12 21.7c6.9 0 9.4-4.8 9.4-9 0-.6-.1-1.1-.2-1.5H12z"/></svg>
            {t("auth_google")}
          </Button>

          <div className="mt-8 text-center text-sm text-muted-foreground">
            <Link to="/" className="hover:text-foreground">← {lang === "fa" ? "بازگشت به سایت" : "Back to site"}</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
