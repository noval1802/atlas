"use client";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { chartData } from "@/data/dashboard";
export function IncidentChart({ data = chartData }: { data?: typeof chartData }) {
  return (
    <div className="h-[245px] px-2 pt-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 12, left: -22, bottom: 5 }}>
          <defs>
            <linearGradient id="cyan" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.28} />
              <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="day" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{
              background: "#0c1728",
              border: "1px solid #263950",
              borderRadius: 8,
              fontSize: 11,
            }}
          />
          <Area type="monotone" dataKey="bencana" stroke="#22d3ee" fill="url(#cyan)" strokeWidth={2} />
          <Area type="monotone" dataKey="karhutla" stroke="#fb923c" fill="transparent" strokeWidth={1.5} />
          <Area type="monotone" dataKey="unras" stroke="#facc15" fill="transparent" strokeWidth={1.5} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
