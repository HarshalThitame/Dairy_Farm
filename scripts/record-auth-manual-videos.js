#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const ROOT_DIR = path.resolve(__dirname, "..");
const BASE_URL = process.env.MANUAL_BASE_URL || "http://localhost:3000";
const OUTPUT_DIR = path.resolve(ROOT_DIR, process.env.MANUAL_VIDEO_DIR || "manual-videos");
const TEMP_DIR = path.join(OUTPUT_DIR, ".tmp-auth-manual");
const SLOW = Number(process.env.MANUAL_STEP_DELAY_MS || 2300);
const TYPE_DELAY = Number(process.env.MANUAL_TYPE_DELAY_MS || 115);
const SESSION_TOKEN = "manual-auth-demo-token";

const demoUser = {
  id: "manual-auth-user",
  name: "राहुल पाटील",
  role: "admin",
  isFarmOwner: true
};

const demoFarm = {
  id: "manual-auth-farm",
  name: "सावरगाव तळ दूध डेअरी",
  farmName: "सावरगाव तळ दूध डेअरी",
  farm_name: "सावरगाव तळ दूध डेअरी",
  ownerName: "राहुल पाटील",
  districtName: "अहिल्यानगर",
  talukaName: "संगमनेर",
  villageName: "सावरगांव तळ"
};

const narration = {
  signup: [
    "नवीन डेअरी नोंदणी करण्यासाठी, सर्वप्रथम मोबाइल नंबर टाका.",
    "मोबाइल नंबर उपलब्ध असल्यास पुढच्या टप्प्यात डेअरीची माहिती भरा.",
    "जिल्हा अहिल्यानगर निवडा. त्यानंतर तालुका संगमनेर आणि गाव सावरगाव तळ निवडा.",
    "डेअरीचे नाव, मालकाचे नाव आणि गायींची संख्या तपासा.",
    "शेवटी सुरक्षित चार अंकी पिन तयार करा.",
    "नोंदणी पूर्ण झाल्यानंतर तुमचे खाते तयार होते."
  ],
  login: [
    "लॉगिन करण्यासाठी नोंदणीकृत मोबाइल नंबर टाका.",
    "यानंतर चार अंकी पिन टाका.",
    "खाते उघडा बटण दाबल्यावर app तुमचे खाते तपासते.",
    "लॉगिन यशस्वी झाल्यावर मुख्यपृष्ठ उघडते."
  ]
};

function wait(ms = SLOW) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
      `App is not reachable at ${BASE_URL}. Start it with \`npm run dev\`, or pass MANUAL_BASE_URL. (${error.message})`
    );
  } finally {
    clearTimeout(timeout);
  }
}

async function fulfillJson(route, body, status = 200) {
  await route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body)
  });
}

function dashboardSnapshot() {
  return {
    cowsSummary: { total: 12, pregnant: 3 },
    todayMilk: {
      records: [
        {
          id: "demo-milk",
          date: "2026-06-06",
          morning_litres: 48,
          evening_litres: 42,
          total_litres: 90
        }
      ]
    },
    reminders: {
      today: [],
      overdue: [],
      upcoming: [],
      todayCount: 0,
      overdueCount: 0,
      upcomingCount: 0
    },
    calvesSummary: { total: 2, active: 2 },
    monthlyMilkReport: {
      totalMilk: 2450,
      averageDailyMilk: 81.6,
      daysWithMilk: 30
    },
    monthlyFinanceReport: {
      totalIncome: 96500,
      totalExpense: 28600,
      netProfit: 67900
    },
    settlementSlipStatus: { pendingCount: 0 },
    dailyGoal: { target_liters: 100 },
    todayIncome: 3465
  };
}

