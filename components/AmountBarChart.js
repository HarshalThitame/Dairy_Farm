"use client";

import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { formatCurrency, toMarathiNumerals } from "@/lib/marathiUtils";

function AmountTooltip({ active, payload, label }) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 text-[18px] font-bold shadow-soft">
      <p className="text-slate-900">{label}</p>
      <p className={Number(payload[0].value || 0) >= 0 ? "text-green-700" : "text-red-700"}>
        {formatCurrency(payload[0].value)}
      </p>
    </div>
  );
}

export default function AmountBarChart({
  data = [],
  dataKey = "amount",
  labelKey = "label",
  height = 260,
  positiveColor = "#16a34a",
  negativeColor = "#dc2626"
}) {
  const chartData = data.map((item) => ({
    ...item,
    [dataKey]: Number(item[dataKey] || 0)
  }));

  if (chartData.length === 0) {
    return (
      <div className="flex min-h-[220px] items-center justify-center rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 p-4 text-center text-[20px] font-extrabold text-slate-600">
        अजून नोंदी नाहीत.
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <div style={{ width: Math.max(chartData.length * 74, 360), height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 12, right: 12, left: 6, bottom: 8 }}>
            <XAxis
              dataKey={labelKey}
              tick={{ fontSize: 15, fontWeight: 700, fill: "#334155" }}
              interval={0}
            />
            <YAxis
              tickFormatter={(value) => toMarathiNumerals(value)}
              tick={{ fontSize: 15, fontWeight: 700, fill: "#334155" }}
              width={58}
            />
            <Tooltip content={<AmountTooltip />} cursor={{ fill: "#e2e8f0" }} />
            <Bar dataKey={dataKey} radius={[6, 6, 0, 0]}>
              {chartData.map((entry) => (
                <Cell
                  key={entry[labelKey]}
                  fill={Number(entry[dataKey] || 0) >= 0 ? positiveColor : negativeColor}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
