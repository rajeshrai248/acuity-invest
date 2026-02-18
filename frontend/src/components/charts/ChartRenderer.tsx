import type { ChartData } from '../../types/charts';
import DonutChart from './DonutChart';
import BarChart from './BarChart';
import RadarChart from './RadarChart';
import AreaChart from './AreaChart';

interface ChartRendererProps {
  data: ChartData;
}

export default function ChartRenderer({ data }: ChartRendererProps) {
  switch (data.type) {
    case 'donut':
      return <DonutChart data={data} />;
    case 'bar':
      return <BarChart data={data} />;
    case 'radar':
      return <RadarChart data={data} />;
    case 'area':
      return <AreaChart data={data} />;
    default:
      return (
        <div className="my-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700">
          Unsupported chart type
        </div>
      );
  }
}
