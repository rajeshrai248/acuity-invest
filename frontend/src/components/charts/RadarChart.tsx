import {
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
} from 'recharts';
import ChartContainer from './ChartContainer';
import { CHART_COLORS } from './chartColors';

import type { RadarChartData } from '../../types/charts';

interface RadarChartProps {
  data: RadarChartData;
}

export default function RadarChart({ data }: RadarChartProps) {
  return (
    <ChartContainer title={data.title}>
      <RechartsRadarChart cx="50%" cy="50%" outerRadius="70%" data={data.data}>
        <PolarGrid stroke="#e5e7eb" />
        <PolarAngleAxis
          dataKey="axis"
          tick={{ fontSize: 12, fill: '#4b5563' }}
        />
        <PolarRadiusAxis
          angle={90}
          domain={[0, 'dataMax']}
          tick={{ fontSize: 10, fill: '#9ca3af' }}
        />
        <Radar
          name="Score"
          dataKey="value"
          stroke={CHART_COLORS[0]}
          fill={CHART_COLORS[0]}
          fillOpacity={0.25}
          animationBegin={0}
          animationDuration={800}
        />
        <Tooltip
          contentStyle={{
            borderRadius: 8,
            border: '1px solid #e5e7eb',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            fontSize: 13,
          }}
        />
      </RechartsRadarChart>
    </ChartContainer>
  );
}
