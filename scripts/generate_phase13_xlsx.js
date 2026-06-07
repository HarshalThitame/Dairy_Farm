const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");

const base = path.join(process.cwd(), "docs/uat/phase13");
const catalog = JSON.parse(fs.readFileSync(path.join(base, "phase13_uat_catalog.json"), "utf8"));

function clean(value) {
  return String(value ?? "").replace(/<br>/g, "; ").trim();
}

function sheet(rows, headers) {
  const aoa = [headers];
  for (const row of rows) aoa.push(headers.map((h) => row[h] ?? ""));
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws["!cols"] = headers.map((_, col) => ({
    wch: Math.min(90, Math.max(12, ...aoa.slice(0, 500).map((row) => clean(row[col]).length))),
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

write("UAT_Test_Cases.xlsx", {
  "Business UAT": sheet(catalog.uatCases, [
    "uatId",
    "scenario",
    "requirementIds",
    "actor",
    "objective",
    "preconditions",
    "steps",
    "expectedResult",
    "businessValidationCriteria",
    "priority",
    "passFailStatus",
    "evidence",
  ]),
  "E2E Flows": sheet(catalog.e2eFlows, [
    "flowId",
    "journey",
    "actors",
    "flow",
    "expectedOutcome",
    "acceptanceCriteria",
  ]),
  "Multilingual UAT": sheet(catalog.multilingualUat, [
    "uatId",
    "language",
    "area",
    "objective",
    "steps",
    "expectedResult",
    "acceptanceCriteria",
    "status",
  ]),
  "OCR UAT": sheet(catalog.ocrUat, [
    "uatId",
    "slipType",
    "validationArea",
    "objective",
    "steps",
    "expectedResult",
    "businessAcceptanceCriteria",
    "status",
  ]),
  "AI UAT": sheet(catalog.aiUat, [
    "uatId",
    "question",
    "validationArea",
    "objective",
    "steps",
    "expectedResult",
    "acceptanceCriteria",
    "status",
  ]),
  "Financial UAT": sheet(catalog.financialUat, [
    "uatId",
    "financialFlow",
    "validationArea",
    "objective",
    "steps",
    "expectedResult",
    "businessAcceptanceCriteria",
    "status",
  ]),
});

write("UAT_Traceability_Matrix.xlsx", {
  Traceability: sheet(catalog.traceability, [
    "businessRequirement",
    "functionalRequirementIds",
    "uatId",
    "scenario",
    "actor",
    "coverageType",
    "coverageStatus",
    "approvalOwner",
  ]),
  Summary: aoa([
    ["Metric", "Value"],
    ["Business UAT cases", catalog.uatCases.length],
    ["E2E flows", catalog.e2eFlows.length],
    ["Multilingual scripts", catalog.multilingualUat.length],
    ["OCR scripts", catalog.ocrUat.length],
    ["AI scripts", catalog.aiUat.length],
    ["Financial scripts", catalog.financialUat.length],
    ["Traceability rows", catalog.traceability.length],
  ]),
});

write("Pilot_Rollout_Plan.xlsx", {
  "Pilot Plan": sheet(catalog.pilotPlan, [
    "pilotSize",
    "phase",
    "objective",
    "farmSelectionCriteria",
    "activities",
    "successMetrics",
    "owner",
    "status",
  ]),
  "Pilot Metrics": aoa([
    ["Metric", "Target"],
    ["Pilot activation", ">= 80% farms complete core onboarding"],
    ["UAT pass rate", ">= 95%"],
    ["Critical defects", "0"],
    ["OCR accuracy", ">= 90% on clear slips"],
    ["AI satisfaction", ">= 80%"],
    ["System availability", ">= 99.5%"],
    ["Support first response", "< 1 business day during pilot"],
  ]),
});

write("Go_Live_Readiness_Checklist.xlsx", {
  Checklist: sheet(catalog.readinessChecklist, ["checklistId", "category", "item", "owner", "status", "evidence"]),
  "Go No-Go": aoa([
    ["Decision", "Condition"],
    ["Go", "All mandatory readiness gates passed; no open Critical/High defects"],
    ["Conditional Go", "Only accepted Medium/Low issues remain with owners and dates"],
    ["No-Go", "Any unresolved Critical, security, data integrity, rollback or High defect blocker"],
  ]),
});

write("Training_Plan.xlsx", {
  "Training Plan": sheet(catalog.trainingPlan, [
    "audience",
    "topics",
    "method",
    "duration",
    "materials",
    "completionCriteria",
    "owner",
    "status",
  ]),
  "Adoption Plan": aoa([
    ["Period", "Focus"],
    ["Week 1", "Hands-on onboarding, daily check-ins, slip scanning support"],
    ["Week 2-4", "Reports/accounting training, reminder discipline, support feedback"],
    ["30 Days", "Usage review, defect review, training refresh"],
    ["60 Days", "Pilot expansion and advanced features"],
    ["90 Days", "Production expansion readiness"],
  ]),
});

for (const file of [
  "UAT_Test_Cases.xlsx",
  "UAT_Traceability_Matrix.xlsx",
  "Pilot_Rollout_Plan.xlsx",
  "Go_Live_Readiness_Checklist.xlsx",
  "Training_Plan.xlsx",
]) {
  console.log(file, fs.statSync(path.join(base, file)).size);
}
