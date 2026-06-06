import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";

const SUPER_ADMIN_JWT_SECRET =
  process.env.SUPER_ADMIN_JWT_SECRET ||
  process.env.JWT_SECRET ||
  "goshala-super-admin-local-secret-change-before-production";

export function getSuperAdminToken(request) {
  const authorization = request.headers.get("authorization") || "";

  if (authorization.startsWith("Bearer ")) {
    return authorization.slice(7).trim();
  }

  return request.cookies?.get("super_admin_token")?.value || "";
}

export function signSuperAdminToken(admin) {
  return jwt.sign(
    {
      adminId: admin.id,
      email: admin.email,
      name: admin.name,
      isSuperAdmin: true
    },
    SUPER_ADMIN_JWT_SECRET,
    { expiresIn: "12h" }
  );
}

export function adminAuthError(message = "Unauthorized", status = 401) {
  const error = new Error(message);
  error.status = status;
  return error;
}

export function superAdminErrorResponse(error) {
  const status = error.status || 500;
  const response = NextResponse.json(
    {
      error: error.message || "Server error",
      code: status === 401 ? "ADMIN_SESSION_EXPIRED" : "ADMIN_ERROR"
    },
    { status }
  );

  if (status === 401) {
    response.cookies.set("super_admin_token", "", {
      path: "/",
      maxAge: 0,
      sameSite: "lax"
    });
  }

  return response;
}

export async function verifySuperAdmin(request) {
  const token = getSuperAdminToken(request);

  if (!token) {
    throw adminAuthError("Unauthorized", 401);
  }

  let decoded;

  try {
    decoded = jwt.verify(token, SUPER_ADMIN_JWT_SECRET);
  } catch {
    throw adminAuthError("Session expired", 401);
  }

  if (!decoded?.isSuperAdmin || !decoded?.adminId) {
    throw adminAuthError("Forbidden", 403);
  }

  const supabase = getSupabaseServerClient();
  const { data: admin, error } = await supabase
    .from("super_admins")
    .select("id, email, name, mobile, is_active, last_login")
    .eq("id", decoded.adminId)
    .single();

  if (error || !admin) {
    throw adminAuthError("Admin not found", 401);
  }

  if (!admin.is_active) {
    throw adminAuthError("Account suspended", 403);
  }

  return {
    adminId: admin.id,
    email: admin.email,
    name: admin.name,
    admin,
    decoded
  };
}

export function getRequestIp(request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    ""
  );
}

export async function logAdminAction(request, adminId, action, farmId = null, details = {}) {
  try {
    const supabase = getSupabaseServerClient();
    await supabase.from("admin_activity_log").insert({
      admin_id: adminId || null,
      farm_id: farmId || null,
      action,
      details,
      ip_address: getRequestIp(request),
      user_agent: request.headers.get("user-agent") || ""
    });
  } catch {
    // Logging should never block the admin action.
  }
}

export function maskMobile(mobile) {
  const value = String(mobile || "");
  if (value.length < 6) {
    return value;
  }
  return `${value.slice(0, 5)}*****`;
}

export function csvEscape(value) {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

export function toCsv(rows, columns) {
  const header = columns.map((column) => csvEscape(column.label)).join(",");
  const body = rows.map((row) =>
    columns.map((column) => csvEscape(row[column.key])).join(",")
  );
  return [header, ...body].join("\n");
}
