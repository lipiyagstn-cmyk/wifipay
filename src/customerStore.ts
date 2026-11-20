import { api, resolveApiResourceUri } from './services/api';
import { getCurrentUser, updateCurrentUser } from './auth/authService';

export type Customer = {
  id: string;
  name: string;
  status: 'Aktif' | 'Nonaktif' | 'Menunggu';
  package: string;
  address: string;
  homePhotoUri: string | null;
  dueDay: string | null;
  phone?: string | null;
};

type CustomerInput = Omit<Customer, 'id' | 'homePhotoUri' | 'dueDay'> & {
  dueDay?: string | null;
};
type CustomerUpdate = Omit<Customer, 'id'>;

let customers: Customer[] = [];
const listeners = new Set<() => void>();

function unwrapData(value: unknown): unknown {
  if (typeof value === 'object' && value !== null && 'data' in value) {
    return value.data;
  }
  return value;
}

function getString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function findCustomerList(value: unknown, depth = 0): unknown[] | null {
  if (Array.isArray(value)) return value;
  if (depth >= 4 || typeof value !== 'object' || value === null) return null;
  const record = value as Record<string, unknown>;
  for (const key of ['customers', 'pelanggan', 'items', 'data']) {
    if (Array.isArray(record[key])) return record[key] as unknown[];
    const nested = findCustomerList(record[key], depth + 1);
    if (nested) return nested;
  }
  return null;
}

function getCustomerRecords(value: unknown): {
  customer: Record<string, unknown>;
  user: Record<string, unknown> | null;
} | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const nested = record.customer ?? record.pelanggan ?? record.client;
  const customer = typeof nested === 'object' && nested !== null && !Array.isArray(nested)
    ? nested as Record<string, unknown>
    : record;
  const nestedUser = customer.user ?? record.user;
  const user = typeof nestedUser === 'object' && nestedUser !== null && !Array.isArray(nestedUser)
    ? nestedUser as Record<string, unknown>
    : null;
  return { customer, user };
}

function normalizedIdentity(value: unknown): string | null {
  return typeof value === 'string' && value.trim()
    ? value.trim().toLocaleLowerCase()
    : null;
}

function excludeAdminAccounts(records: unknown[]): unknown[] {
  const adminNames = new Set<string>();
  const adminEmails = new Set<string>();

  records.forEach((value) => {
    const records = getCustomerRecords(value);
    if (!records || normalizedIdentity(records.user?.role) !== 'admin') return;
    const name = normalizedIdentity(records.user?.name ?? records.user?.nama ??
      records.customer.name ?? records.customer.nama);
    const email = normalizedIdentity(records.user?.email ?? records.customer.email);
    if (name) adminNames.add(name);
    if (email) adminEmails.add(email);
  });

  return records.filter((value) => {
    const records = getCustomerRecords(value);
    if (!records) return true;
    if (normalizedIdentity(records.user?.role) === 'admin') return false;
    if (records.user) return true;

    const name = normalizedIdentity(records.customer.name ?? records.customer.nama);
    const email = normalizedIdentity(records.customer.email);
    return !(name && adminNames.has(name)) && !(email && adminEmails.has(email));
  });
}

