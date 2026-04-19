import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import {
  createUser,
  findUserByEmail,
  findUserById,
  isTokenBlacklisted,
  blacklistToken,
} from '../models/user.model';
import { ValidationError, UnauthorisedError } from '../utils/supercell-errors';
import { AuthTokens, AuthUser } from '../../../shared/types';

const BCRYPT_ROUNDS = 12;

interface JwtPayload {
  sub: string;
  email: string;
}

function accessSecret(): string {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error('JWT_SECRET not set');
  return s;
}

function refreshSecret(): string {
  const s = process.env.JWT_REFRESH_SECRET;
  if (!s) throw new Error('JWT_REFRESH_SECRET not set');
  return s;
}

function issueTokens(userId: string, email: string): AuthTokens {
  const payload: JwtPayload = { sub: userId, email };

  const accessToken = jwt.sign(payload, accessSecret(), {
    expiresIn: (process.env.JWT_EXPIRES_IN ?? '15m') as jwt.SignOptions['expiresIn'],
  });

  const refreshToken = jwt.sign(payload, refreshSecret(), {
    expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN ?? '30d') as jwt.SignOptions['expiresIn'],
  });

  return { accessToken, refreshToken };
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function refreshTokenExpiry(token: string): Date {
  const decoded = jwt.decode(token) as { exp?: number } | null;
  if (!decoded?.exp) throw new UnauthorisedError('Invalid refresh token');
  return new Date(decoded.exp * 1000);
}

export async function register(email: string, password: string): Promise<AuthTokens> {
  const existing = await findUserByEmail(email);
  if (existing) throw new ValidationError('Email already in use');

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const user = await createUser(email, passwordHash);

  return issueTokens(user.id, user.email);
}

export async function login(email: string, password: string): Promise<AuthTokens> {
  const user = await findUserByEmail(email);
  if (!user) throw new UnauthorisedError('Invalid email or password');

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) throw new UnauthorisedError('Invalid email or password');

  return issueTokens(user.id, user.email);
}

export async function logout(refreshToken: string): Promise<void> {
  const tokenHash = hashToken(refreshToken);
  const expiresAt = refreshTokenExpiry(refreshToken);
  await blacklistToken(tokenHash, expiresAt);
}

export async function refresh(refreshToken: string): Promise<AuthTokens> {
  let payload: JwtPayload;
  try {
    payload = jwt.verify(refreshToken, refreshSecret()) as JwtPayload;
  } catch {
    throw new UnauthorisedError('Invalid or expired refresh token');
  }

  const tokenHash = hashToken(refreshToken);
  if (await isTokenBlacklisted(tokenHash)) {
    throw new UnauthorisedError('Refresh token has been revoked');
  }

  // Blacklist the used refresh token (rotation)
  const expiresAt = refreshTokenExpiry(refreshToken);
  await blacklistToken(tokenHash, expiresAt);

  return issueTokens(payload.sub, payload.email);
}

export async function getMe(userId: string): Promise<AuthUser> {
  const user = await findUserById(userId);
  if (!user) throw new UnauthorisedError('User not found');
  return { id: user.id, email: user.email, displayName: user.display_name };
}

export function verifyAccessToken(token: string): JwtPayload {
  try {
    return jwt.verify(token, accessSecret()) as JwtPayload;
  } catch {
    throw new UnauthorisedError('Invalid or expired access token');
  }
}
