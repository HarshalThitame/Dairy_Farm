import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";
import {
  logAdminAction,
  superAdminErrorResponse,
  verifySuperAdmin
} from "@/lib/superAdminGuard";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const editableFarmFields = [
  "farm_name",
  "owner_name",
  "owner_mobile",
  "owner_email",
  "village_name",
  "taluka_name",
  "district_name",
  "state_name",
  "farm_address",
  "dairy_name",
  "dairy_member_number",
  "vet_name",
  "vet_mobile",
  "subscription_status",
  "subscription_started_at",
  "subscription_ends_at",
  "total_cows",
  "milk_rate_default",
  "morning_session_time",
  "evening_session_time",
  "show_marathi_numbers",
  "low_milk_alert_litres",
  "admin_notes"
];

async function countRows(supabase, table, farmId) {
  const { count, error } = await supabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq("farm_id", farmId);
  if (error) {
    throw error;
  }
  return count || 0;
}

async function getFarmDetails(supabase, farmId) {
  const { data: farm, error: farmError } = await supabase
    .from("farms")
    .select("*")
    .eq("id", farmId)
    .single();

  if (farmError || !farm) {
    const error = new Error("Farm not found");
    error.status = 404;
    throw error;
  }

  const [
    cowCount,
    milkCount,
    aiCount,
    reminderCount,
    userResult,
    activityResult,
    lastMilkResult
  ] = await Promise.all([
    countRows(supabase, "cows", farmId),
    countRows(supabase, "milk_records", farmId),
    countRows(supabase, "ai_records", farmId),
    countRows(supabase, "reminders", farmId),
    supabase
      .from("users")
      .select("id, mobile, name, role, is_active, is_farm_owner, last_login, created_at")
      .eq("farm_id", farmId)
      .order("created_at", { ascending: true }),
    supabase
      .from("admin_activity_log")
      .select("id, action, details, created_at, super_admins(name, email)")
      .eq("farm_id", farmId)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("milk_records")
      .select("date, total_litres, created_at")
      .eq("farm_id", farmId)
      .order("date", { ascending: false })
      .limit(1)
  ]);

  const lastLoginUser = (userResult.data || [])
    .filter((user) => user.last_login)
    .sort((a, b) => new Date(b.last_login) - new Date(a.last_login))[0];

  return {
    farm,
    stats: {
      cowCount,
      milkCount,
      aiCount,
      reminderCount,
      userCount: userResult.data?.length || 0,
      lastMilkEntry: lastMilkResult.data?.[0] || null,
      lastLogin: lastLoginUser
        ? { date: lastLoginUser.last_login, userName: lastLoginUser.name }
        : null
    },
    users: userResult.data || [],
    activity: activityResult.data || []
  };
}

export async function GET(request, { params }) {
  try {
    const { adminId } = await verifySuperAdmin(request);
    const supabase = getSupabaseServerClient();
    const data = await getFarmDetails(supabase, params.id);
    await logAdminAction(request, adminId, "viewed_farm", params.id, { farmName: data.farm.farm_name });
    return NextResponse.json(data);
  } catch (error) {
    return superAdminErrorResponse(error);
  }
}

export async function PUT(request, { params }) {
  try {
    const { adminId } = await verifySuperAdmin(request);
    const body = await request.json();
    const payload = editableFarmFields.reduce((current, field) => {
      if (body[field] !== undefined) {
        current[field] = body[field];
      }
      return current;
    }, {});

    if (!Object.keys(payload).length) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    payload.updated_at = new Date().toISOString();
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("farms")
      .update(payload)
      .eq("id", params.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    await logAdminAction(request, adminId, "edited_farm", params.id, { fields: Object.keys(payload) });
    return NextResponse.json({ farm: data });
  } catch (error) {
    return superAdminErrorResponse(error);
  }
}

export async function PATCH(request, { params }) {
  try {
    const { adminId } = await verifySuperAdmin(request);
    const body = await request.json();
    const action = body.action;
    const supabase = getSupabaseServerClient();
    let payload = {};

    if (action === "suspend") {
      payload = {
        is_active: false,
        suspended_reason: body.reason || "Suspended by super admin",
        suspended_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    } else if (action === "unsuspend") {
      payload = {
        is_active: true,
        suspended_reason: null,
        suspended_at: null,
        updated_at: new Date().toISOString()
      };
    } else if (action === "extend_trial") {
      const days = Math.max(1, Number(body.days || 30));
      const { data: farm, error: farmError } = await supabase
        .from("farms")
        .select("trial_ends_at")
        .eq("id", params.id)
        .single();
      if (farmError) {
        throw farmError;
      }
      const base = farm?.trial_ends_at && new Date(farm.trial_ends_at) > new Date()
        ? new Date(farm.trial_ends_at)
        : new Date();
      base.setDate(base.getDate() + days);
      payload = {
        subscription_status: "trial",
        trial_ends_at: base.toISOString(),
        updated_at: new Date().toISOString()
      };
    } else if (action === "activate") {
      const ends = new Date();
      ends.setFullYear(ends.getFullYear() + 1);
      payload = {
        is_active: true,
        subscription_status: "active",
        subscription_started_at: new Date().toISOString(),
        subscription_ends_at: ends.toISOString(),
        updated_at: new Date().toISOString()
      };
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("farms")
      .update(payload)
      .eq("id", params.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    await logAdminAction(request, adminId, action, params.id, { payload });
    return NextResponse.json({ farm: data });
  } catch (error) {
    return superAdminErrorResponse(error);
  }
}
