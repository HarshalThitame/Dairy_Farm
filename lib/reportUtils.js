import {
  formatCurrency,
  formatLitres,
  formatMarathiDate,
  toMarathiNumerals
} from "@/lib/marathiUtils";
import { APP_NAME, APP_TAGLINE } from "@/lib/branding";

export const reportMonths = [
  "जानेवारी",
  "फेब्रुवारी",
  "मार्च",
  "एप्रिल",
  "मे",
  "जून",
  "जुलै",
  "ऑगस्ट",
  "सप्टेंबर",
  "ऑक्टोबर",
  "नोव्हेंबर",
  "डिसेंबर"
];

export const incomeCategories = ["दूध विक्री", "वासरू विक्री", "इतर"];
export const expenseCategories = ["खाद्य", "चारा", "औषध", "रेतन खर्च", "पशुवैद्यक", "मजुरी", "इतर"];
export const vaccineTypes = [
  "खुरपका-तोंडपका",
  "घटसर्प",
  "हेमोरेजिक सेप्टिसेमिया",
  "ब्रुसेलोसिस",
  "थायलेरिया",
  "जंतनाशक"
];

export function getMonthName(monthNumber) {
  return reportMonths[Number(monthNumber) - 1] || "";
}

export function getMonthLabel(month, year) {
  return `${getMonthName(month)} ${toMarathiNumerals(year)}`;
}

export function padDatePart(value) {
  return String(value).padStart(2, "0");
}

export function getMonthRange(month, year) {
  const parsedMonth = Number(month);
  const parsedYear = Number(year);
  const nextMonth = parsedMonth === 12 ? 1 : parsedMonth + 1;
  const nextYear = parsedMonth === 12 ? parsedYear + 1 : parsedYear;

  return {
    start: `${parsedYear}-${padDatePart(parsedMonth)}-01`,
    end: `${nextYear}-${padDatePart(nextMonth)}-01`,
    daysInMonth: new Date(parsedYear, parsedMonth, 0).getDate()
  };
}

export function getIndiaMonthParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit"
  }).formatToParts(date);

  return {
    year: Number(parts.find((part) => part.type === "year")?.value),
    month: Number(parts.find((part) => part.type === "month")?.value)
  };
}

export function getMonthInput(searchParams) {
  const current = getIndiaMonthParts();
  const month = Number(searchParams.get("month") || current.month);
  const year = Number(searchParams.get("year") || current.year);

  if (!Number.isInteger(month) || month < 1 || month > 12 || !Number.isInteger(year)) {
    return null;
  }

  return { month, year };
}

export function addMonths(month, year, offset) {
  const date = new Date(year, month - 1 + offset, 1);

  return {
    month: date.getMonth() + 1,
    year: date.getFullYear()
  };
}

export function getRecordMilkTotal(record) {
  if (record?.total_litres !== undefined && record?.total_litres !== null) {
    return Number(record.total_litres || 0);
  }

  return Number(record?.morning_litres || 0) + Number(record?.evening_litres || 0);
}

export function getRecordMilkAmount(record) {
  if (record?.total_amount !== undefined && record?.total_amount !== null) {
    return Number(record.total_amount || 0);
  }

  return (
    Number(record?.morning_litres || 0) *
      Number(record?.morning_price_per_litre ?? record?.price_per_litre ?? 0) +
    Number(record?.evening_litres || 0) *
      Number(record?.evening_price_per_litre ?? record?.price_per_litre ?? 0)
  );
}

export function calculateMilkStats(milkRecords, daysInMonth = 30) {
  const dailyTotals = new Map();

  milkRecords.forEach((record) => {
    const current = dailyTotals.get(record.date) || 0;
    dailyTotals.set(record.date, current + getRecordMilkTotal(record));
  });

  const total = milkRecords.reduce((sum, record) => sum + getRecordMilkTotal(record), 0);
  const dailyValues = Array.from(dailyTotals.entries()).map(([date, litres]) => ({
    date,
    litres
  }));

  const best =
    dailyValues.length > 0
      ? dailyValues.reduce((top, item) => (item.litres > top.litres ? item : top), dailyValues[0])
      : null;
  const worst =
    dailyValues.length > 0
      ? dailyValues.reduce((low, item) => (item.litres < low.litres ? item : low), dailyValues[0])
      : null;

  return {
    total,
    average: daysInMonth > 0 ? total / daysInMonth : 0,
    best,
    worst
  };
}

