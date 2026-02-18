import { ResponsiveContainer } from 'recharts';

interface ChartContainerProps {
  title: string;
  subtitle?: string;
  height?: number;
  children: React.ReactElement;
}

export default function ChartContainer({ title, subtitle, height = 350, children }: ChartContainerProps) {
  return (
    <div className="my-6 bg-white rounded-xl border border-gray-100 p-5">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      <ResponsiveContainer width="100%" height={height}>
        {children}
      </ResponsiveContainer>
    </div>
  );
}
