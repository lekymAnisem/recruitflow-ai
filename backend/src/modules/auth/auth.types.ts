export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  organizationId: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}