async function installRoutes(page) {
  await page.route("**/api/auth/check-mobile", async (route) => {
    await wait(700);
    return fulfillJson(route, { available: true });
  });

  await page.route("**/api/auth/signup", async (route) => {
    await wait(1400);
    return fulfillJson(route, {
      token: SESSION_TOKEN,
      user: demoUser,
      farm: demoFarm
    });
  });

  await page.route("**/api/auth/login", async (route) => {
    await wait(1100);
    return fulfillJson(route, {
      token: SESSION_TOKEN,
      user: demoUser,
      farm: demoFarm
    });
  });

  await page.route("**/api/auth/verify**", (route) =>
    fulfillJson(route, { valid: true, user: demoUser, farm: demoFarm })
  );
  await page.route("**/api/farms/current", (route) => fulfillJson(route, { data: demoFarm }));
  await page.route("**/api/dashboard**", (route) => fulfillJson(route, { data: dashboardSnapshot() }));
  await page.route("**/api/settings/appearance", (route) => fulfillJson(route, { data: {} }));
  await page.route("**/api/settings/ai", (route) => fulfillJson(route, { data: { enabled: false } }));
  await page.route("**/api/notifications**", (route) => fulfillJson(route, []));
  await page.route("**/api/reminders**", (route) => fulfillJson(route, []));
  await page.route("**/api/cows**", (route) => fulfillJson(route, []));
  await page.route("**/api/milk**", (route) => fulfillJson(route, { data: [] }));
}

async function clearSession(page) {
  await page.addInitScript(() => {
    localStorage.clear();
    document.cookie = "goshala_token=; Max-Age=0; Path=/; SameSite=Lax";
  });
}

async function addCaption(page, text) {
  await page.evaluate((captionText) => {
    let caption = document.querySelector("[data-manual-caption]");
    if (!caption) {
      caption = document.createElement("div");
      caption.dataset.manualCaption = "true";
      caption.style.position = "fixed";
      caption.style.left = "50%";
      caption.style.bottom = "98px";
      caption.style.transform = "translateX(-50%)";
      caption.style.zIndex = "120";
      caption.style.width = "calc(100vw - 28px)";
      caption.style.maxWidth = "680px";
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

async function highlight(page, selector, caption, delay = SLOW) {
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
    }, 1900);
  });
  await addCaption(page, caption);
  await wait(delay);
}

function inputAfter(label) {
  return `xpath=//span[contains(normalize-space(.), "${label}")]/following::input[1]`;
}

function selectAfter(label) {
  return `xpath=//span[contains(normalize-space(.), "${label}")]/following::select[1]`;
}

async function fillSlow(locator, value) {
  await locator.fill("");
  await locator.type(value, { delay: TYPE_DELAY });
}

async function fillPinBoxes(page, digits, startIndex = 0) {
  const boxes = page.locator('input[type="password"], input[type="text"][inputmode="numeric"]');
  for (let i = 0; i < digits.length; i += 1) {
    await boxes.nth(startIndex + i).fill(digits[i]);
    await wait(240);
  }
}

async function makeContext(browser, videoName) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
  return browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    deviceScaleFactor: 2,
    recordVideo: {
      dir: TEMP_DIR,
      size: { width: 390, height: 844 }
    }
  });
}

async function saveVideo(page, context, finalPath) {
  const video = page.video();
  await context.close();

  if (!video) {
    throw new Error("Playwright did not create a video artifact.");
  }

  const tempPath = await video.path();
  fs.copyFileSync(tempPath, finalPath);
  return finalPath;
}

