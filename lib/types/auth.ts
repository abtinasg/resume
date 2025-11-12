export interface JWTPayload {
  userId: number;
  email: string;
}

export interface TokenData extends JWTPayload {
  iat?: number;
  exp?: number;
}
