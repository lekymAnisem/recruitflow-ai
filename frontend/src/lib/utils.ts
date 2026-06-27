import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  });
}

export function formatCurrency(
  min: number,
  max: number,
  _currency = 'USD',
): string {
  const fmt = (val: number) => {
    if (val >= 1000) {
      return `$${Math.round(val / 1000)}k`;
    }
    return `$${val}`;
  };
  return `${fmt(min)} - ${fmt(max)}`;
}

export function getStageColor(stage: string): string {
  const colors: Record<string, string> = {
    new: 'bg-blue-100 text-blue-800',
    screening: 'bg-yellow-100 text-yellow-800',
    interview: 'bg-purple-100 text-purple-800',
    offer: 'bg-green-100 text-green-800',
    hired: 'bg-emerald-100 text-emerald-800',
    rejected: 'bg-red-100 text-red-800',
    withdrawn: 'bg-gray-100 text-gray-800',
  };
  return colors[stage] || 'bg-gray-100 text-gray-800';
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-800',
    open: 'bg-green-100 text-green-800',
    closed: 'bg-red-100 text-red-800',
    filled: 'bg-blue-100 text-blue-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

export function truncate(str: string, len: number): string {
  if (str.length <= len) return str;
  return str.slice(0, len) + '…';
}
