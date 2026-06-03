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
  getFarmStatus: ["milk_records", "slip_history", "analytics"]
};

export function normalizeAiAssistantPreferences(row = {}) {
  const style = allowedStyles.has(row.response_style) ? row.response_style : "short";

  return {
    enabled: row.enabled !== false,
    response_style: style,
    suggested_questions_enabled: row.suggested_questions_enabled !== false,
    data_permissions: {
      ...DEFAULT_AI_DATA_PERMISSIONS,
      ...(row.data_permissions || {})
    }
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
  const normalizedCurrent = normalizeAiAssistantPreferences(current);
  const next = {
    ...normalizedCurrent,
    enabled: body.enabled !== undefined ? Boolean(body.enabled) : normalizedCurrent.enabled,
    response_style: allowedStyles.has(body.response_style) ? body.response_style : normalizedCurrent.response_style,
    suggested_questions_enabled:
      body.suggested_questions_enabled !== undefined
        ? Boolean(body.suggested_questions_enabled)
        : normalizedCurrent.suggested_questions_enabled,
    data_permissions: {
      ...normalizedCurrent.data_permissions,
      ...(body.data_permissions || {})
    }
  };

  for (const key of Object.keys(DEFAULT_AI_DATA_PERMISSIONS)) {
    next.data_permissions[key] = Boolean(next.data_permissions[key]);
  }

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
    return "Response style: Detailed. Give 2-4 clear Marathi sentences with morning/evening split and important context when available.";
  }

  if (style === "expert") {
    return "Response style: Expert. Give a practical Marathi answer with exact numbers, comparison/interpretation, and one useful farm-management insight when data supports it.";
  }

  return "Response style: Short. Give one direct Marathi answer, preferably in one sentence.";
}
