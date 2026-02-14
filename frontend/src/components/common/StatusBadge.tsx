interface StatusBadgeProps {
  value: number;
  showPercentage?: boolean;
}

export default function StatusBadge({ value, showPercentage = true }: StatusBadgeProps) {
  const isPositive = value > 0;
  const isNeutral = value === 0;

  const bgColor = isNeutral
    ? 'bg-gray-100 text-gray-700'
    : isPositive
      ? 'bg-green-50 text-green-700'
      : 'bg-red-50 text-red-700';

  const sign = isPositive ? '+' : '';
  const display = showPercentage
    ? `${sign}${value.toFixed(1)}%`
    : `${sign}${formatCurrency(value)}`;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tabular-nums ${bgColor}`}>
      {display}
    </span>
  );
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
