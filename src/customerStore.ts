export type Customer = {
  id: string;
  name: string;
  status: 'Aktif' | 'Menunggu';
  package: string;
  address: string;
  homePhotoUri: string | null;
};

let customers: Customer[] = [
  {
    id: 'WFP-008241',
    name: 'Budi Santoso',
    status: 'Aktif',
    package: '20 Mbps',
    address: 'Jl. Cikutra Baru No. 18, Cibeunying, Bandung',
    homePhotoUri: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=700&q=80',
  },
  {
    id: 'WFP-007936',
    name: 'Dewi Ayu',
    status: 'Aktif',
    package: '30 Mbps',
    address: 'Jl. Ir. H. Juanda No. 42, Dago, Bandung',
    homePhotoUri: 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=700&q=80',
  },
  {
    id: 'WFP-006518',
    name: 'Arman Hidayat',
    status: 'Menunggu',
    package: '10 Mbps',
    address: 'Jl. Terusan Jakarta No. 105, Antapani, Bandung',
    homePhotoUri: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=700&q=80',
  },
];

const listeners = new Set<() => void>();

function notifyCustomerChange(): void {
  listeners.forEach((listener) => listener());
}

export function getCustomers(): Customer[] {
  return customers;
}

export function subscribeToCustomers(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function updateCustomerHomePhoto(customerId: string, homePhotoUri: string): void {
  customers = customers.map((customer) =>
    customer.id === customerId ? { ...customer, homePhotoUri } : customer,
  );
  notifyCustomerChange();
}

export function createCustomer(
  customer: Omit<Customer, 'id' | 'homePhotoUri'>,
): Customer {
  const maxId = customers.reduce((maximum, item) => {
    const suffix = Number(item.id.replace('WFP-', ''));
    return Number.isSafeInteger(suffix) ? Math.max(maximum, suffix) : maximum;
  }, 0);
  const createdCustomer: Customer = {
    ...customer,
    id: `WFP-${String(maxId + 1).padStart(6, '0')}`,
    homePhotoUri: null,
  };
  customers = [createdCustomer, ...customers];
  notifyCustomerChange();
  return createdCustomer;
}

export function updateCustomer(customerId: string, updates: Omit<Customer, 'id'>): void {
  if (!customers.some((customer) => customer.id === customerId)) return;
  customers = customers.map((customer) =>
    customer.id === customerId ? { ...customer, ...updates, id: customerId } : customer,
  );
  notifyCustomerChange();
}

export function deleteCustomer(customerId: string): void {
  if (!customers.some((customer) => customer.id === customerId)) return;
  customers = customers.filter((customer) => customer.id !== customerId);
  notifyCustomerChange();
}