async function recordSignup(browser) {
  const context = await makeContext(browser, "signup");
  const page = await context.newPage();
  page.setDefaultTimeout(60000);
  await clearSession(page);
  await installRoutes(page);

  await page.goto(`${BASE_URL}/signup`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("text=नवीन डेअरी नोंदणी");
  await addCaption(page, "नवीन डेअरी नोंदणी सुरू करा.");
  await wait();

  await highlight(page, inputAfter("मोबाइल नंबर"), "पहिल्या टप्प्यात १० अंकी मोबाइल नंबर टाका.");
  await fillSlow(page.locator(inputAfter("मोबाइल नंबर")), "9876543210");
  await wait(900);
  await page.getByRole("button", { name: /पुढे/ }).click();

  await page.waitForSelector("text=डेअरी माहिती");
  await addCaption(page, "आता डेअरी आणि मालकाची माहिती भरा.");
  await wait();

  await fillSlow(page.locator(inputAfter("डेअरीचे नाव")), "Sawrgaon Tal Dudh Dairy");
  await wait(700);
  await fillSlow(page.locator(inputAfter("मालकाचे नाव")), "Rahul Patil");
  await wait(700);

  await highlight(page, selectAfter("जिल्ह्याचे नाव"), "जिल्हा म्हणून अहिल्यानगर निवडा.");
  await page.locator(selectAfter("जिल्ह्याचे नाव")).selectOption("अहिल्यानगर");
  await wait();

  await highlight(page, selectAfter("तालुक्याचे नाव"), "तालुका संगमनेर निवडा.");
  await page.locator(selectAfter("तालुक्याचे नाव")).selectOption("संगमनेर");
  await wait();

  await highlight(page, selectAfter("गावाचे नाव"), "गाव म्हणून सावरगाव तळ निवडा.");
  await page.locator(selectAfter("गावाचे नाव")).selectOption("सावरगांव तळ");
  await wait();

  await fillSlow(page.locator(inputAfter("एकूण गायी")), "12");
  await addCaption(page, "गायींची संख्या भरून पुढे जा.");
  await wait();
  await page.getByRole("button", { name: /पुढे/ }).last().click();

  await page.waitForSelector("text=PIN तयार करा");
  await addCaption(page, "आता सुरक्षित चार अंकी PIN तयार करा.");
  await wait();
  await fillPinBoxes(page, "2580", 0);
  await fillPinBoxes(page, "2580", 4);
  await wait();
  await highlight(page, 'button:has-text("नोंदणी पूर्ण करा")', "दोन्ही PIN तपासून नोंदणी पूर्ण करा.");
  await page.getByRole("button", { name: /नोंदणी पूर्ण करा/ }).click();

  await page.waitForSelector("text=नोंदणी यशस्वी", { timeout: 60000 });
  await addCaption(page, "नोंदणी पूर्ण झाली. आता हेच खाते लॉगिनसाठी वापरता येईल.");
  await wait(3200);

  return saveVideo(page, context, path.join(OUTPUT_DIR, "signup-ahilyanagar-sangamner-sawrgaon-tal.webm"));
}

async function recordLogin(browser) {
  const context = await makeContext(browser, "login");
  const page = await context.newPage();
  page.setDefaultTimeout(60000);
  await clearSession(page);
  await installRoutes(page);

  await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("text=मोबाइल नंबर आणि PIN टाका");
  await addCaption(page, "लॉगिन पानावर नोंदणीकृत मोबाइल नंबर आणि PIN टाका.");
  await wait();

  await highlight(page, inputAfter("मोबाइल नंबर"), "नोंदणीमध्ये वापरलेला मोबाइल नंबर टाका.");
  await fillSlow(page.locator(inputAfter("मोबाइल नंबर")), "9876543210");
  await wait();

  await highlight(page, "text=४ अंकी PIN", "आता चार अंकी PIN टाका.");
  const loginPinBoxes = page.locator('input[type="password"]');
  await loginPinBoxes.nth(0).fill("2");
  await wait(300);
  await loginPinBoxes.nth(1).fill("5");
  await wait(300);
  await loginPinBoxes.nth(2).fill("8");
  await addCaption(page, "शेवटचा अंक भरल्यावर app आपोआप खाते तपासते.");
  await wait();
  await loginPinBoxes.nth(3).fill("0");
  await addCaption(page, "App खाते तपासते आणि मग मुख्यपृष्ठ उघडते.");
  await wait(3600);

  await page.waitForSelector("text=मुख्यपृष्ठ", { timeout: 60000 });
  await addCaption(page, "लॉगिन यशस्वी. आता तुम्ही डेअरी व्यवस्थापन सुरू करू शकता.");
  await wait(3200);

  return saveVideo(page, context, path.join(OUTPUT_DIR, "login-user-manual.webm"));
}

function writeNarrationFiles() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(OUTPUT_DIR, "signup-ahilyanagar-sangamner-sawrgaon-tal.narration.mr.txt"),
    narration.signup.join("\n")
  );
  fs.writeFileSync(
    path.join(OUTPUT_DIR, "login-user-manual.narration.mr.txt"),
    narration.login.join("\n")
  );
}

async function main() {
  await assertServerReady();
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  writeNarrationFiles();

  const browser = await chromium.launch({ headless: true });

  try {
    const signupVideo = await recordSignup(browser);
    console.log(`Signup manual video recorded: ${signupVideo}`);
    const loginVideo = await recordLogin(browser);
    console.log(`Login manual video recorded: ${loginVideo}`);
    console.log("Marathi narration text files were written next to the videos.");
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
