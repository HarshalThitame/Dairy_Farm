import { NextResponse } from "next/server";
import { farmErrorResponse, verifyFarmAccess } from "@/lib/farmGuard";
import { fillSlipGaps } from "@/lib/slipGapFilling";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function readJsonBody(request) {
  const body = await request.json().catch(() => null);
  return body && typeof body === "object" && !Array.isArray(body) ? body : null;
}

export async function POST(request) {
  try {
    await verifyFarmAccess(request);
    const body = await readJsonBody(request);

    if (!body) {
      return NextResponse.json({ error: "माहिती योग्य format मध्ये पाठवा." }, { status: 400 });
    }

    const { extractedData, slip_type: slipType } = body;

    if (!extractedData) {
      return NextResponse.json({ error: "स्लिप डेटा आवश्यक आहे." }, { status: 400 });
    }

    const result = fillSlipGaps(extractedData, slipType || extractedData.slip_type);

    return NextResponse.json({
      data: {
        success: true,
        originalData: result.originalData,
        filledData: result.filledData,
        gapsFilled: result.gapsFilled,
        gapsDetected: result.gapsDetected,
        analysis: result.analysis,
        message: `${result.gapsFilled.length} फील्ड AI ने भरली. कृपया तपासा.`
      }
    });
  } catch (error) {
    return farmErrorResponse(error);
  }
}