function normalizeCustomer(value: unknown): Customer {
  if (typeof value !== 'object' || value === null) {
    throw new Error('Format data pelanggan dari backend tidak valid.');
  }
  const response = value as Record<string, unknown>;
  const unwrapped = unwrapData(response);
  const data = typeof unwrapped === 'object' && unwrapped !== null
    ? unwrapped as Record<string, unknown>
    : response;
  const customerValue = data.customer ?? data.pelanggan ?? data.client;
  const customer = typeof customerValue === 'object' && customerValue !== null
    ? customerValue as Record<string, unknown>
    : data;
  const id = customer.id ?? customer.customer_id ?? customer.pelanggan_id ?? data.id;
  const customerId = id;
  const rawStatus = customer.status ?? customer.status_pelanggan ?? customer.is_active;
  const status = typeof rawStatus === 'string'
    ? rawStatus.trim().toLowerCase()
    : typeof rawStatus === 'boolean'
      ? rawStatus ? 'active' : 'inactive'
      : rawStatus === 1
        ? 'active'
        : rawStatus === 0
          ? 'inactive'
          : undefined;
  const packageValue = customer.package ?? customer.package_name ?? customer.plan ??
    customer.paket ?? customer.internet_package;
  const packageName = typeof packageValue === 'string'
    ? packageValue
    : typeof packageValue === 'object' && packageValue !== null
      ? getString((packageValue as Record<string, unknown>).name) ??
        getString((packageValue as Record<string, unknown>).nama) ??
        getString((packageValue as Record<string, unknown>).package_name)
      : undefined;
  const address = customer.address ?? customer.installation_address ??
    customer.alamat ?? customer.alamat_pemasangan ?? customer.customer_address;
  const photo = customer.home_photo_uri ?? customer.homePhotoUri ??
    customer.photo_uri ?? customer.foto_rumah ?? customer.photo;
  const rawDueDay = customer.tagihan_jatuh_tempo ?? customer.due_day ??
    customer.dueDay ?? customer.due_date_day;
  const user = typeof customer.user === 'object' && customer.user !== null
    ? customer.user as Record<string, unknown>
    : {};
  const phone = customer.phone ?? customer.phone_number ?? customer.no_hp ??
    customer.telepon ?? user.phone ?? user.no_hp;
  const name = customer.name ?? customer.nama ?? customer.customer_name ??
    user.name ?? user.nama;

  if (
    (typeof customerId !== 'string' && typeof customerId !== 'number') ||
    typeof name !== 'string' ||
    (packageName !== undefined && typeof packageName !== 'string') ||
    (status !== 'aktif' && status !== 'active' && status !== 'menunggu' &&
      status !== 'pending' && status !== 'inactive' && status !== 'nonaktif')
  ) {
    throw new Error('Format data pelanggan dari backend tidak valid.');
  }

  return {
    id: String(customerId),
    name,
    status: status === 'menunggu' || status === 'pending'
      ? 'Menunggu'
      : status === 'nonaktif' || status === 'inactive'
        ? 'Nonaktif'
        : 'Aktif',
    package: packageName ?? '',
    address: typeof address === 'string' ? address : '',
    homePhotoUri: typeof photo === 'string' ? resolveApiResourceUri(photo) : null,
    dueDay: typeof rawDueDay === 'string' || typeof rawDueDay === 'number'
      ? String(rawDueDay)
      : null,
    phone: typeof phone === 'string' ? phone : null,
  };
}

function notifyCustomerChange(): void {
  listeners.forEach((listener) => listener());
}

export function getCustomers(): Customer[] {
  return customers;
}

export function getCustomer(customerId: string | null): Customer | null {
  return customerId ? customers.find((customer) => customer.id === customerId) ?? null : null;
}

