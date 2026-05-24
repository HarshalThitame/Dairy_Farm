/* eslint-disable no-console */
const { createClient } = require("@supabase/supabase-js");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { randomUUID } = require("crypto");
const fs = require("fs");
const path = require("path");

function loadLocalEnv() {
  const envPath = path.join(process.cwd(), ".env.local");

  if (!fs.existsSync(envPath)) {
    return;
  }

  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);

  lines.forEach((line) => {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      return;
    }

    const equalsIndex = trimmed.indexOf("=");

    if (equalsIndex === -1) {
      return;
    }

    const key = trimmed.slice(0, equalsIndex).trim();
    const value = trimmed.slice(equalsIndex + 1).trim().replace(/^['"]|['"]$/g, "");

    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  });
}

loadLocalEnv();

if (typeof global.WebSocket === "undefined") {
  global.WebSocket = class WebSocketStub {};
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const jwtSecret = process.env.JWT_SECRET;
const baseUrl = process.env.TEST_BASE_URL || "http://localhost:3000";

if (!supabaseUrl || !serviceRoleKey || !jwtSecret) {
  console.error("NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY आणि JWT_SECRET आवश्यक आहेत.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    detectSessionInUrl: false,
    persistSession: false
  }
});

function makeToken(user, farm) {
  return jwt.sign(
    {
      userId: user.id,
      farmId: farm.id,
      mobile: user.mobile,
      email: user.email,
      name: user.name,
      role: user.role,
      isFarmOwner: true,
      farmName: farm.farm_name
    },
    jwtSecret,
    { expiresIn: "1h" }
  );
}

async function apiGet(path, token) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const body = await response.json().catch(() => ({}));
  return { status: response.status, ok: response.ok, body };
}

async function insertFarm(label, index) {
  const timestamp = Date.now();
  const { data: farm, error: farmError } = await supabase
    .from("farms")
    .insert({
      farm_name: `चाचणी गोशाळा ${label}`,
      owner_name: `मालक ${label}`,
      owner_mobile: `88${String(timestamp).slice(-8)}${index}`.slice(0, 10),
      owner_email: `tenant-${label.toLowerCase()}-${timestamp}@example.com`,
      district_name: "पुणे",
      is_active: true
    })
    .select()
    .single();

  if (farmError) {
    throw farmError;
  }

  const pinHash = await bcrypt.hash("1234", 10);
  const { data: user, error: userError } = await supabase
    .from("users")
    .insert({
      farm_id: farm.id,
      mobile: farm.owner_mobile,
      email: farm.owner_email,
      name: `मालक ${label}`,
      role: "admin",
      pin_hash: pinHash,
      is_farm_owner: true,
      is_active: true
    })
    .select()
    .single();

  if (userError) {
    throw userError;
  }

  const cows = Array.from({ length: 5 }, (_, cowIndex) => ({
    id: randomUUID(),
    farm_id: farm.id,
    name: `चाचणी ${label} ${cowIndex + 1}`,
    breed: "देशी",
    status: "रिकामी",
    is_active: true
  }));

  const { error: cowsError } = await supabase.from("cows").insert(cows);

  if (cowsError) {
    throw cowsError;
  }

  return { farm, user, cows, token: makeToken(user, farm) };
}

async function cleanup(farms) {
  await Promise.all(
    farms
      .filter(Boolean)
      .map((farm) => supabase.from("farms").delete().eq("id", farm.id))
  );
}

async function main() {
  let farmA;
  let farmB;

  try {
    const tenantA = await insertFarm("A", 1);
    const tenantB = await insertFarm("B", 2);
    farmA = tenantA.farm;
    farmB = tenantB.farm;

    const cowsA = await apiGet("/api/cows", tenantA.token);
    const cowsB = await apiGet("/api/cows", tenantB.token);
    const crossFarmCow = await apiGet(`/api/cows/${tenantB.cows[0].id}`, tenantA.token);

    if (!cowsA.ok || (cowsA.body.data || []).length !== 5) {
      throw new Error("Farm A ला फक्त स्वतःच्या ५ गायी दिसल्या नाहीत.");
    }

    if (!cowsB.ok || (cowsB.body.data || []).length !== 5) {
      throw new Error("Farm B ला फक्त स्वतःच्या ५ गायी दिसल्या नाहीत.");
    }

    if (![403, 404].includes(crossFarmCow.status)) {
      throw new Error("Farm A ला Farm B ची गाय पाहण्यापासून रोखले गेले नाही.");
    }

    console.log("✅ Data isolation working correctly");
  } finally {
    await cleanup([farmA, farmB]);
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
