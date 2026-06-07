const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");

const base = path.join(process.cwd(), "docs/project/phase10");
const catalog = JSON.parse(fs.readFileSync(path.join(base, "project_execution_catalog.json"), "utf8"));

function clean(v) {
  return String(v ?? "").replace(/<br>/g, "; ").trim();
}

function sheet(rows, headers) {
  const aoa = [headers];
  for (const row of rows) aoa.push(headers.map((h) => row[h] ?? ""));
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws["!cols"] = headers.map((_, c) => ({
    wch: Math.min(90, Math.max(12, ...aoa.slice(0, 300).map((r) => clean(r[c]).length))),
  }));
  return ws;
}

function write(file, sheets) {
  const wb = XLSX.utils.book_new();
  for (const [name, ws] of Object.entries(sheets)) XLSX.utils.book_append_sheet(wb, ws, name.slice(0, 31));
  XLSX.writeFile(wb, path.join(base, file), { compression: true });
}

write("Product_Roadmap.xlsx", {
  Roadmap: sheet(catalog.roadmap, ["quarter", "theme", "features", "successMetrics"]),
  "MVP MoSCoW": XLSX.utils.aoa_to_sheet([
    ["Category", "Scope"],
    ["Must Have", "Authentication, language, farm setup, cow/calf management, milk records, reminders, accounting basics, reports, settings, admin basics, security/RLS"],
    ["Should Have", "OCR slip scanning, settlement processing, notifications, AI assistant, export, profile statistics"],
    ["Could Have", "Achievements, leaderboard, support center, advanced analytics, shareable cards"],
    ["Won't Have for MVP", "WhatsApp/SMS automation, full ERP integrations, marketplace, advanced IoT integrations"],
  ]),
  KPIs: XLSX.utils.aoa_to_sheet([
    ["KPI", "Target"],
    ["North Star", "Weekly Active Farms with meaningful farm operation"],
    ["Daily active farms", "Increase month over month"],
    ["Milk records", "80% active farms record milk 5 days/week"],
    ["OCR adoption", "50% accounting users scan at least one slip/month"],
    ["AI usage", "40% active farms ask at least one AI question/month"],
    ["Retention", "60%+ 30-day retention"],
  ]),
});

write("Epic_Backlog.xlsx", {
  Epics: sheet(catalog.epics, ["epicId", "epicName", "businessValue", "priority", "dependencies", "storyCount", "estimatedPoints", "acceptanceCriteria"]),
  Summary: XLSX.utils.aoa_to_sheet([
    ["Metric", "Value"],
    ["Epic Count", catalog.epics.length],
    ["Total Stories", catalog.stories.length],
    ["Total Story Points", catalog.stories.reduce((s, x) => s + Number(x.storyPoints || 0), 0)],
  ]),
});

write("User_Story_Backlog.xlsx", {
  Stories: sheet(catalog.stories, ["storyId", "epicId", "epicName", "description", "acceptanceCriteria", "businessRules", "dependencies", "priority", "storyPoints", "release", "sprint", "status"]),
  "Effort Summary": XLSX.utils.aoa_to_sheet([
    ["Epic", "Story Count", "Story Points"],
    ...catalog.epics.map((e) => [
      e.epicName,
      catalog.stories.filter((s) => s.epicId === e.epicId).length,
      catalog.stories.filter((s) => s.epicId === e.epicId).reduce((sum, s) => sum + Number(s.storyPoints || 0), 0),
    ]),
  ]),
});

write("Sprint_Plan.xlsx", {
  Sprints: sheet(catalog.sprints, ["sprint", "length", "objectives", "epics", "storyIds", "storyCount", "storyPoints", "dependencies", "definitionOfDone"]),
  "Sprint Story Map": sheet(catalog.stories, ["storyId", "epicId", "epicName", "description", "priority", "storyPoints", "release", "sprint", "status"]),
});

write("Release_Plan.xlsx", {
  Releases: sheet(catalog.releases, ["releaseId", "theme", "featuresIncluded", "storyCount", "storyPoints", "dependencies", "risks", "acceptanceCriteria"]),
});

write("Risk_Register.xlsx", {
  Risks: sheet(catalog.risks, ["riskId", "risk", "category", "probability", "impact", "description", "mitigation", "owner", "status"]),
  Matrix: XLSX.utils.aoa_to_sheet([
    ["Probability", "Impact", "Action"],
    ["High", "Critical", "Escalate immediately and create mitigation sprint item"],
    ["Medium", "High", "Track weekly and assign owner"],
    ["Low", "High", "Monitor and validate controls"],
    ["Medium", "Medium", "Mitigate through backlog and QA"],
  ]),
});

write("Cost_Estimation.xlsx", {
  Costs: sheet(catalog.costs, ["costItem", "startupMonthly", "growthMonthly", "scaleMonthly", "assumptions"]),
  Assumptions: XLSX.utils.aoa_to_sheet([
    ["Phase", "Assumption"],
    ["Startup", "Pilot farms, low AI/OCR usage, controlled provider quotas"],
    ["Growth", "Paid users, increasing slips, more backups/reports"],
    ["Scale", "100,000+ users, provider optimization, partitioned data, stronger monitoring"],
  ]),
});

write("Go_Live_Checklist.xlsx", {
  Checklist: sheet(catalog.checklists, ["checklistId", "category", "item", "owner", "status", "evidence"]),
  "Launch Day Plan": XLSX.utils.aoa_to_sheet([
    ["Step", "Owner", "Status"],
    ["Code freeze confirmed", "PM/Tech Lead", "Pending"],
    ["Production backup completed", "DevOps", "Pending"],
    ["Deploy production build", "DevOps", "Pending"],
    ["Run smoke tests", "QA Lead", "Pending"],
    ["Monitor auth/dashboard/OCR/AI/push", "Engineering", "Pending"],
    ["Support team online", "Support Lead", "Pending"],
    ["Go/no-go review", "Stakeholders", "Pending"],
  ]),
  "Post Launch": XLSX.utils.aoa_to_sheet([
    ["Period", "Focus"],
    ["30 Days", "Stability, onboarding, high-impact bug fixes"],
    ["60 Days", "Adoption, OCR/AI improvement, training"],
    ["90 Days", "Growth, subscription conversion, scale readiness"],
  ]),
});

for (const file of [
  "Product_Roadmap.xlsx",
  "Epic_Backlog.xlsx",
  "User_Story_Backlog.xlsx",
  "Sprint_Plan.xlsx",
  "Release_Plan.xlsx",
  "Risk_Register.xlsx",
  "Cost_Estimation.xlsx",
  "Go_Live_Checklist.xlsx",
]) {
  console.log(file, fs.statSync(path.join(base, file)).size);
}
