import api from '@/lib/axios';
import type { User, ApiResponse } from '@/types';

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  organizationName: string;
}

export interface CandidateRegisterData {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

export async function login(data: LoginData): Promise<AuthResponse> {
  const res = await api.post<ApiResponse<AuthResponse>>('/auth/login', data);
  return res.data.data;
}

export async function register(data: RegisterData): Promise<AuthResponse> {
  const res = await api.post<ApiResponse<AuthResponse>>('/auth/register', data);
  return res.data.data;
}

export async function registerCandidate(data: CandidateRegisterData): Promise<AuthResponse> {
  const res = await api.post<ApiResponse<AuthResponse>>('/auth/register/candidate', data);
  return res.data.data;
}

export async function logout(): Promise<void> {
  await api.post('/auth/logout');
}

export async function refresh(): Promise<{ accessToken: string }> {
  const res = await api.post<ApiResponse<{ accessToken: string }>>(
    '/auth/refresh',
  );
  return res.data.data;
}

export async function getMe(): Promise<User> {
  const res = await api.get<ApiResponse<User>>('/auth/me');
  return res.data.data;
}
