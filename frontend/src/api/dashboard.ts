import api from '@/lib/axios';
import type { DashboardSummary, ApiResponse } from '@/types';

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const res = await api.get<ApiResponse<DashboardSummary>>(
    '/dashboard/summary',
  );
  return res.data.data;
}
