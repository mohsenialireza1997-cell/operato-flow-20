import { Link } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Languages } from "lucide-react";

export function LangToggle() {
  const { lang, setLang } = useI18n();
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setLang(lang === "fa" ? "en" : "fa")}
      className="gap-1.5"
    >
      <Languages className="h-4 w-4" />
      <span className="text-xs font-medium">{lang === "fa" ? "EN" : "فا"}</span>
    </Button>
  );
}

export function BrandMark({ withText = true }: { withText?: boolean }) {
  const { t } = useI18n();
  return (
    <Link to="/" className="flex items-center gap-2">
      <div className="grid h-8 w-8 place-items-center rounded-lg brand-gradient text-sm font-black">B</div>
      {withText && <span className="text-base font-bold tracking-tight">{t("brand")}</span>}
    </Link>
  );
}
