const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");

const base = path.join(process.cwd(), "docs/project/phase14");
const catalog = JSON.parse(fs.readFileSync(path.join(base, "phase14_delivery_catalog.json"), "utf8"));

function clean(value) {
  return String(value ?? "").replace(/<br>/g, "; ").trim();
}

function sheet(rows, headers) {
  const aoa = [headers];
  for (const row of rows) aoa.push(headers.map((h) => row[h] ?? ""));
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws["!cols"] = headers.map((_, col) => ({
    wch: Math.min(95, Math.max(12, ...aoa.slice(0, 500).map((row) => clean(row[col]).length))),
  }));
  return ws;
}

function aoa(rows) {
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws["!cols"] = rows[0].map((_, col) => ({
    wch: Math.min(80, Math.max(12, ...rows.map((row) => clean(row[col]).length))),
  }));
  return ws;
}

function write(file, sheets) {
  const wb = XLSX.utils.book_new();
  for (const [name, ws] of Object.entries(sheets)) {
    XLSX.utils.book_append_sheet(wb, ws, name.slice(0, 31));
  }
  XLSX.writeFile(wb, path.join(base, file), { compression: true });
}

write("Epic_Backlog.xlsx", {
  Epics: sheet(catalog.epics, [
    "epicId",
    "epicName",
    "businessObjective",
    "technicalObjective",
    "dependencies",
    "acceptanceCriteria",
    "riskLevel",
    "estimatedEffortPoints",
    "targetSprint",
    "status",
  ]),
  "Feature Breakdown": sheet(catalog.features, [
    "featureId",
    "epicId",
    "epicName",
    "feature",
    "subFeatures",
    "technicalTasks",
    "backendTasks",
    "frontendTasks",
    "databaseTasks",
    "qaTasks",
    "devOpsTasks",
  ]),
});

write("User_Story_Backlog.xlsx", {
  Stories: sheet(catalog.stories, [
    "storyId",
    "epicId",
    "featureId",
    "title",
    "description",
    "acceptanceCriteria",
    "priority",
    "dependencies",
    "storyPoints",
    "estimatedHours",
    "targetSprint",
    "status",
  ]),
  "Effort Summary": aoa([
    ["Epic ID", "Story Count", "Story Points", "Estimated Hours"],
    ...catalog.epics.map((epic) => {
      const rows = catalog.stories.filter((s) => s.epicId === epic.epicId);
      return [
        epic.epicId,
        rows.length,
        rows.reduce((sum, s) => sum + Number(s.storyPoints || 0), 0),
        rows.reduce((sum, s) => sum + Number(s.estimatedHours || 0), 0),
      ];
    }),
  ]),
});

write("Sprint_Planning.xlsx", {
  Sprints: sheet(catalog.sprints, [
    "sprint",
    "length",
    "theme",
    "objectives",
    "epics",
    "storyIds",
    "storyCount",
    "storyPoints",
    "deliverables",
    "dependencies",
    "risks",
    "definitionOfDone",
  ]),
  "Sprint Story Map": sheet(catalog.stories, [
    "storyId",
    "epicId",
    "featureId",
    "title",
    "priority",
    "storyPoints",
    "estimatedHours",
    "targetSprint",
    "status",
  ]),
});

write("Resource_Plan.xlsx", {
  "Team Options": sheet(catalog.resources, ["option", "roles", "capacity", "velocity", "responsibilities", "risks"]),
  "Capacity Plan": sheet(catalog.capacity, ["sprint", "theme", "skill", "allocationWeight", "notes"]),
  "Skill Requirements": aoa([
    ["Skill", "Requirement"],
    ["Frontend", "React, Next.js App Router, Tailwind, PWA/mobile UX"],
    ["Backend", "Next.js API routes, Supabase service design, validation"],
    ["Database", "PostgreSQL, RLS, migrations, indexes, data integrity"],
    ["AI/OCR", "OpenAI tool-calling, OCR workflows, validation gates"],
    ["QA", "Functional, API, DB, security, localization, UAT automation"],
    ["DevOps", "CI/CD, environments, secrets, monitoring, rollback"],
  ]),
});

write("Risk_Register.xlsx", {
  Risks: sheet(catalog.risks, ["riskId", "risk", "category", "probability", "impact", "mitigation", "owner", "status"]),
  Matrix: aoa([
    ["Probability", "Impact", "Action"],
    ["High", "Critical", "Immediate mitigation and leadership review"],
    ["Medium", "Critical", "Dedicated owner and sprint-level mitigation"],
    ["Medium", "High", "Track weekly with evidence"],
    ["Low", "High", "Monitor and verify controls"],
  ]),
});

write("Release_Calendar.xlsx", {
  Releases: sheet(catalog.releases, ["releaseId", "releaseType", "targetWindow", "scope", "entryCriteria", "exitCriteria"]),
  "Release Types": aoa([
    ["Type", "Definition"],
    ["Major Release", "Broad feature release after sprint/release gate"],
    ["Minor Release", "Small feature or enhancement release"],
    ["Patch Release", "Low-risk bug fix release"],
    ["Hotfix", "Urgent fix for production issue with shortened approval path"],
  ]),
});

write("Delivery_Dashboard.xlsx", {
  "Roadmap Dashboard": sheet(catalog.dashboard.roadmapDashboard, ["metric", "value"]),
  "Sprint Dashboard": sheet(catalog.dashboard.sprintDashboard, ["sprint", "theme", "storyCount", "storyPoints"]),
  "Release Dashboard": sheet(catalog.dashboard.releaseDashboard, ["releaseId", "releaseType", "targetWindow", "scope", "entryCriteria", "exitCriteria"]),
  "Risk Dashboard": sheet(catalog.dashboard.riskDashboard, ["riskId", "risk", "category", "probability", "impact", "mitigation", "owner", "status"]),
  "Resource Dashboard": sheet(catalog.dashboard.resourceDashboard, ["option", "roles", "capacity", "velocity", "responsibilities", "risks"]),
});

for (const file of [
  "Epic_Backlog.xlsx",
  "User_Story_Backlog.xlsx",
  "Sprint_Planning.xlsx",
  "Resource_Plan.xlsx",
  "Risk_Register.xlsx",
  "Release_Calendar.xlsx",
  "Delivery_Dashboard.xlsx",
]) {
  console.log(file, fs.statSync(path.join(base, file)).size);
}
