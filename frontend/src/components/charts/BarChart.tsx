import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';
import ChartContainer from './ChartContainer';
import { CHART_COLORS, GAIN_COLOR, LOSS_COLOR } from './chartColors';
import type { BarChartData } from '../../types/charts';

interface BarChartProps {
  data: BarChartData;
}

export default function BarChart({ data }: BarChartProps) {
  return (
    <ChartContainer title={data.title}>
      <RechartsBarChart data={data.data} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
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
        {data.bars.map((bar, barIndex) => (
          <Bar
            key={bar.dataKey}
            dataKey={bar.dataKey}
            name={bar.label}
            radius={[4, 4, 0, 0]}
            animationBegin={0}
            animationDuration={800}
          >
            {data.data.map((entry, index) => {
              const val = entry[bar.dataKey];
              const isNegative = typeof val === 'number' && val < 0;
              const defaultColor = CHART_COLORS[barIndex % CHART_COLORS.length];
              return (
                <Cell
                  key={`cell-${index}`}
                  fill={isNegative ? LOSS_COLOR : (data.bars.length === 1 ? GAIN_COLOR : defaultColor)}
                />
              );
            })}
          </Bar>
        ))}
      </RechartsBarChart>
    </ChartContainer>
  );
}
