const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");

const base = path.join(process.cwd(), "docs/security/phase11");
const catalog = JSON.parse(fs.readFileSync(path.join(base, "security_catalog.json"), "utf8"));

function clean(value) {
  return String(value ?? "").replace(/<br>/g, "; ").trim();
}

function sheet(rows, headers) {
  const aoa = [headers];
  for (const row of rows) aoa.push(headers.map((h) => row[h] ?? ""));
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws["!cols"] = headers.map((_, col) => ({
    wch: Math.min(90, Math.max(14, ...aoa.slice(0, 500).map((row) => clean(row[col]).length))),
  }));
  ws["!freeze"] = { xSplit: 0, ySplit: 1 };
  return ws;
}

function write(file, sheets) {
  const wb = XLSX.utils.book_new();
  for (const [name, ws] of Object.entries(sheets)) {
    XLSX.utils.book_append_sheet(wb, ws, name.slice(0, 31));
  }
  XLSX.writeFile(wb, path.join(base, file), { compression: true });
}

write("Security_Risk_Register.xlsx", {
  "Security Risks": sheet(catalog.riskRegister, [
    "riskId",
    "risk",
    "rating",
    "description",
    "mitigation",
    "residualRisk",
    "owner",
    "status",
  ]),
  "AI Risks": sheet(catalog.aiRisks, ["riskId", "risk", "rating", "description", "mitigation"]),
  "STRIDE Threats": sheet(catalog.threats, [
    "threatId",
    "stride",
    "threatDescription",
    "affectedComponents",
    "likelihood",
    "impact",
    "riskRating",
    "mitigation",
    "residualRisk",
  ]),
});

write("Permission_Matrix.xlsx", {
  Permissions: sheet(catalog.permissionMatrix, [
    "area",
    "farmer",
    "owner",
    "veterinarian",
    "support",
    "admin",
    "superAdmin",
  ]),
  "Role Hierarchy": XLSX.utils.aoa_to_sheet([
    ["Level", "Role", "Scope"],
    [1, "Super Admin", "Full platform control with protected actions"],
    [2, "Admin", "Platform administration excluding highest-risk destructive actions"],
    [3, "Support", "Support tickets and limited diagnostic access"],
    [4, "Farm Owner", "Full own-farm management"],
    [5, "Farmer/Worker", "Operational own-farm access as assigned"],
    [6, "Veterinarian", "Assigned farm health/vaccination access"],
  ]),
});

write("RLS_Policy_Matrix.xlsx", {
  "RLS Matrix": sheet(catalog.rlsMatrix, [
    "table",
    "select",
    "insert",
    "update",
    "delete",
    "securityConsiderations",
  ]),
  "Policy Patterns": XLSX.utils.aoa_to_sheet([
    ["Pattern", "Description"],
    ["can_access_farm(farm_id)", "True for farm members, assigned veterinarian/support scope, admin or super admin"],
    ["can_manage_farm(farm_id)", "True for owner/manager roles and platform admin"],
    ["is_platform_admin()", "True for admin and super admin"],
    ["service role jobs", "Allowed only in trusted server jobs after explicit farm authorization"],
    ["append-only audit", "Audit logs are inserted by server only and not updated/deleted by normal users"],
  ]),
});

write("Security_Test_Cases.xlsx", {
  "Security Tests": sheet(catalog.securityTests, [
    "testCaseId",
    "area",
    "title",
    "preconditions",
    "steps",
    "expectedResults",
    "severity",
    "automationCandidate",
    "status",
  ]),
  Coverage: XLSX.utils.aoa_to_sheet([
    ["Area", "Test Count"],
    ...Object.entries(
      catalog.securityTests.reduce((acc, test) => {
        acc[test.area] = (acc[test.area] || 0) + 1;
        return acc;
      }, {})
    ),
  ]),
});

write("Production_Hardening_Checklist.xlsx", {
  Checklist: sheet(catalog.hardeningItems, ["itemId", "category", "item", "owner", "status", "evidence"]),
  Summary: XLSX.utils.aoa_to_sheet([
    ["Category", "Item Count"],
    ...Object.entries(
      catalog.hardeningItems.reduce((acc, item) => {
        acc[item.category] = (acc[item.category] || 0) + 1;
        return acc;
      }, {})
    ),
  ]),
});

for (const file of [
  "Security_Risk_Register.xlsx",
  "Permission_Matrix.xlsx",
  "RLS_Policy_Matrix.xlsx",
  "Security_Test_Cases.xlsx",
  "Production_Hardening_Checklist.xlsx",
]) {
  console.log(file, fs.statSync(path.join(base, file)).size);
}
