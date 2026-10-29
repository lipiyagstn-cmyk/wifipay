export type FinanceTransactionType = 'Pemasukan' | 'Pengeluaran';

export type FinanceTransaction = {
  id: string;
  description: string;
  category: string;
  amount: number;
  type: FinanceTransactionType;
  date: string;
};

let transactions: FinanceTransaction[] = [];
let nextTransactionId = 1;
const listeners = new Set<() => void>();

export function getFinanceTransactions(): FinanceTransaction[] {
  return transactions;
}

export function subscribeToFinanceTransactions(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function saveFinanceTransaction(
  transaction: Omit<FinanceTransaction, 'id' | 'date'> & { id?: string },
): void {
  const savedTransaction: FinanceTransaction = {
    ...transaction,
    id: transaction.id ?? `FIN-${nextTransactionId++}`,
    date: transaction.id
      ? transactions.find((item) => item.id === transaction.id)?.date ?? new Date().toISOString()
      : new Date().toISOString(),
  };

  const existingIndex = transactions.findIndex((item) => item.id === savedTransaction.id);
  if (existingIndex < 0) {
    transactions = [savedTransaction, ...transactions];
  } else {
    transactions = transactions.map((item) =>
      item.id === savedTransaction.id ? savedTransaction : item,
    );
  }

  listeners.forEach((listener) => listener());
}

export function deleteFinanceTransaction(transactionId: string): void {
  if (!transactions.some((transaction) => transaction.id === transactionId)) {
    return;
  }

  transactions = transactions.filter((transaction) => transaction.id !== transactionId);
  listeners.forEach((listener) => listener());
}
