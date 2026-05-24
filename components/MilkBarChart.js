"use client";

import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { formatLitres, formatMarathiDate, toMarathiNumerals } from "@/lib/marathiUtils";

function MilkTooltip({ active, payload, label }) {
  if (!active || !payload?.length) {
    return null;
  }

  const item = payload[0]?.payload;

  return (
    <div className="rounded-lg border border-blue-200 bg-white p-3 text-[18px] font-bold shadow-soft">
      <p className="text-slate-900">
        {item?.date ? formatMarathiDate(item.date) : toMarathiNumerals(label)}
      </p>
      <p className="text-blue-700">{formatLitres(payload[0].value)} लिटर</p>
    </div>
  );
}

export default function MilkBarChart({ data = [], height = 260 }) {
  const chartData = data.map((item) => ({
    ...item,
    litres: Number(item.litres ?? item.total ?? 0)
  }));

  return (
    <div className="w-full overflow-x-auto">
      <div style={{ width: Math.max(chartData.length * 34, 360), height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 12, right: 12, left: 0, bottom: 8 }}>
            <XAxis
              dataKey="day"
              tickFormatter={(value) => toMarathiNumerals(value)}
              tick={{ fontSize: 16, fontWeight: 700, fill: "#334155" }}
              interval={0}
            />
            <YAxis
              tickFormatter={(value) => toMarathiNumerals(value)}
              tick={{ fontSize: 16, fontWeight: 700, fill: "#334155" }}
              width={42}
            />
            <Tooltip content={<MilkTooltip />} cursor={{ fill: "#dbeafe" }} />
            <Bar dataKey="litres" fill="#2563eb" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
