import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import { farmErrorResponse, verifyFarmAccess } from "@/lib/farmGuard";
import { getSupabaseServerClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function createPdfBuffer(draw) {
  return new Promise((resolve, reject) => {
    const fontCandidates = [
      path.join(process.cwd(), "public", "fonts", "NotoSansDevanagari-Regular.ttf"),
      "/usr/share/fonts/truetype/noto/NotoSansDevanagari-Regular.ttf"
    ];
    const devanagariFont = fontCandidates.find((candidate) => fs.existsSync(candidate));
    if (!devanagariFont) {
      reject(new Error("PDF साठी Marathi font सापडला नाही."));
      return;
    }

    const doc = new PDFDocument({
      size: "A4",
      margin: 48,
      autoFirstPage: false,
      font: devanagariFont
    });
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.registerFont("NotoSansDevanagari", devanagariFont);
    doc.addPage();
    doc.font("NotoSansDevanagari");

    draw(doc);
    doc.end();
  });
}

export async function POST(request) {
  try {
    const auth = await verifyFarmAccess(request);
    const body = await request.json().catch(() => ({}));
    const achievementId = body.achievementId;

    if (!achievementId) {
      return Response.json({ error: "Achievement निवडा." }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("user_achievements")
      .select("unlocked_at, points_awarded, achievements(*)")
      .eq("farm_id", auth.farmId)
      .eq("achievement_id", achievementId)
      .single();

    if (error || !data?.achievements) {
      return Response.json({ error: "Unlocked achievement सापडले नाही." }, { status: 404 });
    }

    const achievement = data.achievements;
    const pdf = await createPdfBuffer((doc) => {
      doc.roundedRect(40, 40, 515, 720, 18).fillAndStroke("#f0fdf4", "#bbf7d0");
      doc.fillColor("#052e16").fontSize(28).text("माझी डेअरी Achievement", 70, 85, { align: "center" });
      doc.fontSize(82).text(achievement.icon || "🏅", 70, 155, { align: "center" });
      doc.fillColor("#14532d").fontSize(30).text(achievement.title, 70, 270, { align: "center" });
      doc.fillColor("#334155").fontSize(17).text(achievement.description, 90, 330, { align: "center", width: 420 });
      doc.fillColor("#166534").fontSize(18).text(`Points: ${data.points_awarded || achievement.points}`, 90, 430, { align: "center", width: 420 });
      doc.fillColor("#475569").fontSize(14).text(`Unlocked: ${new Date(data.unlocked_at).toLocaleDateString("mr-IN")}`, 90, 470, { align: "center", width: 420 });
      doc.fillColor("#0f172a").fontSize(16).text("स्मार्ट डेअरी व्यवस्थापन", 90, 620, { align: "center", width: 420 });
    });

    return new Response(pdf, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Length": String(pdf.length),
        "Content-Disposition": `attachment; filename="achievement-${achievement.code}.pdf"`,
        "Cache-Control": "no-store"
      }
    });
  } catch (error) {
    return farmErrorResponse(error);
  }
}
