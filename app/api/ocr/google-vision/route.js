import { NextResponse } from "next/server";
import { farmErrorResponse, verifyFarmAccess } from "@/lib/farmGuard";
import { extractTextWithGoogleVision } from "@/lib/googleVisionOCR";
import { readJsonBody } from "@/lib/apiSafety";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request) {
  try {
    await verifyFarmAccess(request);
    const { imageBase64 } = await readJsonBody(request);

    if (!imageBase64) {
      return NextResponse.json({ error: "फोटो डेटा आवश्यक आहे." }, { status: 400 });
    }

    const result = await extractTextWithGoogleVision(imageBase64);

    return NextResponse.json({
      data: {
        success: true,
        rawText: result.rawText,
        confidence: result.confidence,
        provider: result.provider,
        pageCount: result.pageCount,
        message: "Google Vision OCR पूर्ण झाले."
      }
    });
  } catch (error) {
    return farmErrorResponse(error);
  }
}
