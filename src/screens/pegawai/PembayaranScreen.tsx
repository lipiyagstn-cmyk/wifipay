import React, { useMemo, useState, useSyncExternalStore } from 'react';
import { Image, Modal, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { confirmCashPayment, CURRENT_CUSTOMER_ID, getInvoicePayment, subscribeToInvoicePayments } from '../../paymentStore';
import { getCustomers, subscribeToCustomers } from '../../customerStore';

type PaymentStatus = 'Belum Bayar' | 'Menunggu' | 'Lunas';
type CustomerPayment = {
  id: string;
  name: string;
  address: string;
  package: string;
  amount: string;
  dueDate: string;
  phone: string;
  photo: string;
  status: PaymentStatus;
};

const initialPayments: CustomerPayment[] = [
  {
    id: 'WFP-008241',
    name: 'Budi Santoso',
    address: 'Jl. Cikutra Baru No. 18, Cibeunying, Bandung',
    package: 'Home WiFi 20 Mbps',
    amount: 'Rp 150.000',
    dueDate: 'Jatuh tempo 5 Okt',
    phone: '+62 812-3456-7890',
    photo: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=700&q=80',
    status: 'Belum Bayar',
  },
  {
    id: 'WFP-007936',
    name: 'Dewi Ayu',
    address: 'Jl. Ir. H. Juanda No. 42, Dago, Bandung',
    package: 'Home WiFi 30 Mbps',
    amount: 'Rp 200.000',
    dueDate: 'Jatuh tempo 7 Okt',
    phone: '+62 813-7001-2554',
    photo: 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=700&q=80',
    status: 'Menunggu',
  },
  {
    id: 'WFP-006518',
    name: 'Arman Hidayat',
    address: 'Jl. Terusan Jakarta No. 105, Antapani, Bandung',
    package: 'Home WiFi 10 Mbps',
    amount: 'Rp 125.000',
    dueDate: 'Jatuh tempo 10 Okt',
    phone: '+62 857-2210-6741',
    photo: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=700&q=80',
    status: 'Belum Bayar',
  },
];

const filters: Array<'Semua' | 'Belum Bayar' | 'Menunggu'> = ['Semua', 'Belum Bayar', 'Menunggu'];

const statusPalette: Record<PaymentStatus, { foreground: string; background: string }> = {
  'Belum Bayar': { foreground: '#C43D3D', background: '#FDECEC' },
  Menunggu: { foreground: '#A96A08', background: '#FFF4D9' },
  Lunas: { foreground: '#16804A', background: '#E8F6EE' },
};

export default function PembayaranScreen() {
  const [payments, setPayments] = useState(initialPayments);
  const [activeFilter, setActiveFilter] = useState<(typeof filters)[number]>('Semua');
  const [selectedPayment, setSelectedPayment] = useState<CustomerPayment | null>(null);
  const currentCustomerPayment = useSyncExternalStore(
    subscribeToInvoicePayments,
    () => getInvoicePayment(CURRENT_CUSTOMER_ID),
  );
  const customers = useSyncExternalStore(subscribeToCustomers, getCustomers, getCustomers);
  const customerPhotoById = useMemo(
    () => new Map(customers.map((customer) => [customer.id, customer.homePhotoUri])),
    [customers],
  );
  const syncedPayments = useMemo(
    () => payments.map((payment) => payment.id === CURRENT_CUSTOMER_ID && currentCustomerPayment
      ? { ...payment, status: 'Lunas' as const }
      : payment),
    [currentCustomerPayment, payments],
  );
  const pendingCount = syncedPayments.filter((payment) => payment.status !== 'Lunas').length;
  const visiblePayments = useMemo(
    () => syncedPayments.filter((payment) => activeFilter === 'Semua' || payment.status === activeFilter),
    [activeFilter, syncedPayments],
  );

  const markAsPaid = () => {
    if (!selectedPayment) return;
    confirmCashPayment(selectedPayment.id);
    setPayments((current) => current.map((item) => item.id === selectedPayment.id ? { ...item, status: 'Lunas' } : item));
    setSelectedPayment(null);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Pembayaran</Text>
            <Text style={styles.subtitle}>Pelanggan yang perlu ditagih.</Text>
          </View>
          <View style={styles.headerIcon}>
            <Ionicons name="card-outline" size={22} color="#2563EB" />
          </View>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryIcon}>
            <Ionicons name="wallet-outline" size={21} color="#FFFFFF" />
          </View>
          <View style={styles.summaryCopy}>
            <Text style={styles.summaryCaption}>Tagihan perlu ditindaklanjuti</Text>
            <Text style={styles.summaryValue}>{pendingCount} pelanggan</Text>
          </View>
          <Text style={styles.summaryPeriod}>SEPT 2026</Text>
        </View>

        <View style={styles.listHeader}>
          <Text style={styles.sectionTitle}>Daftar penagihan</Text>
          <Text style={styles.customerCount}>{visiblePayments.length} pelanggan</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter}
              accessibilityRole="button"
              accessibilityState={{ selected: activeFilter === filter }}
              onPress={() => setActiveFilter(filter)}
              style={[styles.filterButton, activeFilter === filter && styles.filterButtonActive]}
            >
              <Text style={[styles.filterText, activeFilter === filter && styles.filterTextActive]}>{filter}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {visiblePayments.map((payment) => {
          const palette = statusPalette[payment.status];

          return (
            <View key={payment.id} style={styles.customerCard}>
              <View style={styles.customerTop}>
                <Image source={{ uri: customerPhotoById.get(payment.id) ?? payment.photo }} style={styles.housePhoto} />
                <View style={styles.customerInfo}>
                  <View style={[styles.statusBadge, { backgroundColor: palette.background }]}>
                    <Text style={[styles.statusText, { color: palette.foreground }]}>{payment.status}</Text>
                  </View>
                  <Text style={styles.customerName} numberOfLines={1}>{payment.name}</Text>
                  <Text style={styles.customerId}>{payment.id}</Text>
                  <View style={styles.packageRow}>
                    <Ionicons name="wifi-outline" size={14} color="#6D7F91" />
                    <Text style={styles.packageText} numberOfLines={1}>{payment.package}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.addressRow}>
                <Ionicons name="location-outline" size={17} color="#2563EB" />
                <Text style={styles.addressText}>{payment.address}</Text>
              </View>

              <View style={styles.billRow}>
                <View>
                  <Text style={styles.amountLabel}>Tagihan bulan ini</Text>
                  <Text style={styles.amount}>{payment.amount}</Text>
                </View>
                <Text style={styles.dueDate}>{payment.dueDate}</Text>
              </View>

              {payment.status !== 'Lunas' ? (
                <TouchableOpacity accessibilityRole="button" onPress={() => setSelectedPayment(payment)} style={styles.actionButton}>
                  <Ionicons name="checkmark-circle-outline" size={17} color="#FFFFFF" />
                  <Text style={styles.actionText}>Terima pembayaran tunai</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.paidNotice}>
                  <Ionicons name="checkmark-circle" size={17} color="#16804A" />
                  <Text style={styles.paidText}>Pembayaran sudah lunas</Text>
                </View>
              )}
            </View>
          );
        })}

        {visiblePayments.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-done-outline" size={30} color="#16804A" />
            <Text style={styles.emptyTitle}>Tidak ada tagihan pada filter ini</Text>
          </View>
        )}
      </ScrollView>

      <Modal visible={selectedPayment !== null} transparent animationType="fade" onRequestClose={() => setSelectedPayment(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.confirmCard}>
            <View style={styles.confirmIcon}>
              <Ionicons name="checkmark-circle-outline" size={25} color="#2563EB" />
            </View>
            <Text style={styles.confirmTitle}>Konfirmasi pembayaran</Text>
            <Text style={styles.confirmDescription}>
              Konfirmasi menerima tunai {selectedPayment?.amount} dari {selectedPayment?.name}?
            </Text>
            <TouchableOpacity accessibilityRole="button" onPress={markAsPaid} style={styles.confirmButton}>
              <Text style={styles.confirmButtonText}>Ya, tunai diterima</Text>
            </TouchableOpacity>
            <TouchableOpacity accessibilityRole="button" onPress={() => setSelectedPayment(null)} style={styles.cancelButton}>
              <Text style={styles.cancelButtonText}>Batal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F4F7FB' },
  content: { paddingHorizontal: 18, paddingTop: 15, paddingBottom: 28 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 17 },
  title: { color: '#172F49', fontSize: 21, fontWeight: '800' },
  subtitle: { color: '#7B899A', fontSize: 12, marginTop: 5 },
  headerIcon: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EAF2FF' },
  summaryCard: { minHeight: 78, flexDirection: 'row', alignItems: 'center', backgroundColor: '#2563EB', borderRadius: 16, paddingHorizontal: 13, marginBottom: 21 },
  summaryIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center', marginRight: 11 },
  summaryCopy: { flex: 1 },
  summaryCaption: { color: '#DCE9FF', fontSize: 10 },
  summaryValue: { color: '#FFFFFF', fontSize: 17, fontWeight: '800', marginTop: 3 },
  summaryPeriod: { color: '#DCE9FF', fontSize: 9, fontWeight: '700' },
  listHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 },
  sectionTitle: { color: '#203951', fontSize: 15, fontWeight: '800' },
  customerCount: { color: '#7B899A', fontSize: 10 },
  filters: { flexDirection: 'row', gap: 8, paddingBottom: 13 },
  filterButton: { minHeight: 34, justifyContent: 'center', paddingHorizontal: 13, borderRadius: 18, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5EAF1' },
  filterButtonActive: { backgroundColor: '#EAF2FF', borderColor: '#BBD2FF' },
  filterText: { color: '#718096', fontSize: 10, fontWeight: '700' },
  filterTextActive: { color: '#2563EB' },
  customerCard: { backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#E8EDF3', padding: 12, marginBottom: 12 },
  customerTop: { flexDirection: 'row', gap: 12 },
  housePhoto: { width: 104, height: 112, borderRadius: 12, backgroundColor: '#E5EAF0' },
  customerInfo: { flex: 1, justifyContent: 'center', minWidth: 0 },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 16, marginBottom: 7 },
  statusText: { fontSize: 9, fontWeight: '700' },
  customerName: { color: '#243A52', fontSize: 14, fontWeight: '800' },
  customerId: { color: '#8995A4', fontSize: 9, marginTop: 3 },
  packageRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8 },
  packageText: { flex: 1, color: '#66788C', fontSize: 10 },
  addressRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 7, paddingTop: 11, paddingBottom: 10 },
  addressText: { flex: 1, color: '#596B7F', fontSize: 11, lineHeight: 16 },
  billRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingTop: 10, borderTopWidth: 1, borderTopColor: '#EFF2F6' },
  amountLabel: { color: '#8995A4', fontSize: 9 },
  amount: { color: '#203951', fontSize: 17, fontWeight: '800', marginTop: 3 },
  dueDate: { color: '#8B6C3D', fontSize: 9, marginBottom: 3 },
  actionButton: { minHeight: 39, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 7, backgroundColor: '#2563EB', borderRadius: 10, marginTop: 11 },
  actionText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  paidNotice: { minHeight: 36, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, backgroundColor: '#E8F6EE', borderRadius: 10, marginTop: 11 },
  paidText: { color: '#16804A', fontSize: 10, fontWeight: '700' },
  emptyState: { alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 15, padding: 25 },
  emptyTitle: { color: '#596B7F', fontSize: 12, fontWeight: '600', marginTop: 8 },
  modalBackdrop: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: 'rgba(20, 39, 59, 0.42)' },
  confirmCard: { alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 18, padding: 20 },
  confirmIcon: { width: 48, height: 48, borderRadius: 15, backgroundColor: '#EAF2FF', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  confirmTitle: { color: '#203951', fontSize: 17, fontWeight: '800' },
  confirmDescription: { color: '#718096', fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 7, marginBottom: 15 },
  confirmButton: { width: '100%', minHeight: 43, alignItems: 'center', justifyContent: 'center', backgroundColor: '#2563EB', borderRadius: 11 },
  confirmButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  cancelButton: { minHeight: 38, justifyContent: 'center', paddingHorizontal: 16, marginTop: 3 },
  cancelButtonText: { color: '#6B7D90', fontSize: 12, fontWeight: '700' },
});