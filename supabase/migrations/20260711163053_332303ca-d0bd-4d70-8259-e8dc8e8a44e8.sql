
-- 1) shippers table
CREATE TABLE IF NOT EXISTS public.shippers (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  industry text,
  contact_person text,
  city text,
  address text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shippers TO authenticated;
GRANT ALL ON public.shippers TO service_role;
ALTER TABLE public.shippers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "shippers_self_select" ON public.shippers
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "shippers_self_insert" ON public.shippers
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());
CREATE POLICY "shippers_self_update" ON public.shippers
  FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.is_staff(auth.uid()))
  WITH CHECK (id = auth.uid() OR public.is_staff(auth.uid()));

CREATE TRIGGER shippers_set_updated_at BEFORE UPDATE ON public.shippers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2) Extend drivers
ALTER TABLE public.drivers
  ADD COLUMN IF NOT EXISTS user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS national_id text,
  ADD COLUMN IF NOT EXISTS vehicle_model text,
  ADD COLUMN IF NOT EXISTS vehicle_year int,
  ADD COLUMN IF NOT EXISTS capacity_ton numeric,
  ADD COLUMN IF NOT EXISTS ownership text CHECK (ownership IN ('owner','rental')),
  ADD COLUMN IF NOT EXISTS preferred_origin_cities text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS preferred_destination_cities text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS preferred_cargo_types text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS insurance_expiry date,
  ADD COLUMN IF NOT EXISTS technical_inspection_expiry date,
  ADD COLUMN IF NOT EXISTS rating_avg numeric(3,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS completed_trips int DEFAULT 0;

DROP POLICY IF EXISTS "drivers_self_manage" ON public.drivers;
CREATE POLICY "drivers_self_manage" ON public.drivers
  FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.is_staff(auth.uid()))
  WITH CHECK (user_id = auth.uid() OR public.is_staff(auth.uid()));

CREATE OR REPLACE VIEW public.drivers_public AS
SELECT id, full_name, license_plate, truck_type, vehicle_model, rating_avg, completed_trips
FROM public.drivers
WHERE is_active = true;
GRANT SELECT ON public.drivers_public TO authenticated;

-- 3) Extend shipments
ALTER TABLE public.shipments
  ADD COLUMN IF NOT EXISTS cargo_value_toman bigint,
  ADD COLUMN IF NOT EXISTS cargo_category text,
  ADD COLUMN IF NOT EXISTS pieces_count int,
  ADD COLUMN IF NOT EXISTS handling_requirements text,
  ADD COLUMN IF NOT EXISTS suggested_price_toman bigint,
  ADD COLUMN IF NOT EXISTS payment_terms text CHECK (payment_terms IN ('cash','credit','on_delivery'));

-- 4) shipment_documents
CREATE TABLE IF NOT EXISTS public.shipment_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id uuid NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  doc_type text NOT NULL CHECK (doc_type IN ('cargo_photo','waybill','loading_receipt','delivery_receipt','invoice','other')),
  storage_path text NOT NULL,
  caption text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shipment_documents TO authenticated;
GRANT ALL ON public.shipment_documents TO service_role;
ALTER TABLE public.shipment_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "docs_view" ON public.shipment_documents FOR SELECT TO authenticated USING (
  public.is_staff(auth.uid()) OR EXISTS (
    SELECT 1 FROM public.shipments s
    LEFT JOIN public.drivers d ON d.id = s.driver_id
    WHERE s.id = shipment_documents.shipment_id
      AND (s.customer_id = auth.uid() OR d.user_id = auth.uid())
  )
);
CREATE POLICY "docs_insert" ON public.shipment_documents FOR INSERT TO authenticated WITH CHECK (
  uploaded_by = auth.uid() AND (
    public.is_staff(auth.uid()) OR EXISTS (
      SELECT 1 FROM public.shipments s
      LEFT JOIN public.drivers d ON d.id = s.driver_id
      WHERE s.id = shipment_documents.shipment_id
        AND (s.customer_id = auth.uid() OR d.user_id = auth.uid())
    )
  )
);
CREATE POLICY "docs_delete_own_or_staff" ON public.shipment_documents FOR DELETE TO authenticated USING (
  uploaded_by = auth.uid() OR public.is_staff(auth.uid())
);

