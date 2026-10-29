import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

type PaymentStatus = 'Berhasil' | 'Menunggu' | 'Belum Bayar';

type PaymentTransaction = {
  id: string;
  date: string;
  period: string;
  amount: string;
  method: string;
  status: PaymentStatus;
};

const transactions: PaymentTransaction[] = [
  {
    id: 'TRX-WFP-260926-0841',
    date: '26 Sep 2026, 09.14',
    period: 'September 2026',
    amount: 'Rp 150.000',
    method: 'QRIS',
    status: 'Berhasil',
  },
  {
    id: 'TRX-WFP-250926-0712',
    date: '25 Sep 2026, 16.32',
    period: 'September 2026',
    amount: 'Rp 150.000',
    method: 'Transfer bank',
    status: 'Menunggu',
  },
  {
    id: 'INV-WFP-2608-008241',
    date: '5 Agu 2026, 08.00',
    period: 'Agustus 2026',
    amount: 'Rp 150.000',
    method: 'Belum dipilih',
    status: 'Belum Bayar',
  },
  {
    id: 'TRX-WFP-030826-0285',
    date: '3 Agu 2026, 10.05',
    period: 'Juli 2026',
    amount: 'Rp 150.000',
    method: 'QRIS',
    status: 'Berhasil',
  },
];

const statusStyles: Record<PaymentStatus, { color: string; background: string; icon: keyof typeof Ionicons.glyphMap }> = {
  Berhasil: { color: '#16804A', background: '#E9F7EF', icon: 'checkmark-circle' },
  Menunggu: { color: '#A96A08', background: '#FFF4D9', icon: 'time' },
  'Belum Bayar': { color: '#C43D3D', background: '#FDECEC', icon: 'alert-circle' },
};

export default function RiwayatPembayaranScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Riwayat Pembayaran</Text>
          <Text style={styles.subtitle}>Pantau transaksi dan status tagihan WiFi Anda.</Text>
        </View>

        <View style={styles.summary}>
          <View style={styles.summaryIcon}>
            <Ionicons name="receipt-outline" size={20} color="#0F766E" />
          </View>
          <View style={styles.summaryCopy}>
            <Text style={styles.summaryLabel}>Total transaksi</Text>
            <Text style={styles.summaryValue}>{transactions.length} pembayaran</Text>
          </View>
          <Ionicons name="chevron-down" size={17} color="#80908F" />
        </View>

        <Text style={styles.listHeading}>Transaksi terbaru</Text>
        {transactions.map((transaction) => {
          const status = statusStyles[transaction.status];

          return (
            <View key={transaction.id} style={styles.transactionCard}>
              <View style={styles.cardTop}>
                <View style={styles.periodBlock}>
                  <Text style={styles.periodLabel}>PERIODE TAGIHAN</Text>
                  <Text style={styles.period}>{transaction.period}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: status.background }]}>
                  <Ionicons name={status.icon} size={14} color={status.color} />
                  <Text style={[styles.statusText, { color: status.color }]}>{transaction.status}</Text>
                </View>
              </View>

              <Text style={styles.amount}>{transaction.amount}</Text>

              <View style={styles.divider} />
              <TransactionDetail icon="calendar-outline" label="Tanggal transaksi" value={transaction.date} />
              <TransactionDetail icon="card-outline" label="Metode pembayaran" value={transaction.method} />
              <TransactionDetail icon="barcode-outline" label="ID transaksi" value={transaction.id} />
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

function TransactionDetail({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailIcon}>
        <Ionicons name={icon} size={15} color="#748583" />
      </View>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F5F8F8' },
  content: { paddingHorizontal: 18, paddingTop: 15, paddingBottom: 28 },
  header: { marginBottom: 18 },
  title: { color: '#17363B', fontSize: 22, fontWeight: '800' },
  subtitle: { color: '#7A8C8D', fontSize: 12, lineHeight: 18, marginTop: 5 },
  summary: { minHeight: 67, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 15, borderWidth: 1, borderColor: '#E8EFED', paddingHorizontal: 13, marginBottom: 23 },
  summaryIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#EAF7F4', alignItems: 'center', justifyContent: 'center', marginRight: 11 },
  summaryCopy: { flex: 1 },
  summaryLabel: { color: '#859493', fontSize: 10 },
  summaryValue: { color: '#294449', fontSize: 13, fontWeight: '700', marginTop: 3 },
  listHeading: { color: '#294449', fontSize: 15, fontWeight: '800', marginBottom: 11 },
  transactionCard: { backgroundColor: '#FFFFFF', borderRadius: 15, borderWidth: 1, borderColor: '#E8EFED', padding: 14, marginBottom: 11 },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  periodBlock: { flex: 1 },
  periodLabel: { color: '#9AA6A4', fontSize: 9, fontWeight: '700' },
  period: { color: '#294449', fontSize: 13, fontWeight: '700', marginTop: 3 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 20, paddingHorizontal: 9, paddingVertical: 6 },
  statusText: { fontSize: 10, fontWeight: '700' },
  amount: { color: '#17363B', fontSize: 21, fontWeight: '800', marginTop: 14 },
  divider: { height: 1, backgroundColor: '#EEF2F1', marginTop: 13, marginBottom: 7 },
  detailRow: { minHeight: 30, flexDirection: 'row', alignItems: 'center' },
  detailIcon: { width: 22, alignItems: 'flex-start' },
  detailLabel: { color: '#82908F', fontSize: 10, flex: 1 },
  detailValue: { color: '#425957', fontSize: 10, fontWeight: '600', textAlign: 'right', maxWidth: '58%' },
});