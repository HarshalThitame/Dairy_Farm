const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");

const base = path.join(process.cwd(), "docs/qa/phase9");
const catalog = JSON.parse(fs.readFileSync(path.join(base, "qa_catalog.json"), "utf8"));

function clean(value) {
  return String(value ?? "").replace(/<br>/g, "; ").trim();
}

function sheetFromObjects(rows, headers) {
  const aoa = [headers];
  for (const row of rows) {
    aoa.push(headers.map((h) => row[h] ?? ""));
  }
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws["!cols"] = headers.map((_, col) => ({
    wch: Math.min(90, Math.max(12, ...aoa.slice(0, 300).map((r) => clean(r[col]).length))),
  }));
  return ws;
}

function writeWorkbook(filename, sheets) {
  const wb = XLSX.utils.book_new();
  for (const [name, ws] of Object.entries(sheets)) {
    XLSX.utils.book_append_sheet(wb, ws, name.slice(0, 31));
  }
  XLSX.writeFile(wb, path.join(base, filename), { compression: true });
}

const functionalHeaders = [
  "testCaseId",
  "requirementId",
  "module",
  "title",
  "description",
  "preconditions",
  "testData",
  "steps",
  "expectedResults",
  "priority",
  "severity",
  "automationCandidate",
  "status",
];

writeWorkbook("Functional_Test_Cases.xlsx", {
  "Functional Test Cases": sheetFromObjects(catalog.functionalTestCases, functionalHeaders),
  "NFR Test Cases": sheetFromObjects(catalog.nfrTestCases, functionalHeaders),
  "Language Test Cases": sheetFromObjects(catalog.languageTestCases, functionalHeaders),
  "Performance Test Cases": sheetFromObjects(catalog.performanceTestCases, functionalHeaders),
  "Database Test Cases": sheetFromObjects(catalog.databaseTestCases, functionalHeaders),
  Summary: XLSX.utils.aoa_to_sheet([
    ["Suite", "Count"],
    ["Functional", catalog.functionalTestCases.length],
    ["NFR", catalog.nfrTestCases.length],
    ["Language", catalog.languageTestCases.length],
    ["Performance", catalog.performanceTestCases.length],
    ["Database", catalog.databaseTestCases.length],
    ["Total", catalog.functionalTestCases.length + catalog.nfrTestCases.length + catalog.languageTestCases.length + catalog.performanceTestCases.length + catalog.databaseTestCases.length],
  ]),
});

writeWorkbook("UAT_Scenarios.xlsx", {
  "UAT Scenarios": sheetFromObjects(catalog.uatScenarios, [
    "uatId",
    "scenario",
    "actors",
    "description",
    "preconditions",
    "testData",
    "steps",
    "expectedOutcome",
    "businessAcceptanceCriteria",
    "relatedModules",
    "priority",
    "signOffRole",
    "status",
  ]),
});

writeWorkbook("Requirement_Traceability_Matrix.xlsx", {
  RTM: sheetFromObjects(catalog.rtm, [
    "requirementId",
    "module",
    "requirementTitle",
    "testCaseIds",
    "uatScenarioId",
    "coverageStatus",
    "coverageType",
    "sourcePhase",
  ]),
  Summary: XLSX.utils.aoa_to_sheet([
    ["Metric", "Value"],
    ["BRD Functional Requirements", catalog.counts.requirements],
    ["NFR Requirements", catalog.counts.nfrs],
    ["Total Requirements", catalog.counts.requirements + catalog.counts.nfrs],
    ["RTM Rows", catalog.rtm.length],
    ["Missing Coverage", catalog.rtm.filter((r) => r.coverageStatus !== "Covered").length],
  ]),
});

writeWorkbook("Regression_Test_Suite.xlsx", {
  "Regression Tests": sheetFromObjects(catalog.regressionTestCases, [
    "regressionId",
    "suite",
    "module",
    "title",
    "steps",
    "expectedResults",
    "frequency",
    "automationCandidate",
    "status",
  ]),
});

writeWorkbook("Security_Test_Cases.xlsx", {
  "Security Tests": sheetFromObjects(catalog.securityTestCases, [
    "testCaseId",
    "requirementId",
    "area",
    "owaspCategory",
    "title",
    "preconditions",
    "steps",
    "expectedResults",
    "severity",
    "priority",
    "automationCandidate",
    "status",
  ]),
});

writeWorkbook("API_Test_Cases.xlsx", {
  "API Tests": sheetFromObjects(catalog.apiTestCases, [
    "testCaseId",
    "apiId",
    "module",
    "method",
    "endpoint",
    "title",
    "testType",
    "requestValidation",
    "expectedResponse",
    "authValidation",
    "priority",
    "automationCandidate",
    "status",
  ]),
});

const checklistSheets = {};
for (const [name, items] of Object.entries(catalog.releaseChecklists)) {
  checklistSheets[name] = XLSX.utils.aoa_to_sheet([
    ["ID", "Checklist Item", "Owner", "Status", "Evidence / Notes"],
    ...items.map((item, idx) => [`${name.split(" ")[0].toUpperCase()}-${String(idx + 1).padStart(3, "0")}`, item, "TBD", "Pending", ""]),
  ]);
}
checklistSheets["Execution Dashboard"] = XLSX.utils.aoa_to_sheet([
  ["Metric", "Formula / Source", "Target"],
  ["Requirement Coverage", "Covered RTM rows / total requirements", "100%"],
  ["Pass Rate", "Passed tests / executed tests", ">= 95% overall; 100% critical path"],
  ["Open Critical Defects", "Defect tracker", "0"],
  ["Open High Financial/Security Defects", "Defect tracker", "0"],
  ["Automation Coverage", "Automated tests / candidate tests", "Progressive target by phase"],
  ["Defect Leakage", "Production defects / release", "0 Critical"],
  ["API Contract Coverage", "API endpoints with contract tests", "100%"],
]);
writeWorkbook("Release_Readiness_Checklist.xlsx", checklistSheets);

for (const file of [
  "Functional_Test_Cases.xlsx",
  "UAT_Scenarios.xlsx",
  "Requirement_Traceability_Matrix.xlsx",
  "Regression_Test_Suite.xlsx",
  "Security_Test_Cases.xlsx",
  "API_Test_Cases.xlsx",
  "Release_Readiness_Checklist.xlsx",
]) {
  console.log(file, fs.statSync(path.join(base, file)).size);
}
