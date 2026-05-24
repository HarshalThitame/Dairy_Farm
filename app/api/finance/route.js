import { NextResponse } from "next/server";
import { farmErrorResponse, verifyFarmAccess, verifyFarmOwner } from "@/lib/farmGuard";
import { getSupabaseServerClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const financeFields = [
  "date",
  "type",
  "category",
  "amount",
  "cow_id",
  "description"
];

function pickFields(body) {
  return financeFields.reduce((payload, field) => {
    if (body[field] !== undefined) {
      payload[field] = body[field];
    }
    return payload;
  }, {});
}

function padDatePart(value) {
  return String(value).padStart(2, "0");
}

function getIndiaMonthParts() {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit"
  }).formatToParts(new Date());

  return {
    year: Number(parts.find((part) => part.type === "year").value),
    month: Number(parts.find((part) => part.type === "month").value)
  };
}

function getMonthRange(searchParams) {
  const current = getIndiaMonthParts();
  const month = Number(searchParams.get("month") || current.month);
  const year = Number(searchParams.get("year") || current.year);

  if (!Number.isInteger(month) || month < 1 || month > 12 || !Number.isInteger(year)) {
    return null;
  }

  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;

  return {
    start: `${year}-${padDatePart(month)}-01`,
    end: `${nextYear}-${padDatePart(nextMonth)}-01`
  };
}

export async function GET(request) {
  try {
    const { farmId } = await verifyFarmAccess(request);
    const { searchParams } = new URL(request.url);
    const monthRange = getMonthRange(searchParams);

    if (!monthRange) {
      return NextResponse.json({ error: "महिना किंवा वर्ष चुकीचे आहे." }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("finance_records")
      .select("*, cows(id, name, breed)")
      .eq("farm_id", farmId)
      .gte("date", monthRange.start)
      .lt("date", monthRange.end)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({ data });
  } catch (error) {
    return farmErrorResponse(error);
  }
}

export async function POST(request) {
  try {
    const body = await request.json();

    if (!body.date || !body.type || body.amount === undefined || body.amount === null || body.amount === "") {
      return NextResponse.json({ error: "तारीख, प्रकार आणि रक्कम आवश्यक आहे." }, { status: 400 });
    }

    const { farmId } = await verifyFarmOwner(request);
    if (body.cow_id) {
      await verifyFarmAccess(request, body.cow_id);
    }
    const payload = {
      ...pickFields(body),
      cow_id: body.cow_id || null,
      farm_id: farmId
    };
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("finance_records")
      .insert(payload)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return farmErrorResponse(error);
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json({ error: "व्यवहार क्रमांक आवश्यक आहे." }, { status: 400 });
    }

    const { farmId } = await verifyFarmOwner(request);
    if (body.cow_id) {
      await verifyFarmAccess(request, body.cow_id);
    }
    const payload = pickFields(body);

    if (Object.keys(payload).length === 0) {
      return NextResponse.json({ error: "बदल करण्यासाठी माहिती द्या." }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("finance_records")
      .update(payload)
      .eq("id", body.id)
      .eq("farm_id", farmId)
      .select()
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "व्यवहार सापडला नाही." }, { status: 404 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    return farmErrorResponse(error);
  }
}

export async function DELETE(request) {
  try {
    const { farmId } = await verifyFarmOwner(request);
    const { searchParams } = new URL(request.url);
    let id = searchParams.get("id");

    if (!id) {
      const body = await request.json().catch(() => ({}));
      id = body.id;
    }

    if (!id) {
      return NextResponse.json({ error: "व्यवहार क्रमांक आवश्यक आहे." }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("finance_records")
      .delete()
      .eq("id", id)
      .eq("farm_id", farmId)
      .select()
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "व्यवहार सापडला नाही." }, { status: 404 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    return farmErrorResponse(error);
  }
}
