#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const ROOT_DIR = path.resolve(__dirname, "..");
const BASE_URL = process.env.MANUAL_BASE_URL || "http://localhost:3000";
const OUTPUT_DIR = path.resolve(ROOT_DIR, process.env.MANUAL_VIDEO_DIR || "manual-videos");
const FINAL_VIDEO = path.join(OUTPUT_DIR, "ai-slip-scan-user-manual.webm");
const TEMP_VIDEO_DIR = path.join(OUTPUT_DIR, ".tmp-ai-slip-scan");
const UPLOAD_ID = "11111111-1111-4111-8111-111111111111";
const SESSION_TOKEN = "manual-demo-token";

const demoUser = {
  id: "manual-user",
  name: "Demo User",
  role: "admin",
  isFarmOwner: true
};

const demoFarm = {
  id: "manual-farm",
  name: "Manual Demo Farm",
  farmName: "माझी डेअरी Demo"
};

const demoUpload = {
  id: UPLOAD_ID,
  original_filename: "demo-dairy-slip.jpg",
  original_size: 820000,
  compressed_size: 182000,
  compression_ratio: 78,
  compressed_image_url: imageDataUrl(),
  slip_type: "daily",
  ai_model_used: "gpt-4.1-mini",
  ai_confidence: 0.96,
  extraction_status: "success",
  created_at: "2026-06-05T08:20:00.000Z",
  updated_at: "2026-06-05T08:20:00.000Z"
};

const extractedData = {
  slip_type: "daily",
  dairy_name: "सह्याद्री दूध डेअरी",
  farmer_name: "राहुल पाटील",
  farmer_code: "MD-1024",
  member_number: "MD-1024",
  dairy_member_code: "MD-1024",
  slip_date: "2026-06-05",
  slip_time: "07:42:00",
  session: "सकाळ",
  milk_type: "cow",
  liters: 14.5,
  fat_percentage: 4.2,
  snf_percentage: 8.7,
  clr_score: 28,
  rate_per_liter: 38.5,
  slip_printed_amount: 558.25,
  total_amount: 558.25,
  confidence_score: 0.96,
  missing_fields: [],
  ai_warnings: ["जतन करण्यापूर्वी लिटर, दर आणि रक्कम तपासा."],
  notes: "Manual video demo data"
};

function imageDataUrl() {
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="900" height="1200" viewBox="0 0 900 1200">
    <rect width="900" height="1200" fill="#f8fafc"/>
    <rect x="80" y="70" width="740" height="1060" rx="34" fill="#ffffff" stroke="#cbd5e1" stroke-width="8"/>
    <rect x="80" y="70" width="740" height="130" rx="34" fill="#0f766e"/>
    <text x="450" y="150" text-anchor="middle" font-family="Arial, sans-serif" font-size="46" font-weight="800" fill="#ffffff">SAHYADRI DAIRY</text>
    <text x="130" y="270" font-family="Arial, sans-serif" font-size="34" font-weight="700" fill="#0f172a">DATE: 05-06-2026</text>
    <text x="130" y="335" font-family="Arial, sans-serif" font-size="34" font-weight="700" fill="#0f172a">CODE: MD-1024</text>
    <text x="130" y="400" font-family="Arial, sans-serif" font-size="34" font-weight="700" fill="#0f172a">SESSION: MORNING</text>
    <line x1="120" y1="455" x2="780" y2="455" stroke="#94a3b8" stroke-width="5"/>
    <text x="130" y="535" font-family="Arial, sans-serif" font-size="42" font-weight="800" fill="#0f172a">LITERS</text>
    <text x="760" y="535" text-anchor="end" font-family="Arial, sans-serif" font-size="42" font-weight="800" fill="#0f172a">14.50</text>
    <text x="130" y="620" font-family="Arial, sans-serif" font-size="42" font-weight="800" fill="#0f172a">FAT</text>
    <text x="760" y="620" text-anchor="end" font-family="Arial, sans-serif" font-size="42" font-weight="800" fill="#0f172a">4.2</text>
    <text x="130" y="705" font-family="Arial, sans-serif" font-size="42" font-weight="800" fill="#0f172a">SNF</text>
    <text x="760" y="705" text-anchor="end" font-family="Arial, sans-serif" font-size="42" font-weight="800" fill="#0f172a">8.7</text>
    <text x="130" y="790" font-family="Arial, sans-serif" font-size="42" font-weight="800" fill="#0f172a">RATE</text>
    <text x="760" y="790" text-anchor="end" font-family="Arial, sans-serif" font-size="42" font-weight="800" fill="#0f172a">38.50</text>
    <line x1="120" y1="845" x2="780" y2="845" stroke="#94a3b8" stroke-width="5"/>
    <text x="130" y="930" font-family="Arial, sans-serif" font-size="48" font-weight="900" fill="#14532d">AMOUNT</text>
    <text x="760" y="930" text-anchor="end" font-family="Arial, sans-serif" font-size="48" font-weight="900" fill="#14532d">558.25</text>
    <text x="450" y="1045" text-anchor="middle" font-family="Arial, sans-serif" font-size="30" font-weight="700" fill="#64748b">Demo slip for Playwright manual video</text>
  </svg>`;

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fulfillJson(route, body, status = 200) {
  await route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body)
  });
}

async function assertServerReady() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(BASE_URL, { signal: controller.signal });
    if (!response.ok && response.status >= 500) {
      throw new Error(`App returned HTTP ${response.status}`);
    }
  } catch (error) {
    throw new Error(
      `App is not reachable at ${BASE_URL}. Start it first with \`npm run dev\`, or pass MANUAL_BASE_URL. (${error.message})`
    );
  } finally {
    clearTimeout(timeout);
  }
}


