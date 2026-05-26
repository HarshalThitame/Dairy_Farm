import StatusBadge from "@/components/StatusBadge";
import { APP_NAME, APP_TAGLINE } from "@/lib/branding";
import {
  calculateAgeMarathi,
  formatCowBreed,
  formatCurrency,
  formatLitres,
  formatMarathiDate,
  toMarathiNumerals
} from "@/lib/marathiUtils";
import { displayFinanceCategory, displayVaccineName, getMonthLabel } from "@/lib/reportUtils";

function EmptyRow({ columns }) {
  return (
    <tr>
      <td className="border border-slate-900 p-2 text-center" colSpan={columns}>
        नोंदी नाहीत.
      </td>
    </tr>
  );
}

export default function PrintableReport({ reportData, selectedSections }) {
  const milk = reportData?.milk || {};
  const finance = reportData?.finance || {};
  const performance = reportData?.performance || [];
  const vaccination = reportData?.vaccination || {};

  function include(section) {
    return selectedSections.includes(section);
  }

  return (
    <article className="print-page rounded-lg bg-white p-4 text-slate-950 print:rounded-none print:p-0">
      <header className="border-b-2 border-slate-900 pb-4 text-center">
        <h1 className="text-[30px] font-extrabold">🐄 {APP_NAME}</h1>
        <p className="mt-1 text-[18px] font-bold">{APP_TAGLINE}</p>
        <p className="mt-1 text-[21px] font-bold">
          {getMonthLabel(reportData.month, reportData.year)}
        </p>
      </header>

      {include("milk") ? (
        <section className="mt-6 break-inside-avoid">
          <h2 className="text-[24px] font-extrabold">दूध उत्पादन सारांश</h2>
          <table className="mt-3 w-full border-collapse text-[18px]">
            <tbody>
              <tr>
                <th className="border border-slate-900 p-2 text-left">एकूण दूध</th>
                <td className="border border-slate-900 p-2">
                  {formatLitres(milk.totalLitres || 0)} लिटर
                </td>
              </tr>
              <tr>
                <th className="border border-slate-900 p-2 text-left">दररोज सरासरी</th>
                <td className="border border-slate-900 p-2">
                  {formatLitres(milk.dailyAverage || 0)} लिटर
                </td>
              </tr>
              <tr>
                <th className="border border-slate-900 p-2 text-left">सर्वाधिक दूध</th>
                <td className="border border-slate-900 p-2">
                  {formatLitres(milk.bestDay?.litres || 0)} लिटर ({formatMarathiDate(milk.bestDay?.date)})
                </td>
              </tr>
            </tbody>
          </table>
        </section>
      ) : null}

      {include("finance") ? (
        <section className="mt-6 break-inside-avoid">
          <h2 className="text-[24px] font-extrabold">हिशोब सारांश</h2>
          <table className="mt-3 w-full border-collapse text-[18px]">
            <tbody>
              <tr>
                <th className="border border-slate-900 p-2 text-left">उत्पन्न</th>
                <td className="border border-slate-900 p-2">{formatCurrency(finance.totalIncome || 0)}</td>
              </tr>
              <tr>
                <th className="border border-slate-900 p-2 text-left">मासिक खर्च</th>
                <td className="border border-slate-900 p-2">{formatCurrency(finance.totalExpense || 0)}</td>
              </tr>
              <tr>
                <th className="border border-slate-900 p-2 text-left">वार्षिक खर्च</th>
                <td className="border border-slate-900 p-2">{formatCurrency(finance.annualExpense || 0)}</td>
              </tr>
              <tr>
                <th className="border border-slate-900 p-2 text-left">मासिक नफा</th>
                <td className="border border-slate-900 p-2">{formatCurrency(finance.netProfit || 0)}</td>
              </tr>
            </tbody>
          </table>
        </section>
      ) : null}

      {include("performance") ? (
        <section className="mt-6 break-inside-avoid">
          <h2 className="text-[24px] font-extrabold">गाय कामगिरी</h2>
          <table className="mt-3 w-full border-collapse text-[16px]">
            <thead>
              <tr>
                <th className="border border-slate-900 p-2 text-left">गाय</th>
                <th className="border border-slate-900 p-2 text-left">जात</th>
                <th className="border border-slate-900 p-2 text-left">वय</th>
                <th className="border border-slate-900 p-2 text-left">दूध</th>
                <th className="border border-slate-900 p-2 text-left">रेतन</th>
                <th className="border border-slate-900 p-2 text-left">व्यायण</th>
              </tr>
            </thead>
            <tbody>
              {performance.length > 0 ? (
                performance.map((cow) => (
                  <tr key={cow.id}>
                    <td className="border border-slate-900 p-2 font-bold">{cow.name}</td>
                    <td className="border border-slate-900 p-2">{formatCowBreed(cow.breed)}</td>
                    <td className="border border-slate-900 p-2">{calculateAgeMarathi(cow.date_of_birth)}</td>
                    <td className="border border-slate-900 p-2">{formatLitres(cow.totalMilk)} लिटर</td>
                    <td className="border border-slate-900 p-2">{toMarathiNumerals(cow.aiCount)} वेळा</td>
                    <td className="border border-slate-900 p-2">{toMarathiNumerals(cow.calvingCount)} वेळा</td>
                  </tr>
                ))
              ) : (
                <EmptyRow columns={6} />
              )}
            </tbody>
          </table>
        </section>
      ) : null}

      {include("vaccination") ? (
        <section className="mt-6 break-inside-avoid">
          <h2 className="text-[24px] font-extrabold">लसीकरण यादी</h2>
          <table className="mt-3 w-full border-collapse text-[16px]">
            <thead>
              <tr>
                <th className="border border-slate-900 p-2 text-left">गाय</th>
                <th className="border border-slate-900 p-2 text-left">लस</th>
                <th className="border border-slate-900 p-2 text-left">तारीख</th>
                <th className="border border-slate-900 p-2 text-left">स्थिती</th>
              </tr>
            </thead>
            <tbody>
              {[...(vaccination.overdue || []), ...(vaccination.dueThisMonth || [])].length > 0 ? (
                [...(vaccination.overdue || []), ...(vaccination.dueThisMonth || [])].map((item) => (
                  <tr key={item.id}>
                    <td className="border border-slate-900 p-2 font-bold">{item.cow_name}</td>
                    <td className="border border-slate-900 p-2">{displayVaccineName(item.vaccine_name)}</td>
                    <td className="border border-slate-900 p-2">{formatMarathiDate(item.due_date)}</td>
                    <td className="border border-slate-900 p-2">
                      {item.days_late
                        ? `${toMarathiNumerals(item.days_late)} दिवस उशीर`
                        : "या महिन्यात"}
                    </td>
                  </tr>
                ))
              ) : (
                <EmptyRow columns={4} />
              )}
            </tbody>
          </table>
        </section>
      ) : null}

      {include("transactions") ? (
        <section className="mt-6 break-inside-avoid">
          <h2 className="text-[24px] font-extrabold">सर्व व्यवहार यादी</h2>
          <table className="mt-3 w-full border-collapse text-[16px]">
            <thead>
              <tr>
                <th className="border border-slate-900 p-2 text-left">तारीख</th>
                <th className="border border-slate-900 p-2 text-left">प्रकार</th>
                <th className="border border-slate-900 p-2 text-left">वर्ग</th>
                <th className="border border-slate-900 p-2 text-left">रक्कम</th>
                <th className="border border-slate-900 p-2 text-left">गाय</th>
              </tr>
            </thead>
            <tbody>
              {(finance.transactions || []).length > 0 ? (
                finance.transactions.map((item) => (
                  <tr key={item.id}>
                    <td className="border border-slate-900 p-2">{formatMarathiDate(item.date)}</td>
                    <td className="border border-slate-900 p-2">{item.type}</td>
                    <td className="border border-slate-900 p-2">{displayFinanceCategory(item.category)}</td>
                    <td className="border border-slate-900 p-2">{formatCurrency(item.amount)}</td>
                    <td className="border border-slate-900 p-2">{item.cows?.name || "नाही"}</td>
                  </tr>
                ))
              ) : (
                <EmptyRow columns={5} />
              )}
            </tbody>
          </table>
        </section>
      ) : null}
    </article>
  );
}
