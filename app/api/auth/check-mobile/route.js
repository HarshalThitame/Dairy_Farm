import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";
import { readJsonBody } from "@/lib/apiSafety";

export const dynamic = "force-dynamic";

function normalizeMobile(mobile) {
  return String(mobile || "").replace(/\D/g, "");
}

export async function POST(request) {
  try {
    const body = await readJsonBody(request);
    const mobile = normalizeMobile(body.mobile);

    if (!/^[6-9]\d{9}$/.test(mobile)) {
      return NextResponse.json(
        { available: false, error: "मोबाइल नंबर तपासा." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServerClient();
    const [{ data: farm }, { data: user }] = await Promise.all([
      supabase.from("farms").select("id").eq("owner_mobile", mobile).maybeSingle(),
      supabase.from("users").select("id").eq("mobile", mobile).maybeSingle()
    ]);

    return NextResponse.json({ available: !farm && !user });
  } catch (error) {
    return NextResponse.json(
      { available: false, error: "मोबाइल नंबर तपासताना चूक झाली." },
      { status: error.status || 500 }
    );
  }
}
