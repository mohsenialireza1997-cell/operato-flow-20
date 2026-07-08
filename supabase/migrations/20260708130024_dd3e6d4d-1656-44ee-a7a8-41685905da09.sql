
-- Enums
CREATE TYPE public.app_role AS ENUM ('customer','operator','manager','driver','admin');
CREATE TYPE public.shipment_status AS ENUM ('draft','submitted','under_review','price_approved','truck_assigned','loading','in_transit','delivered','completed','archived');
CREATE TYPE public.invoice_status AS ENUM ('unpaid','partial','paid','void');

-- Companies (customer companies)
CREATE TABLE public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  industry text,
  city text,
  province text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  phone text,
  job_title text,
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Roles
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Drivers
CREATE TABLE public.drivers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  phone text,
  license_plate text,
  truck_type text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Shipments
CREATE TABLE public.shipments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE DEFAULT ('SH-' || to_char(now(),'YYMMDD') || '-' || substr(replace(gen_random_uuid()::text,'-',''),1,6)),
  customer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  origin_city text NOT NULL,
  origin_province text,
  destination_city text NOT NULL,
  destination_province text,
  cargo_type text NOT NULL,
  weight_kg numeric,
  volume_m3 numeric,
  truck_type text,
  loading_date date,
  special_instructions text,
  internal_notes text,
  price_toman bigint,
  status public.shipment_status NOT NULL DEFAULT 'submitted',
  operator_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  driver_id uuid REFERENCES public.drivers(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Status history
CREATE TABLE public.shipment_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id uuid NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
  from_status public.shipment_status,
  to_status public.shipment_status NOT NULL,
  note text,
  changed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  changed_at timestamptz NOT NULL DEFAULT now()
);

-- Invoices
CREATE TABLE public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number text NOT NULL UNIQUE DEFAULT ('INV-' || to_char(now(),'YYMMDD') || '-' || substr(replace(gen_random_uuid()::text,'-',''),1,6)),
  shipment_id uuid REFERENCES public.shipments(id) ON DELETE SET NULL,
  customer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_toman bigint NOT NULL,
  status public.invoice_status NOT NULL DEFAULT 'unpaid',
  issued_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz
);

-- Notifications
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text,
  link text,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- GRANTS
GRANT SELECT, INSERT, UPDATE, DELETE ON public.companies TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT ON public.user_roles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.drivers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shipments TO authenticated;
GRANT SELECT, INSERT ON public.shipment_status_history TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoices TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.companies, public.profiles, public.user_roles, public.drivers, public.shipments, public.shipment_status_history, public.invoices, public.notifications TO service_role;

-- has_role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('operator','manager','admin'));
$$;

-- Auto profile + default role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, job_title)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'job_title'
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'customer');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_at helper
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_companies_updated BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_shipments_updated BEFORE UPDATE ON public.shipments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Log shipment status transitions
CREATE OR REPLACE FUNCTION public.log_shipment_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.shipment_status_history(shipment_id,from_status,to_status,changed_by)
    VALUES (NEW.id,NULL,NEW.status,NEW.customer_id);
  ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.shipment_status_history(shipment_id,from_status,to_status,changed_by)
    VALUES (NEW.id,OLD.status,NEW.status,auth.uid());
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_shipment_status_ins AFTER INSERT ON public.shipments FOR EACH ROW EXECUTE FUNCTION public.log_shipment_status();
CREATE TRIGGER trg_shipment_status_upd AFTER UPDATE ON public.shipments FOR EACH ROW EXECUTE FUNCTION public.log_shipment_status();

-- RLS enable
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipment_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policies
-- profiles
CREATE POLICY profiles_self_read ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY profiles_self_upsert ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY profiles_self_update ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid() OR public.is_staff(auth.uid()));

-- user_roles
CREATE POLICY roles_self_read ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_staff(auth.uid()));

-- companies
CREATE POLICY companies_read ON public.companies FOR SELECT TO authenticated USING (created_by = auth.uid() OR EXISTS(SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.company_id = companies.id) OR public.is_staff(auth.uid()));
CREATE POLICY companies_insert ON public.companies FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY companies_update ON public.companies FOR UPDATE TO authenticated USING (created_by = auth.uid() OR public.is_staff(auth.uid()));

-- drivers
CREATE POLICY drivers_read ON public.drivers FOR SELECT TO authenticated USING (public.is_staff(auth.uid()) OR user_id = auth.uid());
CREATE POLICY drivers_staff_write ON public.drivers FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- shipments
CREATE POLICY shipments_read ON public.shipments FOR SELECT TO authenticated USING (
  customer_id = auth.uid()
  OR public.is_staff(auth.uid())
  OR EXISTS(SELECT 1 FROM public.drivers d WHERE d.id = shipments.driver_id AND d.user_id = auth.uid())
);
CREATE POLICY shipments_customer_insert ON public.shipments FOR INSERT TO authenticated WITH CHECK (customer_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY shipments_update ON public.shipments FOR UPDATE TO authenticated USING (
  public.is_staff(auth.uid())
  OR (customer_id = auth.uid() AND status IN ('draft','submitted'))
  OR EXISTS(SELECT 1 FROM public.drivers d WHERE d.id = shipments.driver_id AND d.user_id = auth.uid())
);

-- status history
CREATE POLICY history_read ON public.shipment_status_history FOR SELECT TO authenticated USING (
  public.is_staff(auth.uid())
  OR EXISTS(SELECT 1 FROM public.shipments s WHERE s.id = shipment_id AND (s.customer_id = auth.uid() OR EXISTS(SELECT 1 FROM public.drivers d WHERE d.id = s.driver_id AND d.user_id = auth.uid())))
);

-- invoices
CREATE POLICY invoices_read ON public.invoices FOR SELECT TO authenticated USING (customer_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY invoices_staff_write ON public.invoices FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- notifications
CREATE POLICY notif_own ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY notif_own_update ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY notif_staff_insert ON public.notifications FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()) OR user_id = auth.uid());
