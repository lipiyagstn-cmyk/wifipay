import axios from 'axios';

const baseURL = process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/+$/, '');

export const api = axios.create({
  baseURL,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

let accessToken: string | null = null;

api.interceptors.request.use((config) => {
  if (!baseURL) {
    throw new Error('Konfigurasi EXPO_PUBLIC_API_URL belum diatur.');
  }

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

export function setApiAccessToken(token: string | null): void {
  accessToken = token;
}

export function resolveApiResourceUri(value: string | null | undefined): string | null {
  if (!value) return null;
  if (/^(https?:|file:|content:|data:)/i.test(value)) return value;
  if (!baseURL) return value;

  try {
    const apiUrl = new URL(baseURL);
    const appPath = apiUrl.pathname.replace(/\/api(?:\/v\d+)?\/?$/i, '').replace(/\/+$/, '');
    return `${apiUrl.origin}${appPath}/${value.replace(/^\/+/, '')}`;
  } catch {
    return value;
  }
}

export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const responseData: unknown = error.response?.data;
    const message =
      typeof responseData === 'object' && responseData !== null && 'message' in responseData
        ? responseData.message
        : undefined;

    if (typeof message === 'string') {
      return message;
    }

    if (error.response) {
      return `Permintaan API gagal (HTTP ${error.response.status}).`;
    }

    return 'Tidak dapat terhubung ke server Laravel.';
  }

  return error instanceof Error
    ? error.message
    : 'Terjadi kesalahan saat menghubungi backend.';
}
