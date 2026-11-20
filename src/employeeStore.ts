import { api } from './services/api';

export type Employee = {
  id: string;
  name: string;
  position: string;
  area: string;
  status: 'Aktif' | 'Nonaktif' | 'Tidak diketahui';
};

type EmployeeInput = Omit<Employee, 'id' | 'status'> & {
  status: 'Aktif' | 'Nonaktif';
  email?: string;
  password?: string;
  phone?: string;
  address?: string;
};

let employees: Employee[] = [];
const listeners = new Set<() => void>();

function unwrapData(value: unknown): unknown {
  if (typeof value === 'object' && value !== null && 'data' in value) {
    return value.data;
  }
  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getNestedEmployee(data: Record<string, unknown>): Record<string, unknown> {
  for (const key of ['employee', 'pegawai', 'staff', 'profile', 'user']) {
    if (isRecord(data[key])) return data[key];
  }
  return data;
}

function normalizeEmployee(value: unknown): Employee {
  if (!isRecord(value)) {
    throw new Error('Format data pegawai dari backend tidak valid.');
  }
  const nested = getNestedEmployee(value);
  const id = nested.id ?? value.id ?? nested.user_id;
  const name = nested.name ?? nested.nama ?? value.name ?? value.nama;
  const position = nested.position ?? nested.job_title ?? nested.jabatan ?? nested.posisi;
  const area = nested.area ?? nested.service_area ?? nested.wilayah;
  const rawStatus = nested.status ?? value.status ?? nested.is_active ?? value.is_active;
  const normalizedStatus = typeof rawStatus === 'string'
    ? rawStatus.trim().toLowerCase()
    : typeof rawStatus === 'boolean'
      ? rawStatus ? 'active' : 'inactive'
      : rawStatus === 1
        ? 'active'
        : rawStatus === 0
          ? 'inactive'
          : null;

  if (
    (typeof id !== 'string' && typeof id !== 'number') ||
    typeof name !== 'string'
  ) {
    throw new Error('Data pegawai dari backend harus memiliki ID dan nama.');
  }

  return {
    id: String(id),
    name,
    position: typeof position === 'string' && position.trim() ? position : 'Belum diatur',
    area: typeof area === 'string' && area.trim() ? area : 'Belum diatur',
    status: normalizedStatus === 'nonaktif' || normalizedStatus === 'inactive' || normalizedStatus === 'disabled'
      ? 'Nonaktif'
      : normalizedStatus === 'aktif' || normalizedStatus === 'active' || normalizedStatus === 'enabled'
        ? 'Aktif'
        : 'Tidak diketahui',
  };
}

function findUsers(value: unknown): unknown[] | null {
  if (Array.isArray(value)) return value;
  if (!isRecord(value)) return null;
  for (const key of ['employees', 'pegawai', 'staff', 'users', 'pengguna']) {
    if (Array.isArray(value[key])) return value[key];
  }
  return findUsers(value.data);
}

function notifyEmployeeChange(): void {
  listeners.forEach((listener) => listener());
}

export function getEmployees(): Employee[] {
  return employees;
}

export function subscribeToEmployees(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function clearEmployees(): void {
  employees = [];
  notifyEmployeeChange();
}

export async function loadEmployees(): Promise<void> {
  const response = await api.get<unknown>('/admin/employees');
  const data = findUsers(response.data);
  if (!data) {
    throw new Error('Format daftar pegawai dari backend tidak valid.');
  }
  employees = data.map(normalizeEmployee);
  notifyEmployeeChange();
}

export async function createEmployee(employee: EmployeeInput): Promise<Employee> {
  const response = await api.post<unknown>('/admin/users', {
    name: employee.name,
    email: employee.email,
    password: employee.password,
    no_hp: employee.phone,
    alamat: employee.address,
    position: employee.position,
    area: employee.area,
    status: employee.status === 'Aktif' ? 'aktif' : 'nonaktif',
    role: 'pegawai',
  });
  const createdEmployee = normalizeEmployee(unwrapData(response.data));
  employees = [createdEmployee, ...employees.filter((item) => item.id !== createdEmployee.id)];
  notifyEmployeeChange();
  return createdEmployee;
}

export async function updateEmployee(employeeId: string, updates: EmployeeInput): Promise<void> {
  const response = await api.patch<unknown>(`/admin/users/${encodeURIComponent(employeeId)}`, {
    name: updates.name,
    position: updates.position,
    area: updates.area,
    status: updates.status === 'Aktif' ? 'aktif' : 'nonaktif',
  });
  const data = unwrapData(response.data);
  const updatedEmployee = data === undefined || data === null
    ? { id: employeeId, ...updates }
    : normalizeEmployee(data);
  employees = employees.map((employee) =>
    employee.id === employeeId ? updatedEmployee : employee,
  );
  notifyEmployeeChange();
}

export async function deleteEmployee(employeeId: string): Promise<void> {
  await api.delete(`/admin/users/${encodeURIComponent(employeeId)}`);
  employees = employees.filter((employee) => employee.id !== employeeId);
  notifyEmployeeChange();
}
