export interface DonutChartData {
  type: 'donut';
  title: string;
  centerLabel?: string;
  valueLabel?: string;
  data: { name: string; value: number }[];
}

export interface BarChartData {
  type: 'bar';
  title: string;
  yAxisLabel?: string;
  bars: { dataKey: string; label: string }[];
  data: Record<string, string | number>[];
}

export interface RadarChartData {
  type: 'radar';
  title: string;
  data: { axis: string; value: number; fullMark: number }[];
}

export interface AreaChartData {
  type: 'area';
  title: string;
  yAxisLabel?: string;
  areas: { dataKey: string; label: string }[];
  data: Record<string, string | number>[];
}

export type ChartData = DonutChartData | BarChartData | RadarChartData | AreaChartData;
