export async function createOcrAuditLog(supabase, payload = {}) {
  if (!supabase || !payload.farm_id) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from("ocr_audit_logs")
      .insert({
        farm_id: payload.farm_id,
        slip_upload_id: payload.slip_upload_id || null,
        image_url: payload.image_url || null,
        image_storage_path: payload.image_storage_path || null,
        ocr_provider: payload.ocr_provider || "google_vision",
        ocr_text: payload.ocr_text || null,
        ocr_confidence: payload.ocr_confidence ?? null,
        ai_model: payload.ai_model || null,
        ai_json: payload.ai_json || null,
        confidence: payload.confidence ?? null,
        warnings: payload.warnings || [],
        validation: payload.validation || null
      })
      .select()
      .single();

    if (error) {
      return null;
    }

    return data;
  } catch {
    return null;
  }
}
