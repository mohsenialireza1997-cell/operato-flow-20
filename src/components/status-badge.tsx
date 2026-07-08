import { useI18n } from "@/lib/i18n";
import type { Database } from "@/integrations/supabase/types";
import { Badge } from "@/components/ui/badge";

type Status = Database["public"]["Enums"]["shipment_status"];

const styles: Record<Status, string> = {
  draft: "bg-muted text-muted-foreground",
  submitted: "bg-brand-muted text-brand",
  under_review: "bg-brand-muted text-brand",
  price_approved: "bg-brand text-brand-foreground",
  truck_assigned: "bg-brand text-brand-foreground",
  loading: "bg-warning/20 text-warning-foreground",
  in_transit: "bg-warning text-warning-foreground",
  delivered: "bg-success/20 text-success",
  completed: "bg-success text-success-foreground",
  archived: "bg-muted text-muted-foreground",
};

export function StatusBadge({ status }: { status: Status }) {
  const { t } = useI18n();
  return (
    <Badge variant="secondary" className={`border-transparent font-medium ${styles[status]}`}>
      {t(("st_" + status) as never)}
    </Badge>
  );
}

export const STATUS_ORDER: Status[] = [
  "draft","submitted","under_review","price_approved","truck_assigned","loading","in_transit","delivered","completed","archived",
];