export function groupTransactionsByCategory(transactions) {
  return transactions.reduce((groups, transaction) => {
    const category = transaction.category || "इतर";
    groups[category] = (groups[category] || 0) + Number(transaction.amount || 0);
    return groups;
  }, {});
}

export function calculateFinanceStats(financeRecords) {
  const income = financeRecords.filter((record) => record.type === "उत्पन्न");
  const expense = financeRecords.filter((record) => record.type === "खर्च");
  const totalIncome = income.reduce((sum, record) => sum + Number(record.amount || 0), 0);
  const totalExpense = expense.reduce((sum, record) => sum + Number(record.amount || 0), 0);

  return {
    totalIncome,
    totalExpense,
    netProfit: totalIncome - totalExpense,
    byCategory: {
      income: groupTransactionsByCategory(income),
      expense: groupTransactionsByCategory(expense)
    }
  };
}

function getIntervalMonths(vaccineType) {
  const name = String(vaccineType || "").toLocaleLowerCase("mr-IN");

  if (name.includes("जंतनाशक") || name.includes("deworming")) {
    return 3;
  }

  if (name.includes("bq") || name.includes("hs") || name.includes("घटसर्प")) {
    return 12;
  }

  return 6;
}

export function getNextVaccinationDate(lastDate, vaccineType) {
  if (!lastDate) {
    return null;
  }

  const [year, month, day] = String(lastDate).split("-").map(Number);
  const nextDate = new Date(Date.UTC(year, month - 1, day));
  nextDate.setUTCMonth(nextDate.getUTCMonth() + getIntervalMonths(vaccineType));
  return nextDate.toISOString().slice(0, 10);
}

