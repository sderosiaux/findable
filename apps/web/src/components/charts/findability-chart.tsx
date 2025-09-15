'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface MetricDataPoint {
  date: string;
  presence: number;
  pickRate: number;
  citations: number;
}

interface FindabilityChartProps {
  data: MetricDataPoint[];
}

export function FindabilityChart({ data }: FindabilityChartProps) {
  // Mock data for demonstration
  const mockData = data.length > 0 ? data : [
    { date: 'Mon', presence: 0.72, pickRate: 0.58, citations: 0.65 },
    { date: 'Tue', presence: 0.74, pickRate: 0.61, citations: 0.68 },
    { date: 'Wed', presence: 0.71, pickRate: 0.59, citations: 0.66 },
    { date: 'Thu', presence: 0.75, pickRate: 0.62, citations: 0.70 },
    { date: 'Fri', presence: 0.73, pickRate: 0.60, citations: 0.67 },
    { date: 'Sat', presence: 0.76, pickRate: 0.63, citations: 0.71 },
    { date: 'Sun', presence: 0.75, pickRate: 0.62, citations: 0.71 },
  ];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={mockData}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="date"
          className="text-xs"
          tick={{ fill: 'currentColor' }}
        />
        <YAxis
          className="text-xs"
          tick={{ fill: 'currentColor' }}
          tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'var(--background)',
            border: '1px solid var(--border)',
            borderRadius: '6px',
          }}
          formatter={(value: number) => `${(value * 100).toFixed(1)}%`}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="presence"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={{ r: 3 }}
          name="Presence Score"
        />
        <Line
          type="monotone"
          dataKey="pickRate"
          stroke="#10b981"
          strokeWidth={2}
          dot={{ r: 3 }}
          name="Pick Rate"
        />
        <Line
          type="monotone"
          dataKey="citations"
          stroke="#8b5cf6"
          strokeWidth={2}
          dot={{ r: 3 }}
          name="Citations"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}