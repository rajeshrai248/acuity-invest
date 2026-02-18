import {
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import ChartContainer from './ChartContainer';
import { CHART_COLORS } from './chartColors';
import type { AreaChartData } from '../../types/charts';

interface AreaChartProps {
  data: AreaChartData;
}

export default function AreaChart({ data }: AreaChartProps) {
  return (
    <ChartContainer title={data.title}>
      <RechartsAreaChart data={data.data} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
        <defs>
          {data.areas.map((area, index) => (
            <linearGradient key={area.dataKey} id={`gradient-${area.dataKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={CHART_COLORS[index % CHART_COLORS.length]} stopOpacity={0.3} />
              <stop offset="95%" stopColor={CHART_COLORS[index % CHART_COLORS.length]} stopOpacity={0.05} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 12, fill: '#6b7280' }}
          axisLine={{ stroke: '#e5e7eb' }}
          tickLine={false}
        />
        <YAxis
          label={
            data.yAxisLabel
              ? { value: data.yAxisLabel, angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: '#6b7280' } }
              : undefined
          }
          tick={{ fontSize: 12, fill: '#6b7280' }}
          axisLine={{ stroke: '#e5e7eb' }}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            borderRadius: 8,
            border: '1px solid #e5e7eb',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            fontSize: 13,
          }}
        />
        {data.areas.map((area, index) => (
          <Area
            key={area.dataKey}
            type="monotone"
            dataKey={area.dataKey}
            name={area.label}
            stroke={CHART_COLORS[index % CHART_COLORS.length]}
            fill={`url(#gradient-${area.dataKey})`}
            strokeWidth={2}
            animationBegin={0}
            animationDuration={800}
          />
        ))}
      </RechartsAreaChart>
    </ChartContainer>
  );
}