export function getVaccinationStatus(lastDate, vaccineType) {
  const dueDate = getNextVaccinationDate(lastDate, vaccineType);

  if (!dueDate) {
    return "overdue";
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(`${dueDate}T00:00:00`);
  const daysLeft = Math.ceil((due - today) / 86400000);

  if (daysLeft < 0) {
    return "overdue";
  }

  if (daysLeft <= 30) {
    return "due_soon";
  }

  return "ok";
}

export function displayFinanceCategory(category) {
  if (category === "AI खर्च") {
    return "रेतन खर्च";
  }

  if (category === "कॅटल फीड" || category === "Cattle Feed") {
    return "खाद्य";
  }

  return category || "इतर";
}

export function displayVaccineName(name) {
  const value = String(name || "लसीकरण");
  const normalized = value.toLocaleLowerCase("mr-IN");

  if (normalized.includes("fmd")) {
    return "खुरपका-तोंडपका";
  }

  if (normalized.includes("bq")) {
    return "घटसर्प";
  }

  if (normalized.includes("hs")) {
    return "हेमोरेजिक सेप्टिसेमिया";
  }

  if (normalized.includes("brucellosis")) {
    return "ब्रुसेलोसिस";
  }

  if (normalized.includes("theileria")) {
    return "थायलेरिया";
  }

  if (normalized.includes("deworming")) {
    return "जंतनाशक";
  }

  return value;
}

function escapeHTML(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderRows(rows) {
  if (!rows || rows.length === 0) {
    return `<tr><td colspan="5">नोंदी नाहीत.</td></tr>`;
  }

  return rows
    .map(
      (cells) =>
        `<tr>${cells.map((cell) => `<td>${escapeHTML(cell)}</td>`).join("")}</tr>`
    )
    .join("");
}

export function generatePrintHTML(reportData, selectedSections) {
  const monthLabel = getMonthLabel(reportData.month, reportData.year);
  const include = (section) => selectedSections?.includes(section);
  const milk = reportData.milk || {};
  const finance = reportData.finance || {};
  const dairyDeductions = Number(finance.deductionsCountedInProfit || finance.totalDeductions || 0);
  const finalMonthlyExpense = Number(finance.totalExpense || 0) + dairyDeductions;
  const financeTransactions = [
    ...(finance.transactions || []),
    ...(finance.deductionTransactions || [])
  ];
  const performance = reportData.performance || [];
  const vaccination = reportData.vaccination || {};

  return `<!doctype html>
<html lang="mr">
<head>
  <meta charset="utf-8" />
  <title>${escapeHTML(APP_NAME)} अहवाल</title>
  <style>
    body { font-family: "Noto Sans Devanagari", sans-serif; color: #111827; font-size: 16px; }
    h1, h2 { margin: 0 0 12px; }
    section { page-break-inside: avoid; margin: 0 0 24px; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { border: 1px solid #111827; padding: 8px; text-align: left; }
    th { background: #f3f4f6; }
    .page-break { page-break-before: always; }
  </style>
</head>
<body>
  <h1>🐄 ${escapeHTML(APP_NAME)}</h1>
  <p><strong>${escapeHTML(APP_TAGLINE)}</strong></p>
  <p>${escapeHTML(monthLabel)}</p>
  ${
    include("milk")
      ? `<section><h2>दूध उत्पादन सारांश</h2><p>एकूण दूध: ${escapeHTML(formatLitres(milk.totalLitres || 0))} लिटर</p><p>दररोज सरासरी: ${escapeHTML(formatLitres(milk.dailyAverage || 0))} लिटर</p></section>`
      : ""
  }
  ${
    include("finance")
      ? `<section><h2>हिशोब सारांश</h2><p>उत्पन्न: ${escapeHTML(formatCurrency(finance.totalIncome || 0))}</p><p>मासिक खर्च: ${escapeHTML(formatCurrency(finalMonthlyExpense))}</p><p>डेअरी खाद्य/इतर कपात: ${escapeHTML(formatCurrency(dairyDeductions))}</p><p>वार्षिक खर्च: ${escapeHTML(formatCurrency(finance.annualExpense || 0))}</p><p>मासिक नफा: ${escapeHTML(formatCurrency(finance.netProfit || 0))}</p></section>`
      : ""
  }
  ${
    include("performance")
      ? `<section class="page-break"><h2>गाय कामगिरी</h2><table><thead><tr><th>गाय</th><th>दूध</th><th>रेतन</th><th>व्यायण</th></tr></thead><tbody>${renderRows(
          performance.map((cow) => [
            cow.name,
            `${formatLitres(cow.totalMilk || 0)} लिटर`,
            `${toMarathiNumerals(cow.aiCount || 0)} वेळा`,
            `${toMarathiNumerals(cow.calvingCount || 0)} वेळा`
          ])
        )}</tbody></table></section>`
      : ""
  }
  ${
    include("vaccination")
      ? `<section class="page-break"><h2>लसीकरण यादी</h2><table><thead><tr><th>गाय</th><th>लस</th><th>तारीख</th><th>स्थिती</th></tr></thead><tbody>${renderRows(
          [...(vaccination.overdue || []), ...(vaccination.dueThisMonth || [])].map((item) => [
            item.cow_name,
            displayVaccineName(item.vaccine_name),
            formatMarathiDate(item.due_date),
            item.days_late ? `${toMarathiNumerals(item.days_late)} दिवस उशीर` : "या महिन्यात"
          ])
        )}</tbody></table></section>`
      : ""
  }
  ${
    include("transactions")
      ? `<section class="page-break"><h2>सर्व व्यवहार यादी</h2><table><thead><tr><th>तारीख</th><th>प्रकार</th><th>वर्ग</th><th>रक्कम</th></tr></thead><tbody>${renderRows(
          financeTransactions.map((item) => [
            formatMarathiDate(item.date),
            item.type,
            displayFinanceCategory(item.category),
            formatCurrency(item.amount)
          ])
        )}</tbody></table></section>`
      : ""
  }
</body>
</html>`;
}
