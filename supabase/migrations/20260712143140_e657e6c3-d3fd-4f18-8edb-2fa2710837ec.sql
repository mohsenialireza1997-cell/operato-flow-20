
-- 1. New columns on shipments
ALTER TABLE public.shipments
  ADD COLUMN IF NOT EXISTS driver_payout_toman bigint,
  ADD COLUMN IF NOT EXISTS origin_address text,
  ADD COLUMN IF NOT EXISTS destination_address text,
  ADD COLUMN IF NOT EXISTS pickup_contact_name text,
  ADD COLUMN IF NOT EXISTS pickup_contact_phone text,
  ADD COLUMN IF NOT EXISTS delivery_contact_name text,
  ADD COLUMN IF NOT EXISTS delivery_contact_phone text;

-- 2. Remove driver from base shipments SELECT policy. Drivers use views only.
DROP POLICY IF EXISTS shipments_read ON public.shipments;
CREATE POLICY shipments_read ON public.shipments
  FOR SELECT TO authenticated
  USING (
    customer_id = auth.uid()
    OR public.is_staff(auth.uid())
  );

-- 3. Tighten UPDATE policy: driver may only update own assigned shipment
--    and only in the four operational statuses (loading/transit are entry
--    points too so the trigger can validate the exact transition).
DROP POLICY IF EXISTS shipments_update ON public.shipments;
CREATE POLICY shipments_update ON public.shipments
  FOR UPDATE TO authenticated
  USING (
    public.is_staff(auth.uid())
    OR (customer_id = auth.uid() AND status IN ('draft','submitted'))
    OR (
      EXISTS (SELECT 1 FROM public.drivers d WHERE d.id = shipments.driver_id AND d.user_id = auth.uid())
      AND status IN ('truck_assigned','loading','in_transit','delivered')
    )
  );

