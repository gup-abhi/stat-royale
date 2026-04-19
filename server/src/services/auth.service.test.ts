jest.mock('../models/user.model');
jest.mock('../utils/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

import bcrypt from 'bcrypt';
import * as userModel from '../models/user.model';
import { register, login, logout, refresh } from './auth.service';
import { ValidationError, UnauthorisedError } from '../utils/supercell-errors';

const model = userModel as jest.Mocked<typeof userModel>;

const mockUser = {
  id: 'user-uuid',
  email: 'test@example.com',
  password_hash: '',
  display_name: null,
  fcm_token: null,
  created_at: new Date(),
  updated_at: new Date(),
};

beforeAll(async () => {
  mockUser.password_hash = await bcrypt.hash('Password1!', 1);
});

beforeEach(() => jest.clearAllMocks());

describe('register', () => {
  it('returns tokens on success', async () => {
    model.findUserByEmail.mockResolvedValue(null);
    model.createUser.mockResolvedValue(mockUser);

    const tokens = await register('test@example.com', 'Password1!');
    expect(tokens).toHaveProperty('accessToken');
    expect(tokens).toHaveProperty('refreshToken');
  });

  it('throws ValidationError if email already in use', async () => {
    model.findUserByEmail.mockResolvedValue(mockUser);
    await expect(register('test@example.com', 'Password1!')).rejects.toThrow(ValidationError);
  });
});

describe('login', () => {
  it('returns tokens with correct credentials', async () => {
    model.findUserByEmail.mockResolvedValue(mockUser);

    const tokens = await login('test@example.com', 'Password1!');
    expect(tokens).toHaveProperty('accessToken');
    expect(tokens).toHaveProperty('refreshToken');
  });

  it('throws UnauthorisedError for unknown email', async () => {
    model.findUserByEmail.mockResolvedValue(null);
    await expect(login('x@x.com', 'pass')).rejects.toThrow(UnauthorisedError);
  });

  it('throws UnauthorisedError for wrong password', async () => {
    model.findUserByEmail.mockResolvedValue(mockUser);
    await expect(login('test@example.com', 'WrongPass!')).rejects.toThrow(UnauthorisedError);
  });
});

describe('logout', () => {
  it('blacklists the refresh token', async () => {
    model.blacklistToken.mockResolvedValue(undefined);

    // Get a real refresh token first
    model.findUserByEmail.mockResolvedValue(mockUser);
    const { refreshToken } = await login('test@example.com', 'Password1!');

    await logout(refreshToken);
    expect(model.blacklistToken).toHaveBeenCalledTimes(1);
  });
});

describe('refresh', () => {
  it('returns new tokens for a valid non-blacklisted refresh token', async () => {
    model.findUserByEmail.mockResolvedValue(mockUser);
    const { refreshToken } = await login('test@example.com', 'Password1!');

    model.isTokenBlacklisted.mockResolvedValue(false);
    model.blacklistToken.mockResolvedValue(undefined);

    const tokens = await refresh(refreshToken);
    expect(tokens).toHaveProperty('accessToken');
    expect(tokens).toHaveProperty('refreshToken');
    expect(model.blacklistToken).toHaveBeenCalledTimes(1);
  });

  it('throws UnauthorisedError for blacklisted token', async () => {
    model.findUserByEmail.mockResolvedValue(mockUser);
    const { refreshToken } = await login('test@example.com', 'Password1!');

    model.isTokenBlacklisted.mockResolvedValue(true);

    await expect(refresh(refreshToken)).rejects.toThrow(UnauthorisedError);
  });

  it('throws UnauthorisedError for an invalid token string', async () => {
    await expect(refresh('not.a.token')).rejects.toThrow(UnauthorisedError);
  });
});
