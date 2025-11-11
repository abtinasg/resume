import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import type { JWTPayload, TokenData } from '@/lib/types/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_development_only';
const SALT_ROUNDS = 10;

/**
 * Hash a plain text password using bcrypt
 * @param password - Plain text password to hash
 * @returns Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
  return hashedPassword;
}

/**
 * Compare a plain text password with a hashed password
 * @param password - Plain text password to compare
 * @param hash - Hashed password to compare against
 * @returns True if passwords match, false otherwise
 */
export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  const isMatch = await bcrypt.compare(password, hash);
  return isMatch;
}

/**
 * Generate a JWT token with user payload
 * @param payload - User data to encode in the token
 * @returns Signed JWT token
 */
export function generateToken(payload: JWTPayload): string {
  const token = jwt.sign(payload, JWT_SECRET, {
    expiresIn: '7d', // Token expires in 7 days
  });
  return token;
}

/**
 * Verify and decode a JWT token
 * @param token - JWT token to verify
 * @returns Decoded token data or null if invalid
 */
export function verifyToken(token: string): TokenData | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenData;
    return decoded;
  } catch (error) {
    // Token is invalid or expired
    return null;
  }
}

/**
 * Validate email format
 * @param email - Email to validate
 * @returns True if email is valid
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 * @param password - Password to validate
 * @returns Object with validation result and message
 */
export function validatePassword(password: string): {
  isValid: boolean;
  message?: string;
} {
  if (password.length < 8) {
    return {
      isValid: false,
      message: 'Password must be at least 8 characters long',
    };
  }

  if (!/[A-Z]/.test(password)) {
    return {
      isValid: false,
      message: 'Password must contain at least one uppercase letter',
    };
  }

  if (!/[a-z]/.test(password)) {
    return {
      isValid: false,
      message: 'Password must contain at least one lowercase letter',
    };
  }

  if (!/[0-9]/.test(password)) {
    return {
      isValid: false,
      message: 'Password must contain at least one number',
    };
  }

  return { isValid: true };
}

export type { JWTPayload, TokenData } from '@/lib/types/auth';
