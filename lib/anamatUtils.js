import { getMonthYearString, roundMoney } from "@/lib/accountingUtils";

function getMonthRangeForDate(dateString) {
  if (!dateString || !/^\d{4}-\d{2}-\d{2}/.test(String(dateString))) {
    return null;
  }

  const [yearText, monthText] = String(dateString).slice(0, 10).split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  const nextMonth = new Date(year, month, 1);

  return {
    monthYear: getMonthYearString(month, year),
    start: `${yearText}-${monthText}-01`,
    end: `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, "0")}-01`
  };
}

export async function refreshMonthlyAnamatSummary(supabase, farmId, dateString) {
  const range = getMonthRangeForDate(dateString);

  if (!range) {
    return null;
  }

  const [{ data: cuts, error: cutsError }, { data: claims, error: claimsError }, { data: allRecords, error: allError }] =
    await Promise.all([
      supabase
        .from("anamat_tracking")
        .select("amount_cut")
        .eq("farm_id", farmId)
        .gte("cut_date", range.start)
        .lt("cut_date", range.end),
      supabase
        .from("anamat_tracking")
        .select("claimed_amount")
        .eq("farm_id", farmId)
        .gte("claim_date", range.start)
        .lt("claim_date", range.end),
      supabase
        .from("anamat_tracking")
        .select("amount_cut, claimed_amount")
        .eq("farm_id", farmId)
    ]);

  const error = cutsError || claimsError || allError;
  if (error) {
    throw error;
  }

  const totalAccumulated = (cuts || []).reduce((sum, row) => sum + Number(row.amount_cut || 0), 0);
  const totalClaimed = (claims || []).reduce((sum, row) => sum + Number(row.claimed_amount || 0), 0);
  const runningBalance = (allRecords || []).reduce(
    (sum, row) => sum + Number(row.amount_cut || 0) - Number(row.claimed_amount || 0),
    0
  );

  const { data, error: upsertError } = await supabase
    .from("monthly_anamat_summary")
    .upsert(
      {
        farm_id: farmId,
        month_year: range.monthYear,
        total_anamat_accumulated: roundMoney(totalAccumulated),
        settlement_count: cuts?.length || 0,
        total_anamat_claimed: roundMoney(totalClaimed),
        claim_count: claims?.filter((row) => Number(row.claimed_amount || 0) > 0).length || 0,
        running_balance: roundMoney(runningBalance)
      },
      { onConflict: "farm_id,month_year" }
    )
    .select()
    .single();

  if (upsertError) {
    throw upsertError;
  }

  return data;
}

