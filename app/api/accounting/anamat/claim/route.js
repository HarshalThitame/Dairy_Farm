import { NextResponse } from "next/server";
import { refreshMonthlyAnamatSummary } from "@/lib/anamatUtils";
import { farmErrorResponse, verifyFarmOwner } from "@/lib/farmGuard";
import { getTodayISODate } from "@/lib/marathiUtils";
import { getSupabaseServerClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

function roundMoney(value) {
  return Number(Number(value || 0).toFixed(2));
}

function availableAmount(record) {
  return Math.max(0, Number(record.amount_cut || 0) - Number(record.claimed_amount || 0));
}

function cleanText(value) {
  const text = String(value || "").trim();
  return text || null;
}

export async function POST(request) {
  try {
    const { farmId } = await verifyFarmOwner(request);
    const body = await request.json();
    const claimAmount = roundMoney(body.claimAmount ?? body.amount);
    const claimNotes = cleanText(body.claimNotes || body.notes);

    if (!Number.isFinite(claimAmount) || claimAmount <= 0) {
      return NextResponse.json({ error: "मिळालेली रक्कम ० पेक्षा जास्त असावी." }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    const { data: records, error: fetchError } = await supabase
      .from("anamat_tracking")
      .select("*")
      .eq("farm_id", farmId)
      .in("status", ["accumulated", "partial_claimed"])
      .order("cut_date", { ascending: true })
      .order("created_at", { ascending: true });

    if (fetchError) {
      throw fetchError;
    }

    const claimableRecords = (records || []).filter((record) => availableAmount(record) > 0);
    const totalAvailable = roundMoney(
      claimableRecords.reduce((sum, record) => sum + availableAmount(record), 0)
    );

    if (claimAmount > totalAvailable) {
      return NextResponse.json(
        {
          error: `अयोग्य रक्कम. उपलब्ध अनामत ₹${totalAvailable} आहे.`,
          totalAvailable
        },
        { status: 400 }
      );
    }

    const today = getTodayISODate();
    const { data: financeRecord, error: financeError } = await supabase
      .from("finance_records")
      .insert({
        farm_id: farmId,
        date: today,
        type: "उत्पन्न",
        category: "अनामत परतावा",
        amount: claimAmount,
        description: claimNotes || "अनामत परतावा",
        accounting_period: "monthly"
      })
      .select()
      .single();

    if (financeError) {
      throw financeError;
    }

    await supabase
      .from("anamat_transactions")
      .insert({
        farm_id: farmId,
        date: today,
        amount: claimAmount,
        type: "withdrawal",
        notes: claimNotes || "अनामत मिळाली"
      })
      .then(({ error }) => {
        if (error) {
          console.error("Anamat withdrawal ledger skipped:", error.message);
        }
      });

    let remainingClaim = claimAmount;
    for (const record of claimableRecords) {
      if (remainingClaim <= 0) {
        break;
      }

      const available = availableAmount(record);
      const claimFromThis = Math.min(remainingClaim, available);
      const newClaimedAmount = roundMoney(Number(record.claimed_amount || 0) + claimFromThis);
      const newStatus = newClaimedAmount >= Number(record.amount_cut || 0) ? "claimed" : "partial_claimed";
      remainingClaim = roundMoney(remainingClaim - claimFromThis);

      const { error: updateError } = await supabase
        .from("anamat_tracking")
        .update({
          claimed_amount: newClaimedAmount,
          status: newStatus,
          claim_date: today,
          claim_notes: claimNotes,
          updated_at: new Date().toISOString()
        })
        .eq("id", record.id)
        .eq("farm_id", farmId);

      if (updateError) {
        throw updateError;
      }
    }

    const monthly = await refreshMonthlyAnamatSummary(supabase, farmId, today);

    return NextResponse.json({
      data: {
        success: true,
        claimedAmount: claimAmount,
        remainingBalance: roundMoney(totalAvailable - claimAmount),
        transactionId: financeRecord.id,
        financeRecord,
        monthly,
        message: `✅ अनामत मिळाली म्हणून नोंद झाली. रक्कम ₹${claimAmount}`
      }
    });
  } catch (error) {
    return farmErrorResponse(error);
  }
}
