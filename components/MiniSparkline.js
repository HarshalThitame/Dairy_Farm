"use client";

import { Line, LineChart, ResponsiveContainer } from "recharts";

export default function MiniSparkline({ data = [], color = "#2563eb" }) {
  const chartData = data.map((value, index) => ({
    index,
    value: Number(value || 0)
  }));

  if (chartData.length === 0) {
    return (
      <div className="flex h-[80px] items-center justify-center rounded-lg bg-slate-50 text-[18px] font-bold text-slate-500">
        नोंद नाही
      </div>
    );
  }

  return (
    <div className="h-[80px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={4}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
