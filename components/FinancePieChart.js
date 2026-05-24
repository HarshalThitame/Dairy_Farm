"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatCurrency } from "@/lib/marathiUtils";

const colors = ["#16a34a", "#dc2626"];

function FinanceTooltip({ active, payload }) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 text-[18px] font-bold shadow-soft">
      <p className="text-slate-900">{payload[0].name}</p>
      <p className={payload[0].name === "उत्पन्न" ? "text-green-700" : "text-red-700"}>
        {formatCurrency(payload[0].value)}
      </p>
    </div>
  );
}

export default function FinancePieChart({ income = 0, expense = 0 }) {
  const chartData = [
    { name: "उत्पन्न", value: Number(income || 0) },
    { name: "खर्च", value: Number(expense || 0) }
  ].filter((item) => item.value > 0);
  const net = Number(income || 0) - Number(expense || 0);

  if (chartData.length === 0) {
    return (
      <div className="flex min-h-[260px] items-center justify-center rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 text-center text-[20px] font-extrabold text-slate-600">
        अजून हिशोब नोंदी नाहीत.
      </div>
    );
  }

  return (
    <div className="relative h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            innerRadius={72}
            outerRadius={112}
            paddingAngle={3}
          >
            {chartData.map((entry, index) => (
              <Cell key={entry.name} fill={colors[index]} />
            ))}
          </Pie>
          <Tooltip content={<FinanceTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
        <p className="text-[18px] font-extrabold text-slate-600">निव्वळ</p>
        <p className={`text-[22px] font-extrabold ${net >= 0 ? "text-green-700" : "text-red-700"}`}>
          {formatCurrency(Math.abs(net))}
        </p>
      </div>
    </div>
  );
}
