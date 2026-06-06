export const DEFAULT_AI_DATA_PERMISSIONS = {
  milk_records: true,
  slip_history: true,
  analytics: true,
  animal_data: true
};

export const DEFAULT_AI_ASSISTANT_PREFERENCES = {
  enabled: true,
  response_style: "short",
  suggested_questions_enabled: true,
  data_permissions: DEFAULT_AI_DATA_PERMISSIONS
};

const allowedStyles = new Set(["short", "detailed", "expert"]);

const toolPermissionRequirements = {
  getTodayMilkCollection: ["milk_records"],
  getHighestMilkDay: ["milk_records"],
  getLowestMilkDay: ["milk_records"],
  getAverageMilk: ["milk_records"],
  getTotalMilk: ["milk_records"],
  getAverageFat: ["milk_records"],
  getAverageSNF: ["milk_records"],
  getMorningMilk: ["milk_records"],
  getEveningMilk: ["milk_records"],
  getMilkTrend: ["milk_records", "analytics"],
  getRevenue: ["slip_history"],
  getExpenses: ["analytics"],
  getProfit: ["slip_history", "analytics"],
  getMonthlySummary: ["milk_records", "slip_history", "analytics"],
  getFarmStatus: ["milk_records", "slip_history", "analytics"],
  getAnimalSummary: ["animal_data"]
};

export function normalizeAiAssistantPreferences(row = {}) {
  const style = allowedStyles.has(row.response_style) ? row.response_style : "short";
  const sourcePermissions = row.data_permissions && typeof row.data_permissions === "object" && !Array.isArray(row.data_permissions)
    ? row.data_permissions
    : {};
  const dataPermissions = Object.fromEntries(
    Object.entries(DEFAULT_AI_DATA_PERMISSIONS).map(([key, defaultValue]) => [
      key,
      sourcePermissions[key] === undefined ? defaultValue : Boolean(sourcePermissions[key])
    ])
  );

  return {
    enabled: row.enabled !== false,
    response_style: style,
    suggested_questions_enabled: row.suggested_questions_enabled !== false,
    data_permissions: dataPermissions
  };
}

export async function getOrCreateAiAssistantPreferences(supabase, userId, farmId) {
  const { data, error } = await supabase
    .from("ai_assistant_preferences")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (data) {
    if (farmId && data.farm_id !== farmId) {
      const { data: updated, error: updateError } = await supabase
        .from("ai_assistant_preferences")
        .update({ farm_id: farmId, updated_at: new Date().toISOString() })
        .eq("user_id", userId)
        .select("*")
        .single();

      if (updateError) {
        throw updateError;
      }

      return updated;
    }

    return data;
  }

  const { data: created, error: createError } = await supabase
    .from("ai_assistant_preferences")
    .insert({
      user_id: userId,
      farm_id: farmId,
      ...DEFAULT_AI_ASSISTANT_PREFERENCES,
      data_permissions: DEFAULT_AI_DATA_PERMISSIONS
    })
    .select("*")
    .single();

  if (createError) {
    throw createError;
  }

  return created;
}

export function sanitizeAiAssistantPreferences(body = {}, current = {}) {
  const safeBody = body && typeof body === "object" && !Array.isArray(body) ? body : {};
  const normalizedCurrent = normalizeAiAssistantPreferences(current);
  const incomingPermissions = safeBody.data_permissions && typeof safeBody.data_permissions === "object" && !Array.isArray(safeBody.data_permissions)
    ? safeBody.data_permissions
    : {};
  const dataPermissions = Object.fromEntries(
    Object.keys(DEFAULT_AI_DATA_PERMISSIONS).map((key) => [
      key,
      incomingPermissions[key] === undefined
        ? normalizedCurrent.data_permissions[key]
        : Boolean(incomingPermissions[key])
    ])
  );

  const next = {
    ...normalizedCurrent,
    enabled: safeBody.enabled !== undefined ? Boolean(safeBody.enabled) : normalizedCurrent.enabled,
    response_style: allowedStyles.has(safeBody.response_style) ? safeBody.response_style : normalizedCurrent.response_style,
    suggested_questions_enabled:
      safeBody.suggested_questions_enabled !== undefined
        ? Boolean(safeBody.suggested_questions_enabled)
        : normalizedCurrent.suggested_questions_enabled,
    data_permissions: dataPermissions
  };

  return next;
}

export function getToolPermissionError(toolName, preferences) {
  const normalized = normalizeAiAssistantPreferences(preferences);
  const requirements = toolPermissionRequirements[toolName] || [];
  const blocked = requirements.filter((permission) => normalized.data_permissions[permission] === false);

  if (!blocked.length) {
    return null;
  }

  const labels = {
    milk_records: "दूध नोंदी",
    slip_history: "स्लिप इतिहास",
    analytics: "हिशोब/analytics",
    animal_data: "जनावरांची माहिती"
  };

  return {
    noData: true,
    permissionDenied: true,
    blockedPermissions: blocked,
    message: `या उत्तरासाठी ${blocked.map((key) => labels[key] || key).join(", ")} वापरण्याची परवानगी बंद आहे. Settings > AI मध्ये परवानगी सुरू करा.`
  };
}

export function getResponseStyleInstruction(style = "short") {
  if (style === "detailed") {
    return [
      "Response style: Detailed.",
      "Give 2-4 clear Marathi sentences.",
      "When tool data has morningMilk/eveningMilk, include the सकाळ/संध्याकाळ split.",
      "Mention the date/range and one short context line only when supported by data.",
      "Do not add unsupported advice or guessed reasons."
    ].join(" ");
  }

  if (style === "expert") {
    return [
      "Response style: Expert.",
      "Give a practical Marathi answer with exact numbers first.",
      "Then add comparison or interpretation only if the tool output supports it.",
      "End with one useful farm-management insight or caution when data supports it.",
      "Never invent a trend, cause, target, or recommendation."
    ].join(" ");
  }

  return [
    "Response style: Short.",
    "Give one direct Marathi sentence.",
    "Avoid bullet points, long explanations, and extra advice unless the tool output has noData or permissionDenied."
  ].join(" ");
}