async function waitForVisible(page, selector, label, timeout = 15000) {
  try {
    await page.waitForSelector(selector, { timeout });
  } catch (error) {
    const debugPng = path.join(OUTPUT_DIR, `debug-${label}.png`);
    const debugHtml = path.join(OUTPUT_DIR, `debug-${label}.html`);
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    await page.screenshot({ path: debugPng, fullPage: true }).catch(() => {});
    fs.writeFileSync(debugHtml, await page.content().catch(() => ""));
    const bodyText = await page.locator("body").innerText({ timeout: 1000 }).catch(() => "");
    console.error(`Debug ${label}: url=${page.url()}`);
    console.error(bodyText.slice(0, 1200));
    console.error(`Saved debug screenshot: ${debugPng}`);
    console.error(`Saved debug html: ${debugHtml}`);
    throw error;
  }
}

async function installDemoRoutes(page) {
  await page.route("**/api/auth/verify**", (route) => fulfillJson(route, { valid: true, user: demoUser, farm: demoFarm }));
  await page.route("**/api/farms/current", (route) => fulfillJson(route, { data: demoFarm }));
  await page.route("**/api/settings/appearance", (route) => fulfillJson(route, { data: {} }));
  await page.route("**/api/settings/ai", (route) => fulfillJson(route, { data: { enabled: false } }));
  await page.route("**/api/notifications**", (route) => fulfillJson(route, []));
  await page.route("**/api/reminders**", (route) => fulfillJson(route, []));
  await page.route("**/api/cows**", (route) => fulfillJson(route, []));

  await page.route("**/api/accounting/slip-scan/upload**", async (route) => {
    if (route.request().method() === "GET") {
      return fulfillJson(route, { data: [demoUpload] });
    }

    await wait(900);
    return fulfillJson(route, {
      data: {
        success: true,
        uploadId: UPLOAD_ID,
        imageUrl: demoUpload.compressed_image_url,
        imageSize: demoUpload.compressed_size,
        compressionRatio: demoUpload.compression_ratio,
        skippedCompression: false,
        upload: demoUpload,
        message: "फोटो अपलोड झाला. AI वाचत आहे..."
      }
    });
  });

  await page.route("**/api/accounting/slip-scan/extract", async (route) => {
    await wait(5200);
    return fulfillJson(route, {
      data: {
        success: true,
        uploadId: UPLOAD_ID,
        imageUrl: demoUpload.compressed_image_url,
        upload: { ...demoUpload, ai_raw_response: extractedData },
        extractedData,
        confidence_score: 0.96,
        model_used: "gpt-4.1-mini",
        retried: false,
        tokensUsed: 812,
        cost_estimate: 0.004,
        status: "success",
        has_gaps: false,
        gaps_detected: 0,
        gaps_filled: []
      }
    });
  });

  await page.route("**/api/accounting/slip-scan/save", async (route) => {
    await wait(1600);
    return fulfillJson(route, {
      data: {
        message: "Demo स्लिप जतन झाली.",
        slip_type: "daily",
        linked_milk_record_id: "demo-milk-record",
        linked_dairy_slip_id: "demo-dairy-slip"
      }
    });
  });
}

async function installSession(page) {
  await page.addInitScript(({ user, farm }) => {
    const token = "manual-demo-token";
    localStorage.setItem("goshala_token", token);
    localStorage.setItem("goshala_user", JSON.stringify(user));
    localStorage.setItem("goshala_farm", JSON.stringify(farm));
    localStorage.setItem("goshala_auth_verified_at", String(Date.now()));
    localStorage.setItem("majhi_dairy_appearance", JSON.stringify({ reduce_animations: false, large_touch_targets: true }));
    document.cookie = `goshala_token=${encodeURIComponent(token)}; Path=/; SameSite=Lax`;
  }, { user: demoUser, farm: demoFarm });
}

async function addCaption(page, text) {
  await page.evaluate((captionText) => {
    let caption = document.querySelector("[data-manual-caption]");
    if (!caption) {
      caption = document.createElement("div");
      caption.dataset.manualCaption = "true";
      caption.style.position = "fixed";
      caption.style.left = "50%";
      caption.style.bottom = "108px";
      caption.style.transform = "translateX(-50%)";
      caption.style.zIndex = "120";
      caption.style.maxWidth = "min(680px, calc(100vw - 28px))";
      caption.style.padding = "14px 18px";
      caption.style.borderRadius = "18px";
      caption.style.background = "rgba(15, 23, 42, 0.92)";
      caption.style.color = "white";
      caption.style.boxShadow = "0 18px 44px rgba(15, 23, 42, 0.28)";
      caption.style.fontSize = "20px";
      caption.style.fontWeight = "900";
      caption.style.lineHeight = "1.25";
      caption.style.textAlign = "center";
      document.body.appendChild(caption);
    }
    caption.textContent = captionText;
  }, text);
}

