import { createFileRoute, Link } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { BrandMark, LangToggle } from "@/components/brand";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, ArrowRight, Truck, MapPin, Receipt, BarChart3, ShieldCheck, Rocket,
  Building2, Factory, Store, Wrench, Landmark, Sprout, CheckCircle2,
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  const { t, lang } = useI18n();
  const Arrow = lang === "fa" ? ArrowLeft : ArrowRight;

  const features = [
    { i: Truck, t: t("f1_t"), d: t("f1_d") },
    { i: MapPin, t: t("f2_t"), d: t("f2_d") },
    { i: Receipt, t: t("f3_t"), d: t("f3_d") },
    { i: BarChart3, t: t("f4_t"), d: t("f4_d") },
    { i: ShieldCheck, t: t("f5_t"), d: t("f5_d") },
    { i: Rocket, t: t("f6_t"), d: t("f6_d") },
  ];

  const industries = [
    { i: Building2, l: t("ind_1") },
    { i: Factory, l: t("ind_2") },
    { i: Store, l: t("ind_3") },
    { i: Wrench, l: t("ind_4") },
    { i: Landmark, l: t("ind_5") },
    { i: Sprout, l: t("ind_6") },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="container-page flex h-16 items-center justify-between">
          <BrandMark />
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <a href="#features" className="hover:text-foreground">{t("nav_features")}</a>
            <a href="#industries" className="hover:text-foreground">{t("nav_industries")}</a>
            <a href="#contact" className="hover:text-foreground">{t("nav_contact")}</a>
          </nav>
          <div className="flex items-center gap-2">
            <LangToggle />
            <Button asChild variant="ghost" size="sm">
              <Link to="/auth">{t("nav_signin")}</Link>
            </Button>
            <Button asChild size="sm" className="bg-warning text-warning-foreground hover:bg-warning/90">
              <Link to="/auth">{t("nav_start")}</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="hero-bg relative overflow-hidden">
        <div className="absolute inset-0 opacity-30 [background:radial-gradient(circle_at_20%_20%,oklch(0.7_0.15_245/0.4),transparent_50%),radial-gradient(circle_at_80%_60%,oklch(0.75_0.15_60/0.25),transparent_50%)]" />
        <div className="container-page relative py-20 md:py-28">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/80 backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-warning" />
              {t("hero_eyebrow")}
            </div>
            <h1 className="mt-6 text-4xl leading-tight font-bold text-white sm:text-5xl md:text-6xl">
              {t("hero_title_1")}
              <br />
              <span className="bg-gradient-to-r from-white via-white to-white/60 bg-clip-text text-transparent">
                {t("hero_title_2")}
              </span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-white/80 md:text-lg">
              {t("hero_desc")}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button asChild size="lg" className="bg-warning text-warning-foreground hover:bg-warning/90">
                <Link to="/auth">
                  {t("hero_cta_primary")}
                  <Arrow className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/25 bg-white/5 text-white hover:bg-white/10 hover:text-white">
                <a href="#features">{t("hero_cta_secondary")}</a>
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              { k: "۱٬۲۴۰+", v: t("stat_shipments") },
              { k: "۳۲۰+", v: t("stat_partners") },
              { k: "۲٬۸۰۰+", v: t("stat_carriers") },
              { k: "٪۹۶", v: t("stat_ontime") },
            ].map((s) => (
              <div key={s.v} className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
                <div className="text-2xl font-bold text-white md:text-3xl">{s.k}</div>
                <div className="mt-1 text-xs text-white/70">{s.v}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 md:py-28">
        <div className="container-page">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold md:text-4xl">{t("feat_title")}</h2>
            <p className="mt-3 text-muted-foreground">{t("feat_sub")}</p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {features.map(({ i: Icon, t: title, d }) => (
              <div key={title} className="card-elevated p-6 transition hover:-translate-y-0.5 hover:shadow-glow">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-brand-muted text-brand">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Industries */}
      <section id="industries" className="border-y border-border bg-muted/40 py-20">
        <div className="container-page">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold md:text-4xl">{t("ind_title")}</h2>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
            {industries.map(({ i: Icon, l }) => (
              <div key={l} className="flex flex-col items-center justify-center rounded-xl border border-border bg-card p-5 text-center">
                <Icon className="h-6 w-6 text-brand" />
                <div className="mt-3 text-sm font-medium">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section className="py-20">
        <div className="container-page grid gap-10 md:grid-cols-2 md:items-center">
          <div>
            <h2 className="text-3xl font-bold md:text-4xl">
              {lang === "fa" ? "جریان کار روشن، بدون جای خالی" : "A clear workflow, no gaps"}
            </h2>
            <p className="mt-3 text-muted-foreground">
              {lang === "fa"
                ? "هر محموله ده مرحله وضعیت مشخص دارد که با زمان و اپراتور مسئول ثبت می‌شود."
                : "Every shipment moves through ten explicit statuses, timestamped with the responsible operator."}
            </p>
            <ul className="mt-6 space-y-3 text-sm">
              {[
                "st_submitted","st_under_review","st_price_approved","st_truck_assigned","st_loading","st_in_transit","st_delivered","st_completed",
              ].map((k) => (
                <li key={k} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  {t(k as never)}
                </li>
              ))}
            </ul>
          </div>
          <div className="card-elevated overflow-hidden">
            <div className="border-b border-border bg-muted/40 px-4 py-3 text-xs text-muted-foreground">SH-260708-A93F1D</div>
            <div className="divide-y divide-border">
              {[
                { s: t("st_submitted"), c: "text-muted-foreground" },
                { s: t("st_under_review"), c: "text-muted-foreground" },
                { s: t("st_price_approved"), c: "text-brand" },
                { s: t("st_truck_assigned"), c: "text-brand" },
                { s: t("st_in_transit"), c: "text-warning" },
                { s: t("st_delivered"), c: "text-success" },
              ].map((r, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-3 text-sm">
                  <span className={r.c}>{r.s}</span>
                  <span className="text-xs text-muted-foreground">{lang === "fa" ? "امروز" : "Today"} · 0{i+2}:1{i}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container-page">
          <div className="card-elevated hero-bg relative overflow-hidden p-10 text-white md:p-16">
            <h2 className="max-w-2xl text-3xl font-bold md:text-4xl">{t("cta_title")}</h2>
            <p className="mt-3 max-w-2xl text-white/80">{t("cta_desc")}</p>
            <div className="mt-6">
              <Button asChild size="lg" className="bg-warning text-warning-foreground hover:bg-warning/90">
                <Link to="/auth">
                  {t("nav_start")}
                  <Arrow className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <footer id="contact" className="border-t border-border py-10">
        <div className="container-page flex flex-col items-center justify-between gap-4 text-sm text-muted-foreground md:flex-row">
          <BrandMark />
          <span>© {new Date().getFullYear()} — {t("footer_rights")}</span>
        </div>
      </footer>
    </div>
  );
}