-- 4. Driver-facing views (security_invoker → caller's RLS on drivers table applies).
DROP VIEW IF EXISTS public.driver_available_shipments;
CREATE VIEW public.driver_available_shipments
WITH (security_invoker=on) AS
SELECT
  s.id,
  s.code,
  s.origin_city,
  s.origin_province,
  s.destination_city,
  s.destination_province,
  s.cargo_type,
  s.cargo_category,
  s.weight_kg,
  s.volume_m3,
  s.truck_type,
  s.loading_date,
  s.driver_payout_toman,
  s.status,
  s.created_at
FROM public.shipments s
WHERE s.status IN ('price_approved','submitted','under_review')
  AND s.driver_id IS NULL
  AND EXISTS (
    SELECT 1 FROM public.drivers d
    WHERE d.user_id = auth.uid() AND d.is_active = true
  );

DROP VIEW IF EXISTS public.driver_assigned_shipments;
CREATE VIEW public.driver_assigned_shipments
WITH (security_invoker=on) AS
SELECT
  s.id,
  s.code,
  s.origin_city,
  s.origin_province,
  s.origin_address,
  s.destination_city,
  s.destination_province,
  s.destination_address,
  s.cargo_type,
  s.cargo_category,
  s.weight_kg,
  s.volume_m3,
  s.pieces_count,
  s.handling_requirements,
  s.truck_type,
  s.loading_date,
  s.driver_payout_toman,
  s.status,
  s.pickup_contact_name,
  s.pickup_contact_phone,
  s.delivery_contact_name,
  s.delivery_contact_phone,
  s.special_instructions,
  s.driver_id,
  s.created_at,
  s.updated_at
FROM public.shipments s
JOIN public.drivers d ON d.id = s.driver_id
WHERE d.user_id = auth.uid();

GRANT SELECT ON public.driver_available_shipments TO authenticated;
GRANT SELECT ON public.driver_assigned_shipments TO authenticated;

-- 5. Extend protect_shipment_update to know about drivers explicitly.
CREATE OR REPLACE FUNCTION public.protect_shipment_update()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  staff boolean := public.is_staff(auth.uid());
  is_admin boolean := public.has_role(auth.uid(), 'admin');
  is_assigned_driver boolean := EXISTS (
    SELECT 1 FROM public.drivers d
    WHERE d.id = NEW.driver_id AND d.user_id = auth.uid()
  );
  allowed_next public.shipment_status[];
BEGIN
  -- Drivers: strict column and transition whitelist
  IF NOT staff AND is_assigned_driver THEN
    IF NEW.price_toman         IS DISTINCT FROM OLD.price_toman
    OR NEW.driver_payout_toman IS DISTINCT FROM OLD.driver_payout_toman
    OR NEW.internal_notes      IS DISTINCT FROM OLD.internal_notes
    OR NEW.operator_id         IS DISTINCT FROM OLD.operator_id
    OR NEW.driver_id           IS DISTINCT FROM OLD.driver_id
    OR NEW.customer_id         IS DISTINCT FROM OLD.customer_id
    OR NEW.code                IS DISTINCT FROM OLD.code
    OR NEW.origin_address      IS DISTINCT FROM OLD.origin_address
    OR NEW.destination_address IS DISTINCT FROM OLD.destination_address
    OR NEW.pickup_contact_name IS DISTINCT FROM OLD.pickup_contact_name
    OR NEW.pickup_contact_phone IS DISTINCT FROM OLD.pickup_contact_phone
    OR NEW.delivery_contact_name IS DISTINCT FROM OLD.delivery_contact_name
    OR NEW.delivery_contact_phone IS DISTINCT FROM OLD.delivery_contact_phone
    OR NEW.origin_city         IS DISTINCT FROM OLD.origin_city
    OR NEW.destination_city    IS DISTINCT FROM OLD.destination_city
    OR NEW.cargo_type          IS DISTINCT FROM OLD.cargo_type
    OR NEW.weight_kg           IS DISTINCT FROM OLD.weight_kg
    OR NEW.volume_m3           IS DISTINCT FROM OLD.volume_m3
    OR NEW.cargo_value_toman   IS DISTINCT FROM OLD.cargo_value_toman THEN
      RAISE EXCEPTION 'Drivers may only update shipment status';
    END IF;

    IF NEW.status IS DISTINCT FROM OLD.status THEN
      IF NOT (
        (OLD.status = 'truck_assigned' AND NEW.status = 'loading')
        OR (OLD.status = 'loading'     AND NEW.status = 'in_transit')
        OR (OLD.status = 'in_transit'  AND NEW.status = 'delivered')
      ) THEN
        RAISE EXCEPTION 'Driver cannot change shipment status from % to %', OLD.status, NEW.status;
      END IF;
    END IF;
  ELSIF NOT staff THEN
    -- Customer (non-staff, non-driver): existing restrictions
    IF NEW.price_toman         IS DISTINCT FROM OLD.price_toman
    OR NEW.driver_payout_toman IS DISTINCT FROM OLD.driver_payout_toman
    OR NEW.internal_notes      IS DISTINCT FROM OLD.internal_notes
    OR NEW.operator_id         IS DISTINCT FROM OLD.operator_id
    OR NEW.driver_id           IS DISTINCT FROM OLD.driver_id
    OR NEW.customer_id         IS DISTINCT FROM OLD.customer_id
    OR NEW.code                IS DISTINCT FROM OLD.code THEN
      RAISE EXCEPTION 'Not allowed to modify restricted shipment fields';
    END IF;

    IF NEW.status IS DISTINCT FROM OLD.status THEN
      IF NOT (OLD.status = 'draft' AND NEW.status = 'submitted') THEN
        RAISE EXCEPTION 'Customers cannot change shipment status from % to %', OLD.status, NEW.status;
      END IF;
    END IF;
  END IF;

  -- Global state machine (skipped for admin)
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

  -- Audit
  IF NEW.price_toman IS DISTINCT FROM OLD.price_toman THEN
    INSERT INTO public.shipment_audit_log(shipment_id, field_name, old_value, new_value, changed_by)
    VALUES (NEW.id, 'price_toman', OLD.price_toman::text, NEW.price_toman::text, auth.uid());
  END IF;
  IF NEW.driver_payout_toman IS DISTINCT FROM OLD.driver_payout_toman THEN
    INSERT INTO public.shipment_audit_log(shipment_id, field_name, old_value, new_value, changed_by)
    VALUES (NEW.id, 'driver_payout_toman', OLD.driver_payout_toman::text, NEW.driver_payout_toman::text, auth.uid());
  END IF;
  IF NEW.driver_id IS DISTINCT FROM OLD.driver_id THEN
    INSERT INTO public.shipment_audit_log(shipment_id, field_name, old_value, new_value, changed_by)
    VALUES (NEW.id, 'driver_id', OLD.driver_id::text, NEW.driver_id::text, auth.uid());
  END IF;

  RETURN NEW;
END;
$function$;
