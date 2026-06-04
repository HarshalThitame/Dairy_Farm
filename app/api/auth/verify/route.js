import { NextResponse } from "next/server";
import {
  farmErrorResponse,
  getAuthToken,
  normalizeFarm,
  normalizeUser,
  verifyFarmAccess
} from "@/lib/farmGuard";
import { setFarmAuthCookie } from "@/lib/authCookies";
import { getSupabaseServerClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request) {
  try {
    const auth = await verifyFarmAccess(request);
    const supabase = getSupabaseServerClient();
    const { data: farm, error } = await supabase
      .from("farms")
      .select("*")
      .eq("id", auth.farmId)
      .single();

    if (error) {
      throw error;
    }

    const response = NextResponse.json({
      valid: true,
      user: normalizeUser({
        ...auth.user,
        farm_id: auth.farmId,
        profile_photo_url: auth.user.profilePhotoUrl,
        profile_photo_storage_path: auth.user.profilePhotoStoragePath,
        is_farm_owner: auth.user.isFarmOwner
      }),
      farm: normalizeFarm(farm)
    });

    return setFarmAuthCookie(response, getAuthToken(request));
  } catch (error) {
    return farmErrorResponse(error);
  }
}
