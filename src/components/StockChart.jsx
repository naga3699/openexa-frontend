import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Label,
  Legend,
} from "recharts";

const CustomLegend = ({ payload }) => {
  return (
    <div className="flex items-center gap-6 px-2 pb-2">
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2">
          <div
            className="h-3 w-3 rounded-sm"
            style={{ backgroundColor: entry.color }}
          ></div>
          <span className="text-xs text-slate-300">{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

const StockChart = ({ data }) => {
  return (
    <div className="flex flex-col gap-4">
      <div
        className="relative"
        style={{
          width: "100%",
          height: 420,
          borderRadius: 16,
          padding: 16,
          background: "#0b1120", // slate-950-ish
        }}
      >
        <div className="absolute right-12 top-12 z-10">
          <CustomLegend
            payload={[
              { value: "Actual Log Return", color: "#6366f1" },
              { value: "Predicted Log Return", color: "#f43f5e" },
            ]}
          />
        </div>

        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 20, right: 30, left: 0, bottom: 10 }}
          >
            {/* subtle grid */}
            <CartesianGrid
              stroke="rgba(148, 163, 184, 0.15)"
              strokeDasharray="3 3"
            />

            {/* x-axis: just dates, small + muted */}
            <XAxis
              dataKey="date"
              tick={{ fill: "#9ca3af", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              minTickGap={24}
            >
              <Label
                value="Date"
                position="insideBottom"
                offset={-5}
                fill="#9ca3af"
                fontSize={12}
              />
            </XAxis>

            {/* y-axis: prices */}
            <YAxis
              tick={{ fontSize: 12, fill: "#9ca3af" }}
              domain={["auto", "auto"]}
            >
              <Label
                value="Log Return"
                angle={-90}
                position="insideLeft"
                fill="#9ca3af"
                fontSize={12}
                offset={10}
              />
            </YAxis>

            {/* hover tooltip */}
            <Tooltip
              contentStyle={{
                backgroundColor: "#020617",
                border: "1px solid rgba(148,163,184,0.3)",
                borderRadius: 8,
                padding: "8px 10px",
              }}
              labelStyle={{ color: "#e5e7eb", fontSize: 12 }}
              itemStyle={{ color: "#a5b4fc", fontSize: 12 }}
              formatter={(value) => [
                `${Number(value).toFixed(4)}`,
                "Log Return",
              ]}
            />

            {/* line: smooth, thick, gradient color */}
            <defs>
              <linearGradient id="stockLine" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity={1} />
                <stop offset="100%" stopColor="#22c55e" stopOpacity={0.7} />
              </linearGradient>
            </defs>

            <Line
              type="monotone"
              dataKey="actual"
              stroke="#6366f1"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 5, strokeWidth: 0, fill: "#f97316" }}
              name="Actual Log Return"
            />

            <Line
              type="monotone"
              dataKey="predicted"
              stroke="#f43f5e"
              strokeWidth={2}
              dot={false}
              name="Predicted Log Return"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default StockChart;
