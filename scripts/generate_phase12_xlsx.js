const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");

const base = path.join(process.cwd(), "docs/qa/phase12");
const catalog = JSON.parse(fs.readFileSync(path.join(base, "phase12_qa_catalog.json"), "utf8"));

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

const functionalHeaders = [
  "testCaseId",
  "requirementId",
  "module",
  "title",
  "priority",
  "severity",
  "preconditions",
  "testData",
  "steps",
  "expectedResults",
  "postConditions",
  "automationCandidate",
  "status",
];

write("Functional_Test_Cases.xlsx", {
  "Functional Tests": sheet(catalog.functionalTestCases, functionalHeaders),
  "Negative Tests": sheet(catalog.negativeTestCases, functionalHeaders),
  "Localization Tests": sheet(catalog.localizationTestCases, [
    "testCaseId",
    "language",
    "area",
    "title",
    "preconditions",
    "steps",
    "expectedResults",
    "priority",
    "severity",
    "automationCandidate",
    "status",
  ]),
  "Accessibility Tests": sheet(catalog.accessibilityTestCases, [
    "testCaseId",
    "area",
    "title",
    "preconditions",
    "steps",
    "expectedResults",
    "priority",
    "severity",
    "automationCandidate",
    "status",
  ]),
  RTM: sheet(catalog.rtm, [
    "businessRequirement",
    "functionalRequirement",
    "module",
    "userStory",
    "testCases",
    "uatScenario",
    "coverageStatus",
    "coverageType",
  ]),
});

write("API_Test_Cases.xlsx", {
  "API Tests": sheet(catalog.apiTestCases, [
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
    "severity",
    "automationCandidate",
    "status",
  ]),
});

write("Database_Test_Cases.xlsx", {
  "Database Tests": sheet(catalog.databaseTestCases, [
    "testCaseId",
    "table",
    "requirementId",
    "title",
    "preconditions",
    "sqlVerificationQuery",
    "steps",
    "expectedResults",
    "priority",
    "severity",
    "automationCandidate",
    "status",
  ]),
});

write("OCR_Test_Cases.xlsx", {
  "OCR Tests": sheet(catalog.ocrTestCases, [
    "testCaseId",
    "requirementId",
    "scenario",
    "title",
    "preconditions",
    "testData",
    "steps",
    "expectedResults",
    "priority",
    "severity",
    "automationCandidate",
    "status",
  ]),
});

write("AI_Test_Cases.xlsx", {
  "AI Tests": sheet(catalog.aiTestCases, [
    "testCaseId",
    "requirementId",
    "scenario",
    "title",
    "preconditions",
    "testData",
    "steps",
    "expectedResults",
    "priority",
    "severity",
    "automationCandidate",
    "status",
  ]),
});

write("Security_Test_Cases.xlsx", {
  "Security Tests": sheet(catalog.securityTestCases, [
    "testCaseId",
    "area",
    "title",
    "owaspCategory",
    "preconditions",
    "steps",
    "expectedResults",
    "severity",
    "priority",
    "automationCandidate",
    "status",
  ]),
  "Performance Tests": sheet(catalog.performanceTestCases, [
    "testCaseId",
    "area",
    "testType",
    "workloadModel",
    "target",
    "preconditions",
    "steps",
    "expectedResults",
    "priority",
    "severity",
    "automationCandidate",
    "status",
  ]),
});

write("UAT_Scenarios.xlsx", {
  "UAT Scenarios": sheet(catalog.uatScenarios, [
    "uatId",
    "scenario",
    "actor",
    "objective",
    "preconditions",
    "steps",
    "expectedOutcome",
    "acceptanceCriteria",
    "status",
  ]),
});

write("Regression_Test_Suite.xlsx", {
  Regression: sheet(catalog.regressionTestCases, [
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

write("Release_Readiness_Checklist.xlsx", {
  Checklists: sheet(catalog.releaseChecklists, ["checklistId", "category", "item", "owner", "status", "evidence"]),
});

const counts = [
  ["Suite", "Count"],
  ["Functional", catalog.functionalTestCases.length],
  ["Negative", catalog.negativeTestCases.length],
  ["API", catalog.apiTestCases.length],
  ["Database", catalog.databaseTestCases.length],
  ["OCR", catalog.ocrTestCases.length],
  ["AI", catalog.aiTestCases.length],
  ["Localization", catalog.localizationTestCases.length],
  ["Accessibility", catalog.accessibilityTestCases.length],
  ["Performance", catalog.performanceTestCases.length],
  ["Security", catalog.securityTestCases.length],
  ["UAT", catalog.uatScenarios.length],
  ["Regression", catalog.regressionTestCases.length],
];
const total = counts.slice(1).reduce((sum, row) => sum + Number(row[1]), 0);

const severityRows = [["Severity", "Open Count", "Exit Rule"], ["Critical", 0, "Must be 0"], ["High", 0, "Must be 0 or approved waiver"], ["Medium", 0, "Accepted with owner/date"], ["Low", 0, "Can defer"]];

write("QA_Executive_Dashboard.xlsx", {
  "Suite Counts": aoa([...counts, ["Total", total]]),
  "Quality Gates": aoa([
    ["Gate", "Status", "Evidence"],
    ["Build Gate", "Pending", "CI build/lint/unit test output"],
    ["System Gate", "Pending", "Functional/regression execution report"],
    ["Security Gate", "Pending", "Security test and RLS evidence"],
    ["Performance Gate", "Pending", "k6/Lighthouse/provider latency evidence"],
    ["UAT Gate", "Pending", "Business sign-off"],
    ["Release Gate", "Pending", "No Critical/High defects without waiver"],
  ]),
  "Defect Summary": aoa(severityRows),
  "Traceability": sheet(catalog.rtm, [
    "businessRequirement",
    "functionalRequirement",
    "module",
    "userStory",
    "testCases",
    "uatScenario",
    "coverageStatus",
    "coverageType",
  ]),
});

for (const file of [
  "Functional_Test_Cases.xlsx",
  "API_Test_Cases.xlsx",
  "Database_Test_Cases.xlsx",
  "OCR_Test_Cases.xlsx",
  "AI_Test_Cases.xlsx",
  "Security_Test_Cases.xlsx",
  "UAT_Scenarios.xlsx",
  "Regression_Test_Suite.xlsx",
  "Release_Readiness_Checklist.xlsx",
  "QA_Executive_Dashboard.xlsx",
]) {
  console.log(file, fs.statSync(path.join(base, file)).size);
}