-- 5) shipment_tracking_events
CREATE TABLE IF NOT EXISTS public.shipment_tracking_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id uuid NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  note text,
  lat numeric,
  lng numeric,
  photo_path text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.shipment_tracking_events TO authenticated;
GRANT ALL ON public.shipment_tracking_events TO service_role;
ALTER TABLE public.shipment_tracking_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "track_view" ON public.shipment_tracking_events FOR SELECT TO authenticated USING (
  public.is_staff(auth.uid()) OR EXISTS (
    SELECT 1 FROM public.shipments s
    LEFT JOIN public.drivers d ON d.id = s.driver_id
    WHERE s.id = shipment_tracking_events.shipment_id
      AND (s.customer_id = auth.uid() OR d.user_id = auth.uid())
  )
);
CREATE POLICY "track_insert_driver_or_staff" ON public.shipment_tracking_events FOR INSERT TO authenticated WITH CHECK (
  created_by = auth.uid() AND (
    public.is_staff(auth.uid()) OR EXISTS (
      SELECT 1 FROM public.shipments s
      JOIN public.drivers d ON d.id = s.driver_id
      WHERE s.id = shipment_tracking_events.shipment_id AND d.user_id = auth.uid()
    )
  )
);

-- 6) shipment_requests
CREATE TABLE IF NOT EXISTS public.shipment_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id uuid NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
  driver_id uuid NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected','cancelled')),
  message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (shipment_id, driver_id)
);
GRANT SELECT, INSERT, UPDATE ON public.shipment_requests TO authenticated;
GRANT ALL ON public.shipment_requests TO service_role;
ALTER TABLE public.shipment_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "req_view" ON public.shipment_requests FOR SELECT TO authenticated USING (
  public.is_staff(auth.uid()) OR
  EXISTS (SELECT 1 FROM public.drivers d WHERE d.id = shipment_requests.driver_id AND d.user_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM public.shipments s WHERE s.id = shipment_requests.shipment_id AND s.customer_id = auth.uid())
);
CREATE POLICY "req_driver_insert" ON public.shipment_requests FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.drivers d WHERE d.id = shipment_requests.driver_id AND d.user_id = auth.uid())
);
CREATE POLICY "req_staff_update" ON public.shipment_requests FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

CREATE TRIGGER shipment_requests_set_updated_at BEFORE UPDATE ON public.shipment_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 7) Storage RLS policies (buckets created via tool)
CREATE POLICY "shipment_docs_read" ON storage.objects FOR SELECT TO authenticated USING (
  bucket_id = 'shipment-docs' AND (
    public.is_staff(auth.uid()) OR EXISTS (
      SELECT 1 FROM public.shipments s
      LEFT JOIN public.drivers d ON d.id = s.driver_id
      WHERE s.id::text = split_part(name, '/', 1)
        AND (s.customer_id = auth.uid() OR d.user_id = auth.uid())
    )
  )
);
CREATE POLICY "shipment_docs_write" ON storage.objects FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'shipment-docs' AND (
    public.is_staff(auth.uid()) OR EXISTS (
      SELECT 1 FROM public.shipments s
      LEFT JOIN public.drivers d ON d.id = s.driver_id
      WHERE s.id::text = split_part(name, '/', 1)
        AND (s.customer_id = auth.uid() OR d.user_id = auth.uid())
    )
  )
);
CREATE POLICY "shipment_docs_delete" ON storage.objects FOR DELETE TO authenticated USING (
  bucket_id = 'shipment-docs' AND (public.is_staff(auth.uid()) OR owner = auth.uid())
);

CREATE POLICY "driver_docs_read_own" ON storage.objects FOR SELECT TO authenticated USING (
  bucket_id = 'driver-docs' AND (
    public.is_staff(auth.uid()) OR split_part(name, '/', 1) = auth.uid()::text
  )
);
CREATE POLICY "driver_docs_write_own" ON storage.objects FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'driver-docs' AND split_part(name, '/', 1) = auth.uid()::text
);
CREATE POLICY "driver_docs_delete_own" ON storage.objects FOR DELETE TO authenticated USING (
  bucket_id = 'driver-docs' AND (public.is_staff(auth.uid()) OR split_part(name, '/', 1) = auth.uid()::text)
);
