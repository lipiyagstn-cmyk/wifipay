import React, { useMemo, useState, useSyncExternalStore } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  deleteFinanceTransaction,
  getFinanceTransactions,
  saveFinanceTransaction,
  subscribeToFinanceTransactions,
  type FinanceTransaction,
  type FinanceTransactionType,
} from '../../financeStore';
import { formatRupiah, useAdminInvoices } from './adminData';

type TransactionFilter = 'Semua' | FinanceTransactionType;

type LedgerEntry = {
  id: string;
  description: string;
  category: string;
  amount: number;
  type: FinanceTransactionType;
  date: string;
  editable: boolean;
};

const filters: TransactionFilter[] = ['Semua', 'Pemasukan', 'Pengeluaran'];

export default function KeuanganAdminScreen() {
  const manualTransactions = useSyncExternalStore(
    subscribeToFinanceTransactions,
    getFinanceTransactions,
    getFinanceTransactions,
  );
  const invoices = useAdminInvoices();
  const [activeFilter, setActiveFilter] = useState<TransactionFilter>('Semua');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<FinanceTransaction | null>(null);
  const [type, setType] = useState<FinanceTransactionType>('Pemasukan');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [formError, setFormError] = useState('');

  const invoiceIncome: LedgerEntry[] = invoices
    .filter((invoice) => invoice.status === 'Lunas')
    .map((invoice) => ({
      id: `invoice-${invoice.id}`,
      description: invoice.customerName,
      category: `Pembayaran tagihan · ${invoice.id}`,
      amount: invoice.amount,
      type: 'Pemasukan',
      date: invoice.paidAt ?? '',
      editable: false,
    }));

  const ledger = useMemo<LedgerEntry[]>(
    () => [
      ...manualTransactions.map((transaction) => ({ ...transaction, editable: true })),
      ...invoiceIncome,
    ].sort((first, second) => second.date.localeCompare(first.date)),
    [invoiceIncome, manualTransactions],
  );

  const visibleLedger = useMemo(
    () => ledger.filter((entry) => activeFilter === 'Semua' || entry.type === activeFilter),
    [activeFilter, ledger],
  );
  const income = ledger
    .filter((entry) => entry.type === 'Pemasukan')
    .reduce((total, entry) => total + entry.amount, 0);
  const expenses = ledger
    .filter((entry) => entry.type === 'Pengeluaran')
    .reduce((total, entry) => total + entry.amount, 0);
  const balance = income - expenses;

  const openNewTransaction = (transactionType: FinanceTransactionType) => {
    setEditingTransaction(null);
    setType(transactionType);
    setDescription('');
    setCategory('');
    setAmount('');
    setFormError('');
    setModalVisible(true);
  };

  const openEditTransaction = (transaction: FinanceTransaction) => {
    setEditingTransaction(transaction);
    setType(transaction.type);
    setDescription(transaction.description);
    setCategory(transaction.category);
    setAmount(String(transaction.amount));
    setFormError('');
    setModalVisible(true);
  };

  const closeForm = () => {
    setModalVisible(false);
    setEditingTransaction(null);
    setFormError('');
  };

  const saveTransaction = () => {
    const numericAmount = Number(amount.replace(/[^\d]/g, ''));
    if (!description.trim() || !category.trim() || !amount.trim()) {
      setFormError('Lengkapi keterangan, kategori, dan jumlah transaksi.');
      return;
    }
    if (!Number.isSafeInteger(numericAmount) || numericAmount <= 0) {
      setFormError('Jumlah harus berupa angka rupiah yang lebih besar dari nol.');
      return;
    }

    saveFinanceTransaction({
      ...(editingTransaction ? { id: editingTransaction.id } : {}),
      description: description.trim(),
      category: category.trim(),
      amount: numericAmount,
      type,
    });
    closeForm();
  };

  const confirmDelete = (transaction: FinanceTransaction) => {
    Alert.alert(
      'Hapus transaksi?',
      `Transaksi "${transaction.description}" akan dihapus dari catatan keuangan.`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: () => deleteFinanceTransaction(transaction.id),
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Ringkasan keuangan</Text>
        <Text style={styles.subtitle}>Catat dan kelola uang masuk maupun uang keluar.</Text>

        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Saldo bersih tercatat</Text>
          <Text style={styles.balanceAmount}>{formatRupiah(balance)}</Text>
          <View style={styles.balanceDivider} />
          <View style={styles.balanceFoot}>
            <Text style={styles.balanceNote}>{ledger.length} transaksi tercatat</Text>
            <Text style={styles.demoBadge}>DATA DEMO</Text>
          </View>
        </View>

        <View style={styles.summaryGrid}>
          <SummaryCard
            icon="arrow-down-outline"
            title="Uang masuk"
            amount={formatRupiah(income)}
            tint="#059669"
            background="#E7F7F1"
          />
          <SummaryCard
            icon="arrow-up-outline"
            title="Uang keluar"
            amount={formatRupiah(expenses)}
            tint="#DC4C4C"
            background="#FFF0F0"
          />
        </View>

        <View style={styles.sectionHeading}>
          <Text style={styles.sectionTitle}>Catat transaksi</Text>
        </View>
        <View style={styles.actionRow}>
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => openNewTransaction('Pemasukan')}
            style={[styles.actionButton, styles.incomeButton]}
          >
            <Ionicons name="add-circle-outline" size={19} color="#FFFFFF" />
            <Text style={styles.actionText}>Tambah uang masuk</Text>
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => openNewTransaction('Pengeluaran')}
            style={[styles.actionButton, styles.expenseButton]}
          >
            <Ionicons name="remove-circle-outline" size={19} color="#FFFFFF" />
            <Text style={styles.actionText}>Tambah uang keluar</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.sectionHeading, styles.transactionHeading]}>
          <Text style={styles.sectionTitle}>Riwayat transaksi</Text>
          <Text style={styles.count}>{visibleLedger.length} transaksi</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter}
              accessibilityRole="button"
              accessibilityState={{ selected: activeFilter === filter }}
              onPress={() => setActiveFilter(filter)}
              style={[styles.filter, activeFilter === filter && styles.activeFilter]}
            >
              <Text style={[styles.filterText, activeFilter === filter && styles.activeFilterText]}>
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {visibleLedger.length ? visibleLedger.map((entry) => {
          const isIncome = entry.type === 'Pemasukan';
          const editableTransaction = entry.editable
            ? manualTransactions.find((transaction) => transaction.id === entry.id)
            : undefined;

          return (
            <View key={entry.id} style={styles.transaction}>
              <View style={[styles.transactionIcon, isIncome ? styles.incomeIcon : styles.expenseIcon]}>
                <Ionicons
                  name={isIncome ? 'arrow-down-outline' : 'arrow-up-outline'}
                  size={19}
                  color={isIncome ? '#059669' : '#DC4C4C'}
                />
              </View>
              <View style={styles.transactionCopy}>
                <Text style={styles.customerName} numberOfLines={1}>{entry.description}</Text>
                <Text style={styles.transactionDetail} numberOfLines={1}>{entry.category}</Text>
                <Text style={styles.transactionDate}>{formatDate(entry.date)}</Text>
              </View>
              <View style={styles.transactionEnd}>
                <Text style={[styles.transactionAmount, isIncome ? styles.incomeText : styles.expenseText]}>
                  {isIncome ? '+' : '-'}{formatRupiah(entry.amount)}
                </Text>
                {editableTransaction ? (
                  <View style={styles.rowActions}>
                    <TouchableOpacity
                      accessibilityRole="button"
                      accessibilityLabel={`Edit transaksi ${entry.description}`}
                      onPress={() => openEditTransaction(editableTransaction)}
                      style={styles.rowAction}
                    >
                      <Ionicons name="create-outline" size={17} color="#2563EB" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      accessibilityRole="button"
                      accessibilityLabel={`Hapus transaksi ${entry.description}`}
                      onPress={() => confirmDelete(editableTransaction)}
                      style={styles.rowAction}
                    >
                      <Ionicons name="trash-outline" size={17} color="#DC4C4C" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <Text style={styles.autoLabel}>Otomatis</Text>
                )}
              </View>
            </View>
          );
        }) : (
          <View style={styles.emptyState}>
            <Ionicons name="file-tray-outline" size={28} color="#94A3B8" />
            <Text style={styles.emptyTitle}>Belum ada transaksi</Text>
            <Text style={styles.emptyCopy}>Tambahkan uang masuk atau uang keluar untuk mulai mencatat.</Text>
          </View>
        )}
        <Text style={styles.disclaimer}>
          Transaksi manual disimpan di perangkat selama aplikasi berjalan. Pembayaran tagihan masuk tercatat otomatis.
        </Text>
      </ScrollView>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeForm}
      >
        <KeyboardAvoidingView
          style={styles.modalBackdrop}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            contentContainerStyle={styles.modalScroll}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.formCard}>
              <View style={styles.formHeader}>
                <View style={styles.formHeaderCopy}>
                  <Text style={styles.formTitle}>
                    {editingTransaction ? 'Edit transaksi' : 'Transaksi baru'}
                  </Text>
                  <Text style={styles.formSubtitle}>Perbarui catatan uang masuk dan keluar.</Text>
                </View>
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Tutup form transaksi"
                  onPress={closeForm}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={21} color="#475569" />
                </TouchableOpacity>
              </View>

              <Text style={styles.fieldLabel}>Jenis transaksi</Text>
              <View style={styles.typeRow}>
                {(['Pemasukan', 'Pengeluaran'] as const).map((transactionType) => {
                  const selected = type === transactionType;
                  const isIncome = transactionType === 'Pemasukan';
                  return (
                    <TouchableOpacity
                      key={transactionType}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      onPress={() => setType(transactionType)}
                      style={[
                        styles.typeButton,
                        selected && (isIncome ? styles.selectedIncome : styles.selectedExpense),
                      ]}
                    >
                      <Ionicons
                        name={isIncome ? 'arrow-down-outline' : 'arrow-up-outline'}
                        size={17}
                        color={selected ? '#FFFFFF' : (isIncome ? '#059669' : '#DC4C4C')}
                      />
                      <Text style={[styles.typeText, selected && styles.selectedTypeText]}>
                        {transactionType}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.fieldLabel}>Keterangan</Text>
              <TextInput
                accessibilityLabel="Keterangan transaksi"
                autoCapitalize="sentences"
                onChangeText={setDescription}
                placeholder="Contoh: Pembelian kabel jaringan"
                placeholderTextColor="#94A3B8"
                style={styles.input}
                value={description}
              />

              <Text style={styles.fieldLabel}>Kategori</Text>
              <TextInput
                accessibilityLabel="Kategori transaksi"
                autoCapitalize="sentences"
                onChangeText={setCategory}
                placeholder="Contoh: Operasional"
                placeholderTextColor="#94A3B8"
                style={styles.input}
                value={category}
              />

              <Text style={styles.fieldLabel}>Jumlah (Rupiah)</Text>
              <View style={styles.amountInputWrap}>
                <Text style={styles.currencyPrefix}>Rp</Text>
                <TextInput
                  accessibilityLabel="Jumlah transaksi dalam rupiah"
                  keyboardType="number-pad"
                  onChangeText={(value) => setAmount(value.replace(/[^\d]/g, ''))}
                  placeholder="0"
                  placeholderTextColor="#94A3B8"
                  style={styles.amountInput}
                  value={amount}
                />
              </View>
              {formError ? <Text accessibilityRole="alert" style={styles.formError}>{formError}</Text> : null}

              <TouchableOpacity
                accessibilityRole="button"
                onPress={saveTransaction}
                style={styles.saveButton}
              >
                <Text style={styles.saveButtonText}>
                  {editingTransaction ? 'Simpan perubahan' : 'Simpan transaksi'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                accessibilityRole="button"
                onPress={closeForm}
                style={styles.cancelButton}
              >
                <Text style={styles.cancelButtonText}>Batal</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

function formatDate(date: string): string {
  if (!date) return 'Tanggal tidak tersedia';
  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return 'Tanggal tidak tersedia';
  return parsedDate.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function SummaryCard({
  icon,
  title,
  amount,
  tint,
  background,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  amount: string;
  tint: string;
  background: string;
}) {
  return (
    <View style={styles.summaryCard}>
      <View style={[styles.summaryIcon, { backgroundColor: background }]}>
        <Ionicons name={icon} size={18} color={tint} />
      </View>
      <Text style={styles.summaryTitle}>{title}</Text>
      <Text style={styles.summaryAmount}>{amount}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F7F9FC' },
  content: { padding: 18, paddingBottom: 30 },
  title: { color: '#172B45', fontSize: 22, fontWeight: '800' },
  subtitle: { color: '#718096', fontSize: 13, lineHeight: 19, marginTop: 5, marginBottom: 17 },
  balanceCard: { backgroundColor: '#1D4ED8', borderRadius: 18, padding: 17, marginBottom: 12, shadowColor: '#1D4ED8', shadowOffset: { width: 0, height: 7 }, shadowOpacity: 0.16, shadowRadius: 12, elevation: 3 },
  balanceLabel: { color: '#D8E6FF', fontSize: 11, fontWeight: '600' },
  balanceAmount: { color: '#FFFFFF', fontSize: 25, fontWeight: '800', marginTop: 6 },
  balanceDivider: { height: 1, backgroundColor: '#FFFFFF38', marginVertical: 13 },
  balanceFoot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  balanceNote: { color: '#E2ECFF', fontSize: 10, fontWeight: '600' },
  demoBadge: { color: '#E2ECFF', fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  summaryGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  summaryCard: { width: '48.5%', minHeight: 119, backgroundColor: '#FFFFFF', borderRadius: 15, padding: 13, borderWidth: 1, borderColor: '#EDF0F5' },
  summaryIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginBottom: 9 },
  summaryTitle: { color: '#718096', fontSize: 10, fontWeight: '600' },
  summaryAmount: { color: '#26384E', fontSize: 15, fontWeight: '800', marginTop: 5 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  transactionHeading: { marginTop: 22, marginBottom: 5 },
  sectionTitle: { color: '#172B45', fontSize: 16, fontWeight: '800' },
  actionRow: { gap: 9 },
  actionButton: { minHeight: 47, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 12 },
  incomeButton: { backgroundColor: '#087F5B' },
  expenseButton: { backgroundColor: '#C43D3D' },
  actionText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  count: { color: '#7B8797', fontSize: 11, fontWeight: '600' },
  filters: { gap: 8, paddingTop: 2, paddingBottom: 12 },
  filter: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5EAF1' },
  activeFilter: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  filterText: { color: '#64748B', fontSize: 11, fontWeight: '700' },
  activeFilterText: { color: '#FFFFFF' },
  transaction: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 15, padding: 11, marginBottom: 8, borderWidth: 1, borderColor: '#EDF0F5' },
  transactionIcon: { width: 37, height: 37, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 9 },
  incomeIcon: { backgroundColor: '#E7F7F1' },
  expenseIcon: { backgroundColor: '#FFF0F0' },
  transactionCopy: { flex: 1, minWidth: 0 },
  customerName: { color: '#26384E', fontSize: 12, fontWeight: '700' },
  transactionDetail: { color: '#8390A0', fontSize: 10, marginTop: 4 },
  transactionDate: { color: '#A0AAB8', fontSize: 10, marginTop: 3 },
  transactionEnd: { alignItems: 'flex-end', marginLeft: 5 },
  transactionAmount: { fontSize: 10, fontWeight: '800' },
  incomeText: { color: '#16804A' },
  expenseText: { color: '#C43D3D' },
  rowActions: { flexDirection: 'row', gap: 3, marginTop: 5 },
  rowAction: { width: 29, height: 27, borderRadius: 8, backgroundColor: '#F4F7FB', alignItems: 'center', justifyContent: 'center' },
  autoLabel: { color: '#94A3B8', fontSize: 9, marginTop: 6 },
  emptyState: { backgroundColor: '#FFFFFF', borderRadius: 15, alignItems: 'center', padding: 24, borderWidth: 1, borderColor: '#EDF0F5' },
  emptyTitle: { color: '#475569', fontSize: 13, fontWeight: '700', marginTop: 9 },
  emptyCopy: { color: '#8A96A6', fontSize: 11, lineHeight: 16, textAlign: 'center', marginTop: 5 },
  disclaimer: { color: '#9AA6B5', fontSize: 10, lineHeight: 15, textAlign: 'center', marginTop: 12 },
  modalBackdrop: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(20, 39, 59, 0.48)' },
  modalScroll: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  formCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 18 },
  formHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 17 },
  formHeaderCopy: { flex: 1, paddingRight: 10 },
  formTitle: { color: '#203951', fontSize: 19, fontWeight: '800' },
  formSubtitle: { color: '#718096', fontSize: 11, lineHeight: 16, marginTop: 4 },
  closeButton: { width: 33, height: 33, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F1F5F9', borderRadius: 11 },
  fieldLabel: { color: '#334155', fontSize: 11, fontWeight: '700', marginBottom: 7 },
  typeRow: { flexDirection: 'row', gap: 9, marginBottom: 15 },
  typeButton: { flex: 1, minHeight: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, borderWidth: 1, borderColor: '#E5EAF1', borderRadius: 11, backgroundColor: '#FFFFFF' },
  selectedIncome: { backgroundColor: '#087F5B', borderColor: '#087F5B' },
  selectedExpense: { backgroundColor: '#C43D3D', borderColor: '#C43D3D' },
  typeText: { color: '#475569', fontSize: 11, fontWeight: '700' },
  selectedTypeText: { color: '#FFFFFF' },
  input: { minHeight: 44, borderWidth: 1, borderColor: '#D9E2EC', borderRadius: 11, paddingHorizontal: 12, color: '#172B45', fontSize: 12, marginBottom: 14, backgroundColor: '#FBFDFF' },
  amountInputWrap: { minHeight: 46, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#D9E2EC', borderRadius: 11, paddingHorizontal: 12, marginBottom: 8, backgroundColor: '#FBFDFF' },
  currencyPrefix: { color: '#64748B', fontSize: 13, fontWeight: '700', marginRight: 8 },
  amountInput: { flex: 1, color: '#172B45', fontSize: 14, paddingVertical: 10 },
  formError: { color: '#B42318', fontSize: 11, lineHeight: 16, marginBottom: 8 },
  saveButton: { minHeight: 45, alignItems: 'center', justifyContent: 'center', backgroundColor: '#2563EB', borderRadius: 11, marginTop: 10 },
  saveButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  cancelButton: { minHeight: 40, alignItems: 'center', justifyContent: 'center', marginTop: 3 },
  cancelButtonText: { color: '#64748B', fontSize: 12, fontWeight: '700' },
});
