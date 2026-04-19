import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import * as Keychain from 'react-native-keychain';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:3000';

export const apiClient: AxiosInstance = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
});

// Attach access token to every request
apiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const creds = await Keychain.getGenericPassword({ service: 'accessToken' });
  if (creds) {
    config.headers.Authorization = `Bearer ${creds.password}`;
  }
  return config;
});

// On 401, attempt a silent token refresh then retry once
let isRefreshing = false;
let pendingQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = [];

function flushQueue(token: string | null, err: unknown = null) {
  pendingQueue.forEach(({ resolve, reject }) => (token ? resolve(token) : reject(err)));
  pendingQueue = [];
}

apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status !== 401 || original._retried) {
      return Promise.reject(error);
    }
    original._retried = true;

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push({
          resolve: (token) => {
            original.headers.Authorization = `Bearer ${token}`;
            resolve(apiClient(original));
          },
          reject,
        });
      });
    }

    isRefreshing = true;
    try {
      const refreshCreds = await Keychain.getGenericPassword({ service: 'refreshToken' });
      if (!refreshCreds) throw new Error('No refresh token');

      const { data } = await axios.post(`${API_BASE_URL}/api/v1/auth/refresh`, {
        refreshToken: refreshCreds.password,
      });

      const { accessToken, refreshToken } = data.data;
      await Keychain.setGenericPassword('token', accessToken, { service: 'accessToken' });
      await Keychain.setGenericPassword('token', refreshToken, { service: 'refreshToken' });

      original.headers.Authorization = `Bearer ${accessToken}`;
      flushQueue(accessToken);
      return apiClient(original);
    } catch (err) {
      flushQueue(null, err);
      return Promise.reject(err);
    } finally {
      isRefreshing = false;
    }
  },
);
