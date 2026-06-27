import { clsx } from 'clsx';
import { ChevronUp, ChevronDown } from 'lucide-react';
import type { ReactNode } from 'react';

export interface Column<T> {
  key: string;
  label: string;
  render?: (item: T) => ReactNode;
  sortable?: boolean;
  sortDirection?: 'asc' | 'desc' | null;
  onSort?: () => void;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (item: T) => void;
  className?: string;
}

export function Table<T extends Record<string, unknown>>({
  columns,
  data,
  onRowClick,
  className,
}: TableProps<T>) {
  return (
    <div
      className={clsx('overflow-x-auto rounded-lg border border-gray-200', className)}
    >
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={clsx(
                  'px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500',
                  col.sortable && 'cursor-pointer select-none',
                )}
                onClick={col.sortable ? col.onSort : undefined}
              >
                <div className="flex items-center gap-1">
                  {col.label}
                  {col.sortable && (
                    <span className="inline-flex flex-col">
                      <ChevronUp
                        className={clsx(
                          '-mb-1 h-3 w-3',
                          col.sortDirection === 'asc'
                            ? 'text-primary-600'
                            : 'text-gray-300',
                        )}
                      />
                      <ChevronDown
                        className={clsx(
                          '-mt-1 h-3 w-3',
                          col.sortDirection === 'desc'
                            ? 'text-primary-600'
                            : 'text-gray-300',
                        )}
                      />
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {data.map((item, index) => (
            <tr
              key={(item.id as string) || index}
              onClick={() => onRowClick?.(item)}
              className={clsx(
                'transition-colors',
                onRowClick && 'cursor-pointer hover:bg-gray-50',
              )}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className="whitespace-nowrap px-6 py-4 text-sm text-gray-700"
                >
                  {col.render
                    ? col.render(item)
                    : (item[col.key] as ReactNode)}
                </td>
              ))}
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
              <td
                colSpan={columns.length}
                className="px-6 py-12 text-center text-sm text-gray-500"
              >
                No data available
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
