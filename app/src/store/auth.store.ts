import { create } from 'zustand';
import * as Keychain from 'react-native-keychain';
import { AuthUser } from '../../../shared/types';
import { loginApi, registerApi, logoutApi } from '../api/auth.api';

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  isLoading: true,

  login: async (email, password) => {
    const tokens = await loginApi(email, password);
    await Keychain.setGenericPassword('token', tokens.accessToken, { service: 'accessToken' });
    await Keychain.setGenericPassword('token', tokens.refreshToken, { service: 'refreshToken' });
    set({ accessToken: tokens.accessToken });
  },

  register: async (email, password) => {
    const tokens = await registerApi(email, password);
    await Keychain.setGenericPassword('token', tokens.accessToken, { service: 'accessToken' });
    await Keychain.setGenericPassword('token', tokens.refreshToken, { service: 'refreshToken' });
    set({ accessToken: tokens.accessToken });
  },

  logout: async () => {
    const refreshCreds = await Keychain.getGenericPassword({ service: 'refreshToken' });
    if (refreshCreds) {
      await logoutApi(refreshCreds.password).catch(() => {});
    }
    await Keychain.resetGenericPassword({ service: 'accessToken' });
    await Keychain.resetGenericPassword({ service: 'refreshToken' });
    set({ user: null, accessToken: null });
  },

  restoreSession: async () => {
    try {
      const creds = await Keychain.getGenericPassword({ service: 'accessToken' });
      if (creds) {
        set({ accessToken: creds.password });
      }
    } finally {
      set({ isLoading: false });
    }
  },
}));
