"use client";

import {
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { toMarathiCurrency, toMarathiNumerals } from "@/lib/marathiUtils";

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 text-[18px] font-bold shadow-soft">
      <p>{label}</p>
      <p className={Number(payload[0].value || 0) >= 0 ? "text-green-700" : "text-red-700"}>
        {toMarathiCurrency(payload[0].value)}
      </p>
    </div>
  );
}

export default function ProfitTrendChart({ trend = [], netProfit = 0 }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={trend} margin={{ top: 12, right: 12, left: 4, bottom: 8 }}>
        <XAxis dataKey="label" tick={{ fontSize: 13, fontWeight: 700 }} interval={0} />
        <YAxis
          tickFormatter={(value) => toMarathiNumerals(value)}
          width={62}
          tick={{ fontSize: 13, fontWeight: 700 }}
        />
        <ReferenceLine y={0} stroke="#94a3b8" />
        <Tooltip content={<ChartTooltip />} />
        <Line
          type="monotone"
          dataKey="profit"
          stroke={Number(netProfit || 0) >= 0 ? "#16a34a" : "#dc2626"}
          strokeWidth={4}
          dot={{ r: 5 }}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
