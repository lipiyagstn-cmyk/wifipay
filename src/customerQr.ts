import type { Customer } from './customerStore';

export type CustomerAddressQrPayload = {
  app: 'WiFiPay';
  type: 'customer-address';
  version: 1;
  customerId: string;
  name: string;
  address: string;
  package?: string;
  status?: Customer['status'];
};

export function createCustomerAddressQr(customer: Customer): string {
  const payload: CustomerAddressQrPayload = {
    app: 'WiFiPay',
    type: 'customer-address',
    version: 1,
    customerId: customer.id,
    name: customer.name,
    address: customer.address,
    package: customer.package,
    status: customer.status,
  };
  return JSON.stringify(payload);
}

export function parseCustomerAddressQr(value: string): CustomerAddressQrPayload | null {
  try {
    const payload: unknown = JSON.parse(value);
    if (
      typeof payload !== 'object' ||
      payload === null ||
      !('app' in payload) ||
      payload.app !== 'WiFiPay' ||
      !('type' in payload) ||
      payload.type !== 'customer-address' ||
      !('version' in payload) ||
      payload.version !== 1 ||
      !('customerId' in payload) ||
      typeof payload.customerId !== 'string' ||
      !/^WFP-\d{6}$/.test(payload.customerId) ||
      !('name' in payload) ||
      typeof payload.name !== 'string' ||
      !payload.name.trim() ||
      !('address' in payload) ||
      typeof payload.address !== 'string' ||
      !payload.address.trim() ||
      ('package' in payload &&
        (typeof payload.package !== 'string' || !payload.package.trim())) ||
      ('status' in payload &&
        payload.status !== 'Aktif' &&
        payload.status !== 'Menunggu')
    ) {
      return null;
    }

    const packageName =
      'package' in payload && typeof payload.package === 'string'
        ? payload.package
        : undefined;
    const status =
      'status' in payload &&
      (payload.status === 'Aktif' || payload.status === 'Menunggu')
        ? payload.status
        : undefined;

    return {
      app: 'WiFiPay',
      type: 'customer-address',
      version: 1,
      customerId: payload.customerId,
      name: payload.name,
      address: payload.address,
      ...(packageName !== undefined ? { package: packageName } : {}),
      ...(status !== undefined ? { status } : {}),
    };
  } catch {
    return null;
  }
}