export function subscribeToCustomers(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function clearCustomers(): void {
  customers = [];
  notifyCustomerChange();
}

export async function loadCustomers(): Promise<void> {
  const role = getCurrentUser()?.role;
  const path = role === 'admin'
    ? '/admin/customers'
    : role === 'pegawai'
      ? '/employee/customers'
      : null;
  if (!path) {
    throw new Error('Daftar pelanggan hanya tersedia untuk akun admin dan pegawai.');
  }
  const response = await api.get<unknown>(path);
  const data = findCustomerList(response.data);
  if (!data) {
    throw new Error('Format daftar pelanggan dari backend tidak valid.');
  }
  customers = excludeAdminAccounts(data).map(normalizeCustomer);
  notifyCustomerChange();
}

export async function loadCustomer(customerId: string): Promise<Customer> {
  const role = getCurrentUser()?.role;
  const path = role === 'pelanggan'
    ? '/customer/profile'
    : role === 'pegawai'
      ? `/employee/customers/${encodeURIComponent(customerId)}`
      : role === 'admin'
        ? `/admin/customers/${encodeURIComponent(customerId)}`
        : null;
  if (!path) {
    throw new Error('Akun belum terautentikasi untuk memuat data pelanggan.');
  }
  const response = await api.get<unknown>(path);
  const customer = normalizeCustomer(unwrapData(response.data));
  if (role === 'pelanggan') {
    const user = getCurrentUser();
    if (user && user.customerId !== customer.id) {
      updateCurrentUser({ customerId: customer.id });
    }
  }
  customers = [customer, ...customers.filter((item) => item.id !== customer.id)];
  notifyCustomerChange();
  return customer;
}

export async function updateCustomerHomePhoto(customerId: string, homePhotoUri: string): Promise<void> {
  void customerId;
  void homePhotoUri;
  throw new Error('Backend belum menyediakan endpoint API untuk menyimpan foto rumah pelanggan.');
}

export async function createCustomer(customer: CustomerInput): Promise<void> {
  if (getCurrentUser()?.role !== 'admin') {
    throw new Error('Hanya admin yang dapat menambah pelanggan.');
  }
  const response = await api.post<unknown>('/admin/customers', {
    nama: customer.name,
    alamat: customer.address,
    paket: customer.package,
    status: customer.status === 'Aktif' ? 'active' : 'pending',
    phone: customer.phone,
  });
  const data = unwrapData(response.data);
  if (typeof data === 'object' && data !== null && 'id' in data) {
    const createdCustomer = normalizeCustomer(data);
    customers = [createdCustomer, ...customers.filter((item) => item.id !== createdCustomer.id)];
    notifyCustomerChange();
    return;
  }
  await loadCustomers();
}

export type CustomerAccountInput = {
  name: string;
  email: string;
  password: string;
  phone: string;
  address: string;
  package: string;
  customPackage?: string;
  dueDay: string;
  status: 'Aktif' | 'Nonaktif';
  homePhotoUri?: string | null;
};

export async function createCustomerAccount(input: CustomerAccountInput): Promise<void> {
  if (getCurrentUser()?.role !== 'admin') {
    throw new Error('Hanya admin yang dapat menambah akun pelanggan.');
  }

  const body = new FormData();
  body.append('name', input.name);
  body.append('email', input.email);
  body.append('password', input.password);
  body.append('no_hp', input.phone);
  body.append('alamat', input.address);
  body.append('paket', input.customPackage?.trim() || input.package);
  body.append('tagihan_jatuh_tempo', input.dueDay);
  body.append('role', 'pelanggan');
  body.append('status', input.status === 'Aktif' ? 'aktif' : 'nonaktif');

  if (input.homePhotoUri) {
    const fileName = input.homePhotoUri.split('/').pop() || 'foto-rumah.jpg';
    const fileType = /\.(png)$/i.test(fileName) ? 'image/png' : 'image/jpeg';
    body.append('foto_rumah', {
      uri: input.homePhotoUri,
      name: fileName,
      type: fileType,
    } as unknown as Blob);
  }

  await api.post('/admin/users', body, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  await loadCustomers();
}

export async function updateCustomer(customerId: string, updates: CustomerUpdate): Promise<void> {
  if (getCurrentUser()?.role !== 'admin') {
    throw new Error('Hanya admin yang dapat mengubah data pelanggan.');
  }
  const path = `/admin/customers/${encodeURIComponent(customerId)}`;
  const body = {
    nama: updates.name,
    alamat: updates.address,
    paket: updates.package,
    status: updates.status === 'Aktif'
      ? 'active'
      : updates.status === 'Nonaktif'
        ? 'inactive'
        : 'pending',
    phone: updates.phone,
    tagihan_jatuh_tempo: updates.dueDay?.trim() || null,
  };
  const currentCustomer = customers.find((customer) => customer.id === customerId);
  const newHomePhotoUri = updates.homePhotoUri;
  const photoChanged = typeof newHomePhotoUri === 'string' &&
    newHomePhotoUri !== currentCustomer?.homePhotoUri;

  if (photoChanged) {
    const fileName = newHomePhotoUri.split('/').pop() || 'foto-rumah.jpg';
    const fileType = /\.(png)$/i.test(fileName) ? 'image/png' : 'image/jpeg';
    const formData = new FormData();
    Object.entries(body).forEach(([key, value]) => {
      formData.append(key, value == null ? '' : String(value));
    });
    formData.append('_method', 'PATCH');
    formData.append('foto_rumah', {
      uri: newHomePhotoUri,
      name: fileName,
      type: fileType,
    } as unknown as Blob);
    await api.post(path, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  } else {
    await api.patch(path, body);
  }
  await loadCustomers();
}

export async function deleteCustomer(customerId: string): Promise<void> {
  if (getCurrentUser()?.role !== 'admin') {
    throw new Error('Hanya admin yang dapat menghapus data pelanggan.');
  }
  await api.delete(`/admin/customers/${encodeURIComponent(customerId)}`);
  customers = customers.filter((customer) => customer.id !== customerId);
  notifyCustomerChange();
}
