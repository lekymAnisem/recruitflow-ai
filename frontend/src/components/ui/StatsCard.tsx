import { clsx } from 'clsx';
import { TrendingUp, TrendingDown } from 'lucide-react';
import type { ReactNode } from 'react';

interface StatsCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  trend?: {
    value: number;
    isUp: boolean;
  };
  className?: string;
}

export function StatsCard({
  icon,
  label,
  value,
  trend,
  className,
}: StatsCardProps) {
  return (
    <div
      className={clsx(
        'rounded-xl border border-gray-200 bg-white p-6 shadow-sm',
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <div className="rounded-lg bg-primary-50 p-3 text-primary-600">
          {icon}
        </div>
      </div>
      <div className="mt-4">
        <p className="text-sm text-gray-500">{label}</p>
        <div className="mt-1 flex items-baseline gap-2">
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
          {trend && (
            <span
              className={clsx(
                'inline-flex items-center gap-0.5 text-sm font-medium',
                trend.isUp ? 'text-green-600' : 'text-red-600',
              )}
            >
              {trend.isUp ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              {Math.abs(trend.value)}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
