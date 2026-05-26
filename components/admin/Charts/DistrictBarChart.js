"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export default function DistrictBarChart({ data = [], height = 320 }) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="district" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 13 }} />
          <Tooltip />
          <Bar dataKey="farms" fill="#16a34a" radius={[6, 6, 0, 0]} name="Farms" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