async function syncAnamatDepositTransaction(supabase, farmId, settlement, amountCut) {
  try {
    if (!settlement?.id) {
      return null;
    }

    const { data: existing, error: fetchError } = await supabase
      .from("anamat_transactions")
      .select("id")
      .eq("farm_id", farmId)
      .eq("settlement_id", settlement.id)
      .eq("type", "deposit")
      .maybeSingle();

    if (fetchError) {
      throw fetchError;
    }

    if (amountCut <= 0) {
      if (existing?.id) {
        await supabase
          .from("anamat_transactions")
          .delete()
          .eq("id", existing.id)
          .eq("farm_id", farmId);
      }
      return null;
    }

    const payload = {
      farm_id: farmId,
      settlement_id: settlement.id,
      date: settlement.settlement_date,
      amount: amountCut,
      type: "deposit",
      notes: "सेटलमेंटमधून अनामत जमा"
    };

    if (existing?.id) {
      const { data, error } = await supabase
        .from("anamat_transactions")
        .update(payload)
        .eq("id", existing.id)
        .eq("farm_id", farmId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    }

    const { data, error } = await supabase
      .from("anamat_transactions")
      .insert(payload)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    // The ledger table is added by Phase 24 SQL. Keep settlement saves working
    // even if the live DB has not been migrated yet.
    console.error("Anamat transaction sync skipped:", error?.message || error);
    return null;
  }
}

export async function syncAnamatTrackingForSettlement(supabase, farmId, settlement) {
  if (!settlement?.id) {
    return null;
  }

  const { data: existingRecords, error: fetchError } = await supabase
    .from("anamat_tracking")
    .select("*")
    .eq("farm_id", farmId)
    .eq("settlement_id", settlement.id)
    .order("created_at", { ascending: true });

  if (fetchError) {
    throw fetchError;
  }

  const anamatCut = Number(settlement.anamat_cut || 0);
  const claimedAmount = roundMoney(
    (existingRecords || []).reduce((sum, record) => sum + Number(record.claimed_amount || 0), 0)
  );

  if (anamatCut <= 0 && claimedAmount <= 0) {
    await deleteAnamatTrackingForSettlement(supabase, farmId, settlement.id);
    await syncAnamatDepositTransaction(supabase, farmId, settlement, 0);
    return null;
  }

  const amountCut = roundMoney(Math.max(anamatCut, claimedAmount));
  const normalizedClaimed = claimedAmount;
  const status =
    normalizedClaimed <= 0
      ? "accumulated"
      : normalizedClaimed >= amountCut
        ? "claimed"
        : "partial_claimed";
  const primaryRecord = existingRecords?.[0] || null;
  const payload = {
    farm_id: farmId,
    settlement_id: settlement.id,
    amount_cut: amountCut,
    cut_date: settlement.settlement_date,
    status,
    claimed_amount: normalizedClaimed,
    settlement_period_start: settlement.period_start,
    settlement_period_end: settlement.period_end,
    updated_at: new Date().toISOString()
  };

  if (primaryRecord) {
    const { data, error } = await supabase
      .from("anamat_tracking")
      .update(payload)
      .eq("id", primaryRecord.id)
      .eq("farm_id", farmId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    const extraIds = (existingRecords || []).slice(1).map((record) => record.id);
    if (extraIds.length > 0) {
      const { error: deleteExtrasError } = await supabase
        .from("anamat_tracking")
        .delete()
        .eq("farm_id", farmId)
        .in("id", extraIds);

      if (deleteExtrasError) {
        throw deleteExtrasError;
      }
    }

    await syncAnamatDepositTransaction(supabase, farmId, settlement, anamatCut);
    return data;
  }

  const { data, error } = await supabase
    .from("anamat_tracking")
    .insert(payload)
    .select()
    .single();

  if (error) {
    throw error;
  }

  await syncAnamatDepositTransaction(supabase, farmId, settlement, anamatCut);
  return data;
}

export async function deleteAnamatTrackingForSettlement(supabase, farmId, settlementId) {
  if (!settlementId) {
    return;
  }

  const { data: records, error: fetchError } = await supabase
    .from("anamat_tracking")
    .select("*")
    .eq("farm_id", farmId)
    .eq("settlement_id", settlementId);

  if (fetchError) {
    throw fetchError;
  }

  const unclaimedIds = [];
  const claimedRecords = [];

  for (const record of records || []) {
    if (Number(record.claimed_amount || 0) > 0) {
      claimedRecords.push(record);
    } else {
      unclaimedIds.push(record.id);
    }
  }

  if (unclaimedIds.length > 0) {
    const { error } = await supabase
      .from("anamat_tracking")
      .delete()
      .eq("farm_id", farmId)
      .in("id", unclaimedIds);

    if (error) {
      throw error;
    }
  }

  for (const record of claimedRecords) {
    const claimedAmount = roundMoney(record.claimed_amount || 0);
    const { error } = await supabase
      .from("anamat_tracking")
      .update({
        settlement_id: null,
        amount_cut: claimedAmount,
        status: "claimed",
        updated_at: new Date().toISOString()
      })
      .eq("id", record.id)
      .eq("farm_id", farmId);

    if (error) {
      throw error;
    }
  }
}
