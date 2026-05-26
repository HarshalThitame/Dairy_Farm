"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

export default function PlatformLineChart({ data = [], height = 300 }) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="label" tick={{ fontSize: 13 }} />
          <YAxis tick={{ fontSize: 13 }} />
          <Tooltip />
          <Line type="monotone" dataKey="signups" stroke="#16a34a" strokeWidth={3} name="Signups" />
          <Line type="monotone" dataKey="active" stroke="#2563eb" strokeWidth={3} name="Active Farms" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
