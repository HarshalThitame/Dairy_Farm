import { NextResponse } from "next/server";
import { farmErrorResponse, verifyFarmAccess } from "@/lib/farmGuard";
import { fillSlipGaps } from "@/lib/slipGapFilling";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request) {
  try {
    await verifyFarmAccess(request);
    const { extractedData, slip_type: slipType } = await request.json();

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