async function removeCaption(page) {
  await page.evaluate(() => document.querySelector("[data-manual-caption]")?.remove());
}

async function highlight(page, selector, text) {
  const locator = page.locator(selector).first();
  await locator.scrollIntoViewIfNeeded();
  await locator.evaluate((node) => {
    node.style.outline = "5px solid rgba(14, 165, 233, 0.95)";
    node.style.outlineOffset = "4px";
    node.style.boxShadow = "0 0 0 10px rgba(14, 165, 233, 0.16)";
    window.setTimeout(() => {
      node.style.outline = "";
      node.style.outlineOffset = "";
      node.style.boxShadow = "";
    }, 1600);
  });
  await addCaption(page, text);
  await wait(1500);
}

async function createDemoSlipFile() {
  const svg = Buffer.from(imageDataUrl().replace(/^data:image\/svg\+xml;base64,/, ""), "base64");
  return {
    name: "demo-dairy-slip.svg",
    mimeType: "image/svg+xml",
    buffer: svg
  };
}

async function main() {
  await assertServerReady();
  fs.mkdirSync(TEMP_VIDEO_DIR, { recursive: true });
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    deviceScaleFactor: 2,
    recordVideo: {
      dir: TEMP_VIDEO_DIR,
      size: { width: 390, height: 844 }
    }
  });

  await context.addCookies([{ name: "goshala_token", value: SESSION_TOKEN, url: BASE_URL, sameSite: "Lax" }]);
  await installSession(context);

  const page = await context.newPage();
  page.setDefaultTimeout(45000);
  await installDemoRoutes(page);

  await page.goto(`${BASE_URL}/accounting/slip-scan`, { waitUntil: "domcontentloaded" });
  await waitForVisible(page, 'a[href="/accounting/slip-scan/upload"]', "hub");
  console.log(`Opened manual flow at ${page.url()}`);
  await addCaption(page, "AI स्लिप स्कॅन मध्ये दूध किंवा देयक स्लिप फोटोवरून वाचता येते.");
  await wait(1800);

  await highlight(page, 'a[href="/accounting/slip-scan/upload"]', "गॅलरी मधून तयार फोटो निवडा.");
  await page.locator('a[href="/accounting/slip-scan/upload"]').click();
  await waitForVisible(page, "text=स्लिप फोटो निवडा", "upload-page");
  await addCaption(page, "स्पष्ट फोटो निवडल्यावर app तो हलका करून AI वाचनासाठी पाठवते.");
  await wait(1200);

  const chooserPromise = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: /फोटो निवडा|स्लिप फोटो निवडा/ }).last().click();
  const chooser = await chooserPromise;
  await chooser.setFiles([await createDemoSlipFile()]);

  await waitForVisible(page, ".ai-slip-loader", "loader", 20000);
  await addCaption(page, "नवीन loader मध्ये upload, OCR आणि हिशोब validation status live दिसतो.");
  await wait(5200);

  await waitForVisible(page, "text=AI ने वाचलेली माहिती", "review", 60000);
  await addCaption(page, "AI ने वाचलेले आकडे जतन करण्यापूर्वी editable form मध्ये तपासा.");
  await wait(1600);

  await highlight(page, "text=AI विश्वास", "AI विश्वास आणि स्थिती वरच्या summary मध्ये दिसते.");
  await waitForVisible(page, "text=दूध लिटर", "daily-fields", 30000);
  const litersInput = page.locator('xpath=//span[contains(normalize-space(.), "दूध लिटर")]/following::input[1]');
  await highlight(page, 'xpath=//span[contains(normalize-space(.), "दूध लिटर")]/following::input[1]', "लिटर, फॅट, SNF, दर आणि रक्कम स्वतः जुळवा.");

  await litersInput.fill("14.75");
  await addCaption(page, "चूक दिसल्यास field edit करा. हिशोबाने रक्कम लगेच update होते.");
  await wait(1400);

  await page.locator("text=✅ तपासले, जतन करा").scrollIntoViewIfNeeded();
  await addCaption(page, "सगळे आकडे तपासल्यानंतरच जतन करा.");
  await wait(1000);
  await page.locator("text=✅ तपासले, जतन करा").click();

  await waitForVisible(page, "text=जतन प्रक्रिया चालू आहे", "save-progress", 30000);
  await addCaption(page, "Save progress records आणि reports update होईपर्यंत दाखवतो.");
  await wait(2600);
  await removeCaption(page);
  await wait(600);

  const video = page.video();
  await context.close();
  await browser.close();

  if (!video) {
    throw new Error("Playwright did not create a video artifact.");
  }

  const tempPath = await video.path();
  fs.copyFileSync(tempPath, FINAL_VIDEO);
  console.log(`Manual video recorded: ${FINAL_VIDEO}`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
