import { NextResponse } from "next/server";
import { farmErrorResponse, verifyFarmAccess } from "@/lib/farmGuard";
import { getSupabaseServerClient } from "@/lib/supabase";
import {
  calculateFinanceStats,
  displayFinanceCategory,
  expenseCategories,
  getMonthInput,
  getMonthRange,
  incomeCategories
} from "@/lib/reportUtils";

export const dynamic = "force-dynamic";

function categoriesToArray(categories, grouped) {
  const normalizedGrouped = Object.entries(grouped).reduce((values, [category, amount]) => {
    const displayCategory = displayFinanceCategory(category);
    values[displayCategory] = (values[displayCategory] || 0) + amount;
    return values;
  }, {});
  const seen = new Set(categories);
  const base = categories.map((category) => ({
    category,
    amount: Number((normalizedGrouped[category] || 0).toFixed(2))
  }));
  const extra = Object.entries(normalizedGrouped)
    .filter(([category]) => !seen.has(category))
    .map(([category, amount]) => ({
      category,
      amount: Number(amount.toFixed(2))
    }));

  return [...base, ...extra].filter((item) => item.amount > 0);
}

export async function GET(request) {
  try {
    const { farmId } = await verifyFarmAccess(request);
    const { searchParams } = new URL(request.url);
    const monthInput = getMonthInput(searchParams);

    if (!monthInput) {
      return NextResponse.json({ error: "महिना किंवा वर्ष चुकीचे आहे." }, { status: 400 });
    }

    const monthRange = getMonthRange(monthInput.month, monthInput.year);
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

    const stats = calculateFinanceStats(data || []);

    return NextResponse.json({
      data: {
        month: monthInput.month,
        year: monthInput.year,
        totalIncome: Number(stats.totalIncome.toFixed(2)),
        totalExpense: Number(stats.totalExpense.toFixed(2)),
        netProfit: Number(stats.netProfit.toFixed(2)),
        incomeByCategory: categoriesToArray(incomeCategories, stats.byCategory.income),
        expenseByCategory: categoriesToArray(expenseCategories, stats.byCategory.expense),
        transactions: data || []
      }
    });
  } catch (error) {
    return farmErrorResponse(error);
  }
}
