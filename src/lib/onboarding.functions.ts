import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Complete shipper (customer) onboarding: create shippers row.
// Role "customer" is already granted on signup.
export const completeShipperOnboarding = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: {
      company_name: string;
      industry?: string;
      contact_person?: string;
      city?: string;
      address?: string;
    }) => {
      if (!data?.company_name || data.company_name.trim().length < 2)
        throw new Error("company_name required");
      return data;
    },
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("shippers").upsert({
      id: context.userId,
      company_name: data.company_name.trim(),
      industry: data.industry?.trim() || null,
      contact_person: data.contact_person?.trim() || null,
      city: data.city?.trim() || null,
      address: data.address?.trim() || null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Complete driver onboarding: create/update drivers row linked to user, grant driver role.
export const completeDriverOnboarding = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: {
      full_name: string;
      phone: string;
      national_id?: string;
      truck_type?: string;
      license_plate?: string;
      vehicle_model?: string;
      vehicle_year?: number;
      capacity_ton?: number;
      ownership?: "owner" | "rental";
      preferred_origin_cities?: string[];
      preferred_destination_cities?: string[];
      preferred_cargo_types?: string[];
      insurance_expiry?: string;
      technical_inspection_expiry?: string;
    }) => {
      if (!data?.full_name || data.full_name.trim().length < 2)
        throw new Error("full_name required");
      if (!data?.phone || data.phone.trim().length < 8)
        throw new Error("phone required");
      return data;
    },
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Upsert driver row keyed by user_id
    const { data: existing } = await supabaseAdmin
      .from("drivers")
      .select("id")
      .eq("user_id", context.userId)
      .maybeSingle();

    const payload = {
      user_id: context.userId,
      full_name: data.full_name.trim(),
      phone: data.phone.trim(),
      national_id: data.national_id?.trim() || null,
      truck_type: data.truck_type?.trim() || null,
      license_plate: data.license_plate?.trim() || null,
      vehicle_model: data.vehicle_model?.trim() || null,
      vehicle_year: data.vehicle_year ?? null,
      capacity_ton: data.capacity_ton ?? null,
      ownership: data.ownership ?? null,
      preferred_origin_cities: data.preferred_origin_cities ?? [],
      preferred_destination_cities: data.preferred_destination_cities ?? [],
      preferred_cargo_types: data.preferred_cargo_types ?? [],
      insurance_expiry: data.insurance_expiry || null,
      technical_inspection_expiry: data.technical_inspection_expiry || null,
      is_active: true,
    };

    if (existing) {
      const { error } = await supabaseAdmin.from("drivers").update(payload).eq("id", existing.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin.from("drivers").insert(payload);
      if (error) throw new Error(error.message);
    }

    // Grant driver role if not present
    const { data: hasDriver } = await supabaseAdmin
      .from("user_roles")
      .select("id")
      .eq("user_id", context.userId)
      .eq("role", "driver")
      .maybeSingle();
    if (!hasDriver) {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: context.userId, role: "driver" });
      if (error && !error.message.includes("duplicate")) throw new Error(error.message);
    }

    return { ok: true };
  });

// Driver requests to take a shipment
export const requestShipment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { shipment_id: string; message?: string }) => {
    if (!data?.shipment_id) throw new Error("shipment_id required");
    return data;
  })
  .handler(async ({ data, context }) => {
    // Find driver row for this user
    const { data: driver, error: dErr } = await context.supabase
      .from("drivers")
      .select("id")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (dErr) throw new Error(dErr.message);
    if (!driver) throw new Error("پروفایل راننده کامل نیست");

    const { error } = await context.supabase.from("shipment_requests").insert({
      shipment_id: data.shipment_id,
      driver_id: driver.id,
      message: data.message?.trim() || null,
    });
    if (error) {
      if (error.message.includes("duplicate")) throw new Error("قبلاً درخواست داده‌اید");
      throw new Error(error.message);
    }
    return { ok: true };
  });
