import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type Role = "customer" | "operator" | "manager" | "driver" | "admin";
const ROLES: Role[] = ["customer", "operator", "manager", "driver", "admin"];

async function assertAdminOrManager(ctx: {
  supabase: { rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }> };
  userId: string;
}) {
  const [{ data: isAdmin }, { data: isManager }] = await Promise.all([
    ctx.supabase.rpc("has_role", { _user_id: ctx.userId, _role: "admin" }),
    ctx.supabase.rpc("has_role", { _user_id: ctx.userId, _role: "manager" }),
  ]);
  if (!isAdmin && !isManager) {
    throw new Error("Forbidden: only admin or manager can change roles");
  }
  return { isAdmin: Boolean(isAdmin) };
}

export const assignRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { userId: string; role: Role; grant: boolean }) => {
    if (!data?.userId || typeof data.userId !== "string") throw new Error("Invalid userId");
    if (!ROLES.includes(data.role)) throw new Error("Invalid role");
    if (typeof data.grant !== "boolean") throw new Error("Invalid grant");
    return data;
  })
  .handler(async ({ data, context }) => {
    const { isAdmin } = await assertAdminOrManager(context);
    // Only admin can create other admins
    if (data.role === "admin" && !isAdmin) {
      throw new Error("Forbidden: only admin can grant the admin role");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.grant) {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: data.userId, role: data.role });
      if (error && !error.message.includes("duplicate")) throw new Error(error.message);
    } else {
      // Prevent removing the last admin
      if (data.role === "admin") {
        const { count } = await supabaseAdmin
          .from("user_roles")
          .select("id", { count: "exact", head: true })
          .eq("role", "admin");
        if ((count ?? 0) <= 1) throw new Error("Cannot remove the last admin");
      }
      const { error } = await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", data.userId)
        .eq("role", data.role);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const listUsersWithRoles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdminOrManager(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: profiles }, { data: roles }] = await Promise.all([
      supabaseAdmin.from("profiles").select("id, full_name, phone, job_title"),
      supabaseAdmin.from("user_roles").select("user_id, role"),
    ]);
    const rolesByUser = new Map<string, string[]>();
    for (const r of roles ?? []) {
      const arr = rolesByUser.get(r.user_id) ?? [];
      arr.push(r.role);
      rolesByUser.set(r.user_id, arr);
    }
    return (profiles ?? []).map((p) => ({
      id: p.id,
      full_name: p.full_name,
      phone: p.phone,
      job_title: p.job_title,
      roles: rolesByUser.get(p.id) ?? [],
    }));
  });
