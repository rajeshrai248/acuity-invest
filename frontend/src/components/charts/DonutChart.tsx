import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import ChartContainer from './ChartContainer';
import { CHART_COLORS } from './chartColors';
import type { DonutChartData } from '../../types/charts';

interface DonutChartProps {
  data: DonutChartData;
}

export default function DonutChart({ data }: DonutChartProps) {
  return (
    <ChartContainer title={data.title} height={380}>
      <PieChart>
        <Pie
          data={data.data}
          cx="50%"
          cy="45%"
          innerRadius={70}
          outerRadius={120}
          paddingAngle={2}
          dataKey="value"
          animationBegin={0}
          animationDuration={800}
          label={({ name, value }) =>
            `${name}: ${value}${data.valueLabel || ''}`
          }
          labelLine={{ strokeWidth: 1, stroke: '#9ca3af' }}
        >
          {data.data.map((_, index) => (
            <Cell
              key={`cell-${index}`}
              fill={CHART_COLORS[index % CHART_COLORS.length]}
            />
          ))}
        </Pie>
        {data.centerLabel && (
          <text
            x="50%"
            y="45%"
            textAnchor="middle"
            dominantBaseline="central"
            className="text-lg font-bold"
            fill="#1f2937"
          >
            {data.centerLabel}
          </text>
        )}
        <Tooltip
          formatter={(value: number) =>
            `${value}${data.valueLabel || ''}`
          }
          contentStyle={{
            borderRadius: 8,
            border: '1px solid #e5e7eb',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            fontSize: 13,
          }}
        />
        <Legend
          verticalAlign="bottom"
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 12, paddingTop: 16 }}
        />
      </PieChart>
    </ChartContainer>
  );
}
