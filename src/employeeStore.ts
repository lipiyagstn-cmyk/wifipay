export type Employee = {
  id: string;
  name: string;
  position: string;
  area: string;
  status: 'Aktif' | 'Nonaktif';
};

let employees: Employee[] = [
  { id: 'PGW-001', name: 'Andi Pratama', position: 'Teknisi jaringan', area: 'Cibeunying · Bandung', status: 'Aktif' },
  { id: 'PGW-002', name: 'Siti Rahmawati', position: 'Customer service', area: 'Dago · Bandung', status: 'Aktif' },
  { id: 'PGW-003', name: 'Rizky Maulana', position: 'Teknisi instalasi', area: 'Antapani · Bandung', status: 'Aktif' },
];

const listeners = new Set<() => void>();

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

export function createEmployee(employee: Omit<Employee, 'id'>): Employee {
  const maxId = employees.reduce((maximum, item) => {
    const suffix = Number(item.id.replace('PGW-', ''));
    return Number.isSafeInteger(suffix) ? Math.max(maximum, suffix) : maximum;
  }, 0);
  const createdEmployee = {
    ...employee,
    id: `PGW-${String(maxId + 1).padStart(3, '0')}`,
  };
  employees = [createdEmployee, ...employees];
  notifyEmployeeChange();
  return createdEmployee;
}

export function updateEmployee(employeeId: string, updates: Omit<Employee, 'id'>): void {
  if (!employees.some((employee) => employee.id === employeeId)) return;
  employees = employees.map((employee) =>
    employee.id === employeeId ? { ...employee, ...updates, id: employeeId } : employee,
  );
  notifyEmployeeChange();
}

export function deleteEmployee(employeeId: string): void {
  if (!employees.some((employee) => employee.id === employeeId)) return;
  employees = employees.filter((employee) => employee.id !== employeeId);
  notifyEmployeeChange();
}
