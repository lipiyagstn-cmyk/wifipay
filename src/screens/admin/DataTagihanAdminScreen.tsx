import React, { useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { formatRupiah, useAdminInvoices } from './adminData';

const filters = ['Semua', 'Belum Bayar', 'Lunas'] as const;
type Filter = (typeof filters)[number];

export default function DataTagihanAdminScreen() {
  const [activeFilter, setActiveFilter] = useState<Filter>('Semua');
  const invoices = useAdminInvoices();
  const visibleInvoices = useMemo(
    () => invoices.filter((invoice) => activeFilter === 'Semua' || invoice.status === activeFilter),
    [activeFilter, invoices],
  );
  const unpaidTotal = invoices
    .filter((invoice) => invoice.status === 'Belum Bayar')
    .reduce((total, invoice) => total + invoice.amount, 0);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Tagihan bulanan</Text>
        <Text style={styles.subtitle}>Pantau tagihan pelanggan dan status pembayarannya.</Text>

        <View style={styles.summaryCard}>
          <View style={styles.summaryIcon}>
            <Ionicons name="alert-circle-outline" size={21} color="#B45309" />
          </View>
          <View style={styles.summaryCopy}>
            <Text style={styles.summaryLabel}>Total belum tertagih</Text>
            <Text style={styles.summaryAmount}>{formatRupiah(unpaidTotal)}</Text>
          </View>
          <Text style={styles.summaryCount}>{invoices.filter((invoice) => invoice.status === 'Belum Bayar').length} tagihan</Text>
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
              <Text style={[styles.filterText, activeFilter === filter && styles.activeFilterText]}>{filter}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.listHeading}>
          <Text style={styles.sectionTitle}>Daftar tagihan</Text>
          <Text style={styles.count}>{visibleInvoices.length} tagihan</Text>
        </View>

        {visibleInvoices.length ? visibleInvoices.map((invoice) => {
          const paid = invoice.status === 'Lunas';
          return (
            <View key={invoice.id} style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.invoiceIcon}>
                  <Ionicons name="receipt-outline" size={19} color="#2563EB" />
                </View>
                <View style={styles.customerCopy}>
                  <Text style={styles.customerName}>{invoice.customerName}</Text>
                  <Text style={styles.invoiceId}>{invoice.id}</Text>
                </View>
                <Text style={[styles.status, paid ? styles.paidStatus : styles.unpaidStatus]}>{invoice.status}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Paket internet</Text>
                <Text style={styles.detailValue}>{invoice.packageName}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Jatuh tempo</Text>
                <Text style={styles.detailValue}>{invoice.dueDate}</Text>
              </View>
              <View style={styles.amountRow}>
                <Text style={styles.detailLabel}>Total tagihan</Text>
                <Text style={styles.amount}>{formatRupiah(invoice.amount)}</Text>
              </View>
              {invoice.paymentMethod ? <Text style={styles.paymentMethod}>Dibayar melalui {invoice.paymentMethod}</Text> : null}
            </View>
          );
        }) : (
          <View style={styles.emptyState}>
            <Ionicons name="file-tray-outline" size={28} color="#94A3B8" />
            <Text style={styles.emptyText}>Tidak ada tagihan untuk filter ini.</Text>
          </View>
        )}
        <Text style={styles.disclaimer}>Tagihan memakai data pelanggan demo dan tarif paket contoh.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F7F9FC' },
  content: { padding: 18, paddingBottom: 30 },
  title: { color: '#172B45', fontSize: 22, fontWeight: '800' },
  subtitle: { color: '#718096', fontSize: 13, lineHeight: 19, marginTop: 5, marginBottom: 17 },
  summaryCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF8EA', borderWidth: 1, borderColor: '#F8E7C3', borderRadius: 16, padding: 14, marginBottom: 17 },
  summaryIcon: { width: 40, height: 40, borderRadius: 13, backgroundColor: '#FFEDC7', alignItems: 'center', justifyContent: 'center', marginRight: 11 },
  summaryCopy: { flex: 1 },
  summaryLabel: { color: '#8B6A34', fontSize: 11, fontWeight: '600' },
  summaryAmount: { color: '#533E1C', fontSize: 17, fontWeight: '800', marginTop: 3 },
  summaryCount: { color: '#8B6A34', fontSize: 10, fontWeight: '700' },
  filters: { gap: 8, paddingBottom: 18 },
  filter: { paddingHorizontal: 15, paddingVertical: 9, borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5EAF1' },
  activeFilter: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  filterText: { color: '#64748B', fontSize: 12, fontWeight: '700' },
  activeFilterText: { color: '#FFFFFF' },
  listHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 11 },
  sectionTitle: { color: '#172B45', fontSize: 16, fontWeight: '800' },
  count: { color: '#7B8797', fontSize: 11, fontWeight: '600' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#EDF0F5' },
  cardTop: { flexDirection: 'row', alignItems: 'center' },
  invoiceIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#EAF2FF', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  customerCopy: { flex: 1 },
  customerName: { color: '#26384E', fontSize: 13, fontWeight: '700' },
  invoiceId: { color: '#98A3B2', fontSize: 10, marginTop: 3 },
  status: { overflow: 'hidden', borderRadius: 20, paddingHorizontal: 9, paddingVertical: 5, fontSize: 10, fontWeight: '700' },
  paidStatus: { color: '#16804A', backgroundColor: '#E8F6EE' },
  unpaidStatus: { color: '#C43D3D', backgroundColor: '#FDECEC' },
  divider: { height: 1, backgroundColor: '#F1F4F8', marginVertical: 12 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  detailLabel: { color: '#8491A2', fontSize: 11 },
  detailValue: { color: '#475569', fontSize: 11, fontWeight: '600' },
  amountRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F1F4F8', paddingTop: 10, marginTop: 2 },
  amount: { color: '#172B45', fontSize: 15, fontWeight: '800' },
  paymentMethod: { color: '#16804A', fontSize: 10, marginTop: 8 },
  emptyState: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 28, gap: 9 },
  emptyText: { color: '#718096', fontSize: 12 },
  disclaimer: { color: '#9AA6B5', fontSize: 10, lineHeight: 15, textAlign: 'center', marginTop: 10 },
});
