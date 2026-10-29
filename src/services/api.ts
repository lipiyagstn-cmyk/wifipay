type ApiResponse<T> = {
  data: T;
};

function getErrorMessage(data: unknown, status: number): string {
  if (
    typeof data === 'object' &&
    data !== null &&
    'message' in data &&
    typeof data.message === 'string'
  ) {
    return data.message;
  }

  return `Permintaan API gagal (HTTP ${status}).`;
}

export const api = {
  async get<T>(path: string): Promise<ApiResponse<T>> {
    const baseUrl = process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/+$/, '');
    if (!baseUrl) {
      throw new Error('Konfigurasi EXPO_PUBLIC_API_URL belum diatur.');
    }

    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const response = await fetch(`${baseUrl}${normalizedPath}`);
    const data: unknown = await response.json();

    if (!response.ok) {
      throw new Error(getErrorMessage(data, response.status));
    }

    return { data: data as T };
  },
};
