import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCurrentUser } from './auth/authService';

export type FinanceTransactionType = 'Pemasukan' | 'Pengeluaran';

export type FinanceTransaction = {
  id: string;
  description: string;
  category: string;
  amount: number;
  type: FinanceTransactionType;
  date: string;
};

type FinanceInput = Omit<FinanceTransaction, 'id' | 'date'>;
type FinanceUser = { id: string };

const emptyTransactions: FinanceTransaction[] = [];
const transactionsByUser = new Map<string, FinanceTransaction[]>();
const loadingByUser = new Map<string, Promise<void>>();
const listeners = new Set<() => void>();
let mutationQueue: Promise<void> = Promise.resolve();

function notifyListeners(): void {
  listeners.forEach((listener) => listener());
}

function requireAdmin(): FinanceUser {
  const user = getCurrentUser();
  if (!user || user.role !== 'admin') {
    throw new Error('Pencatatan keuangan hanya tersedia untuk akun admin.');
  }
  return { id: user.id };
}

function storageKey(userId: string): string {
  return `finance-transactions:${encodeURIComponent(userId)}`;
}

function isFinanceTransaction(value: unknown): value is FinanceTransaction {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const transaction = value as Record<string, unknown>;
  return typeof transaction.id === 'string' &&
    typeof transaction.description === 'string' &&
    typeof transaction.category === 'string' &&
    typeof transaction.amount === 'number' &&
    Number.isSafeInteger(transaction.amount) &&
    transaction.amount > 0 &&
    (transaction.type === 'Pemasukan' || transaction.type === 'Pengeluaran') &&
    typeof transaction.date === 'string';
}

async function loadForUser(userId: string): Promise<void> {
  if (transactionsByUser.has(userId)) return;
  const existingLoad = loadingByUser.get(userId);
  if (existingLoad) return existingLoad;

  const load = (async () => {
    const stored = await AsyncStorage.getItem(storageKey(userId));
    let parsed: unknown = [];
    if (stored !== null) {
      try {
        parsed = JSON.parse(stored);
      } catch {
        throw new Error('Data transaksi lokal rusak dan tidak dapat dibaca.');
      }
    }
    if (!Array.isArray(parsed) || !parsed.every(isFinanceTransaction)) {
      throw new Error('Format data transaksi lokal tidak valid.');
    }

    const currentUser = getCurrentUser();
    if (currentUser?.id === userId && currentUser.role === 'admin') {
      transactionsByUser.set(userId, parsed);
      notifyListeners();
    }
  })();

  loadingByUser.set(userId, load);
  try {
    await load;
  } finally {
    loadingByUser.delete(userId);
  }
}

export function getFinanceTransactions(): FinanceTransaction[] {
  const user = getCurrentUser();
  return user?.role === 'admin'
    ? transactionsByUser.get(user.id) ?? emptyTransactions
    : emptyTransactions;
}

export function subscribeToFinanceTransactions(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function clearFinanceTransactions(): void {
  transactionsByUser.clear();
  notifyListeners();
}

export async function loadFinanceTransactions(): Promise<void> {
  const user = requireAdmin();
  await loadForUser(user.id);
}

function updateTransactions(
  update: (current: FinanceTransaction[]) => FinanceTransaction[],
): Promise<void> {
  const user = requireAdmin();
  const operation = mutationQueue.then(async () => {
    await loadForUser(user.id);
    const currentUser = getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin' || currentUser.id !== user.id) {
      throw new Error('Sesi admin berubah. Silakan coba kembali.');
    }

    const next = update(transactionsByUser.get(user.id) ?? emptyTransactions);
    await AsyncStorage.setItem(storageKey(user.id), JSON.stringify(next));
    transactionsByUser.set(user.id, next);
    notifyListeners();
  });
  mutationQueue = operation.then(() => undefined, () => undefined);
  return operation;
}

export function saveFinanceTransaction(
  transaction: FinanceInput & { id?: string },
): Promise<void> {
  if (!transaction.description.trim() || !transaction.category.trim()) {
    return Promise.reject(new Error('Keterangan dan kategori transaksi wajib diisi.'));
  }
  if (!Number.isSafeInteger(transaction.amount) || transaction.amount <= 0) {
    return Promise.reject(new Error('Jumlah transaksi harus berupa angka rupiah yang lebih besar dari nol.'));
  }

  return updateTransactions((current) => {
    const id = transaction.id ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    if (transaction.id && !current.some((item) => item.id === transaction.id)) {
      throw new Error('Transaksi yang akan diubah tidak ditemukan.');
    }
    const saved: FinanceTransaction = {
      id,
      description: transaction.description.trim(),
      category: transaction.category.trim(),
      amount: transaction.amount,
      type: transaction.type,
      date: transaction.id
        ? current.find((item) => item.id === transaction.id)?.date ?? new Date().toISOString()
        : new Date().toISOString(),
    };
    return transaction.id
      ? current.map((item) => item.id === transaction.id ? saved : item)
      : [saved, ...current];
  });
}

export function deleteFinanceTransaction(transactionId: string): Promise<void> {
  return updateTransactions((current) => {
    const next = current.filter((item) => item.id !== transactionId);
    if (next.length === current.length) {
      throw new Error('Transaksi yang akan dihapus tidak ditemukan.');
    }
    return next;
  });
}
