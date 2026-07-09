
-- 1) Remove the dangerous demo policies
DROP POLICY IF EXISTS roles_self_insert_demo ON public.user_roles;
DROP POLICY IF EXISTS roles_self_delete_demo ON public.user_roles;

-- 2) Audit log for shipments (price/driver/etc)
CREATE TABLE IF NOT EXISTS public.shipment_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id uuid NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
  field_name text NOT NULL,
  old_value text,
  new_value text,
  changed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  changed_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.shipment_audit_log TO authenticated;
GRANT ALL ON public.shipment_audit_log TO service_role;

ALTER TABLE public.shipment_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY audit_read ON public.shipment_audit_log FOR SELECT TO authenticated USING (
  public.is_staff(auth.uid())
  OR EXISTS (SELECT 1 FROM public.shipments s WHERE s.id = shipment_id AND s.customer_id = auth.uid())
);

-- 3) Shipment column-level protection + state machine + audit
CREATE OR REPLACE FUNCTION public.protect_shipment_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  staff boolean := public.is_staff(auth.uid());
  is_admin boolean := public.has_role(auth.uid(), 'admin');
  allowed_next public.shipment_status[];
BEGIN
  -- Non-staff users cannot touch protected columns
  IF NOT staff THEN
    IF NEW.price_toman     IS DISTINCT FROM OLD.price_toman
    OR NEW.internal_notes  IS DISTINCT FROM OLD.internal_notes
    OR NEW.operator_id     IS DISTINCT FROM OLD.operator_id
    OR NEW.driver_id       IS DISTINCT FROM OLD.driver_id
    OR NEW.customer_id     IS DISTINCT FROM OLD.customer_id
    OR NEW.code            IS DISTINCT FROM OLD.code THEN
      RAISE EXCEPTION 'Not allowed to modify restricted shipment fields';
    END IF;

    -- Non-staff can only advance draft -> submitted (or keep same status)
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      IF NOT (OLD.status = 'draft' AND NEW.status = 'submitted') THEN
        RAISE EXCEPTION 'Customers cannot change shipment status from % to %', OLD.status, NEW.status;
      END IF;
    END IF;
  END IF;

  -- State machine (applies to everyone except admin)
  IF NEW.status IS DISTINCT FROM OLD.status AND NOT is_admin THEN
    allowed_next := CASE OLD.status
      WHEN 'draft'           THEN ARRAY['submitted']::public.shipment_status[]
      WHEN 'submitted'       THEN ARRAY['under_review','draft']::public.shipment_status[]
      WHEN 'under_review'    THEN ARRAY['price_approved','submitted']::public.shipment_status[]
      WHEN 'price_approved'  THEN ARRAY['truck_assigned']::public.shipment_status[]
      WHEN 'truck_assigned'  THEN ARRAY['loading','price_approved']::public.shipment_status[]
      WHEN 'loading'         THEN ARRAY['in_transit']::public.shipment_status[]
      WHEN 'in_transit'      THEN ARRAY['delivered']::public.shipment_status[]
      WHEN 'delivered'       THEN ARRAY['completed']::public.shipment_status[]
      WHEN 'completed'       THEN ARRAY['archived']::public.shipment_status[]
      WHEN 'archived'        THEN ARRAY[]::public.shipment_status[]
      ELSE ARRAY[]::public.shipment_status[]
    END;

    IF NOT (NEW.status = ANY(allowed_next)) THEN
      RAISE EXCEPTION 'Invalid shipment status transition: % -> %', OLD.status, NEW.status;
    END IF;
  END IF;

  -- Audit price / driver changes
  IF NEW.price_toman IS DISTINCT FROM OLD.price_toman THEN
    INSERT INTO public.shipment_audit_log(shipment_id, field_name, old_value, new_value, changed_by)
    VALUES (NEW.id, 'price_toman', OLD.price_toman::text, NEW.price_toman::text, auth.uid());
  END IF;
  IF NEW.driver_id IS DISTINCT FROM OLD.driver_id THEN
    INSERT INTO public.shipment_audit_log(shipment_id, field_name, old_value, new_value, changed_by)
    VALUES (NEW.id, 'driver_id', OLD.driver_id::text, NEW.driver_id::text, auth.uid());
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_shipment_protect ON public.shipments;
CREATE TRIGGER trg_shipment_protect
  BEFORE UPDATE ON public.shipments
  FOR EACH ROW EXECUTE FUNCTION public.protect_shipment_update();

-- 4) Notify user on role change
CREATE OR REPLACE FUNCTION public.notify_role_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.notifications(user_id, title, body)
    VALUES (NEW.user_id, 'نقش جدید', 'نقش «' || NEW.role::text || '» به حساب شما اضافه شد.');
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.notifications(user_id, title, body)
    VALUES (OLD.user_id, 'نقش حذف شد', 'نقش «' || OLD.role::text || '» از حساب شما حذف شد.');
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_user_roles_notify_ins ON public.user_roles;
DROP TRIGGER IF EXISTS trg_user_roles_notify_del ON public.user_roles;
CREATE TRIGGER trg_user_roles_notify_ins
  AFTER INSERT ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.notify_role_change();
CREATE TRIGGER trg_user_roles_notify_del
  AFTER DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.notify_role_change();

-- 5) Invoice amount must match shipment price
CREATE OR REPLACE FUNCTION public.validate_invoice_amount()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ship_price bigint;
BEGIN
  IF NEW.shipment_id IS NOT NULL THEN
    SELECT price_toman INTO ship_price FROM public.shipments WHERE id = NEW.shipment_id;
    IF ship_price IS NULL THEN
      RAISE EXCEPTION 'Cannot invoice a shipment without an approved price';
    END IF;
    IF NEW.amount_toman <> ship_price THEN
      RAISE EXCEPTION 'Invoice amount (%) must equal shipment price (%)', NEW.amount_toman, ship_price;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_invoice_amount ON public.invoices;
CREATE TRIGGER trg_invoice_amount
  BEFORE INSERT OR UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.validate_invoice_amount();
