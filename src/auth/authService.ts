import { api, setApiAccessToken } from '../api';
import { clearCachedData } from '../clearCachedData';

export type UserRole = 'admin' | 'pegawai' | 'pelanggan';

export type AuthenticatedUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  customerId: string | null;
  phone: string;
  position: string;
  area: string;
};

type LoginResponse = {
  token?: unknown;
  access_token?: unknown;
  accessToken?: unknown;
  user?: {
    id?: string | number;
    name?: string;
    email?: string;
    role?: unknown;
    role_name?: unknown;
    user_type?: unknown;
    roles?: unknown;
    customer_id?: string | number | null;
    customerId?: string | number | null;
    phone?: string;
    position?: string;
    area?: string;
  };
  data?: LoginResponse;
};

let currentUser: AuthenticatedUser | null = null;

function isUserRole(value: unknown): value is UserRole {
  return value === 'admin' || value === 'pegawai' || value === 'pelanggan';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function normalizeRole(value: unknown): UserRole | null {
  const roleName = typeof value === 'string'
    ? value
    : isRecord(value)
      ? 'name' in value
        ? value.name
        : 'slug' in value
          ? value.slug
          : 'role_name' in value
            ? value.role_name
            : null
      : null;

  if (typeof roleName !== 'string') return null;

  const normalized = roleName.trim().toLowerCase().replace(/[\s_-]+/g, '');
  if (normalized === 'admin' || normalized === 'administrator') return 'admin';
  if (normalized === 'pegawai' || normalized === 'employee' || normalized === 'staff') return 'pegawai';
  if (normalized === 'pelanggan' || normalized === 'customer' || normalized === 'client') return 'pelanggan';
  return null;
}

function getAccessToken(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (isRecord(value)) {
    for (const key of ['plainTextToken', 'access_token', 'accessToken']) {
      if (key in value && typeof value[key] === 'string' && value[key].trim()) {
        return value[key].trim();
      }
    }
  }
  return null;
}

export async function login(identifier: string, password: string): Promise<AuthenticatedUser> {
  currentUser = null;
  setApiAccessToken(null);
  clearCachedData();
  const response = await api.post<LoginResponse>('/auth/login', {
    email: identifier.trim(),
    password,
  });
  let result: LoginResponse = response.data;

  while (result.data) {
    result = result.data;
  }

  const user = result.user;
  const roleCandidates = [
    user?.role,
    user?.role_name,
    user?.user_type,
    ...(Array.isArray(user?.roles) ? user.roles : []),
  ];
  const role = roleCandidates.map(normalizeRole).find((candidate) => candidate !== null);
  const token = getAccessToken(result.access_token)
    ?? getAccessToken(result.accessToken)
    ?? getAccessToken(result.token);
  if (
    !token ||
    !user ||
    (typeof user.id !== 'string' && typeof user.id !== 'number') ||
    !isUserRole(role)
  ) {
    throw new Error(
      'Respons login Laravel tidak sesuai. Pastikan POST /login mengembalikan token dan user berisi id serta role (admin, pegawai, atau pelanggan).',
    );
  }

  setApiAccessToken(token);
  currentUser = {
    id: String(user.id),
    name: user.name ?? '',
    email: user.email ?? identifier.trim(),
    role,
    customerId: user.customer_id == null && user.customerId == null
      ? null
      : String(user.customer_id ?? user.customerId),
    phone: user.phone ?? '',
    position: user.position ?? '',
    area: user.area ?? '',
  };
  return currentUser;
}

export function getCurrentUser(): AuthenticatedUser | null {
  return currentUser;
}

export function getCurrentCustomerId(): string | null {
  if (!currentUser) return null;
  return currentUser.customerId ?? (currentUser.role === 'pelanggan' ? currentUser.id : null);
}

export function updateCurrentUser(updates: Partial<AuthenticatedUser>): void {
  if (currentUser) currentUser = { ...currentUser, ...updates };
}

export function logout(): void {
  currentUser = null;
  setApiAccessToken(null);
  clearCachedData();
}
