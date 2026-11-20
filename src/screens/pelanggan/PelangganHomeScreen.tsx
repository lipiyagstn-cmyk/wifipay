import React, { useEffect, useSyncExternalStore } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { CompositeScreenProps, NavigationProp } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { PelangganTabParamList, RootStackParamList } from '../../navigation/types';
import { api, getApiErrorMessage } from '../../api';
import { getCurrentCustomerId, getCurrentUser, logout } from '../../auth/authService';
import { getCustomer, loadCustomer, subscribeToCustomers } from '../../customerStore';
import { getCurrentInvoice, loadInvoices, subscribeToInvoices } from '../../paymentStore';
import { formatRupiah } from '../admin/adminData';

type Props = CompositeScreenProps<
  BottomTabScreenProps<PelangganTabParamList, 'HomePelanggan'>,
  NativeStackScreenProps<RootStackParamList>
>;

export default function PelangganHomeScreen({ navigation }: Props) {
  const rootNavigation = navigation.getParent<NavigationProp<RootStackParamList>>();
  const customerId = getCurrentCustomerId();
  const customer = useSyncExternalStore(
    subscribeToCustomers,
    () => getCustomer(customerId),
    () => getCustomer(customerId),
  );
  const invoice = useSyncExternalStore(
    subscribeToInvoices,
    () => getCurrentInvoice(customerId),
    () => getCurrentInvoice(customerId),
  );
  const user = getCurrentUser();

  const openNotifications = async () => {
    try {
      const response = await api.get<unknown>('/customer/notifications');
      const payload =
        typeof response.data === 'object' &&
        response.data !== null &&
        'data' in response.data
          ? response.data.data
          : response.data;
      const notifications = Array.isArray(payload)
        ? payload
            .slice(0, 5)
            .map((item) => {
              if (typeof item !== 'object' || item === null) return null;
              const record = item as Record<string, unknown>;
              const title = typeof record.title === 'string' ? record.title : '';
              const message =
                typeof record.message === 'string'
                  ? record.message
                  : typeof record.body === 'string'
                    ? record.body
                    : '';
              return [title, message].filter(Boolean).join('\n');
            })
            .filter((item): item is string => item !== null && item.length > 0)
        : [];
      Alert.alert(
        'Notifikasi',
        notifications.length > 0 ? notifications.join('\n\n') : 'Belum ada notifikasi baru.',
      );
    } catch (error) {
      Alert.alert('Gagal memuat notifikasi', getApiErrorMessage(error));
    }
  };

  useEffect(() => {
    const requests: { label: string; promise: Promise<unknown> }[] = [
      { label: 'Tagihan (/customer/bills)', promise: loadInvoices() },
    ];
    if (customerId) {
      requests.push({
        label: 'Profil pelanggan (/customer/profile)',
        promise: loadCustomer(customerId),
      });
    }

    Promise.allSettled(requests.map(({ promise }) => promise)).then((results) => {
      const failures = results.flatMap((result, index) =>
        result.status === 'rejected'
          ? [`${requests[index].label}: ${getApiErrorMessage(result.reason)}`]
          : [],
      );
      if (failures.length > 0) {
        Alert.alert('Gagal memuat data akun', failures.join('\n\n'));
      }
    });
  }, [customerId]);

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <View>
            <Text style={styles.greeting}>Hai, {customer?.name ?? user?.name ?? ''} 👋</Text>
            <Text style={styles.subtitle}>Senang melihat Anda kembali</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              accessibilityLabel="Notifikasi"
              accessibilityRole="button"
              onPress={openNotifications}
              style={styles.headerActionButton}
            >
              <Ionicons name="notifications-outline" size={21} color="#0F766E" />
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityLabel="Keluar"
              accessibilityRole="button"
              onPress={() => {
                logout();
                rootNavigation?.reset({ index: 0, routes: [{ name: 'Login' }] });
              }}
              style={styles.headerActionButton}
            >
              <Ionicons name="log-out-outline" size={21} color="#0F766E" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.connectionCard}>
          <View style={styles.connectionTop}>
            <View style={styles.wifiIcon}>
              <Ionicons name="wifi" size={23} color="#FFFFFF" />
            </View>
            <View style={styles.onlineBadge}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>{customer?.status ?? '-'}</Text>
            </View>
          </View>
          <Text style={styles.planLabel}>{customer?.status === 'Aktif' ? 'PAKET INTERNET AKTIF' : 'STATUS PAKET INTERNET'}</Text>
          <Text style={styles.planName}>{customer?.package ?? 'Paket internet'}</Text>
          <View style={styles.connectionDivider} />
          <View style={styles.connectionDetails}>
            <View>
              <Text style={styles.detailLabel}>ID pelanggan</Text>
              <Text style={styles.detailValue}>{customer?.id ?? customerId ?? '-'}</Text>
            </View>
            <View style={styles.speedBlock}>
              <Text style={styles.detailLabel}>Kecepatan</Text>
              <Text style={styles.detailValue}>{customer?.package ?? '-'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionHeading}>
          <Text style={styles.sectionTitle}>Tagihan Anda</Text>
          <Text style={styles.period}>{invoice?.period ?? '-'}</Text>
        </View>
        <View style={styles.billCard}>
          <View style={styles.billTop}>
            <View>
              <Text style={styles.billCaption}>Total yang perlu dibayar</Text>
              <Text style={styles.billAmount}>{invoice ? formatRupiah(invoice.amount) : '-'}</Text>
            </View>
            <View style={[styles.unpaidBadge, invoice?.status === 'Lunas' && styles.paidBadge]}>
              <Text style={[styles.unpaidText, invoice?.status === 'Lunas' && styles.paidText]}>
                {invoice?.status ?? 'Tidak ada tagihan'}
              </Text>
            </View>
          </View>
          <View style={styles.dueRow}>
            <Ionicons name="calendar-outline" size={16} color="#77869A" />
            <Text style={styles.dueText}>
              {invoice
                ? invoice.dueDate
                  ? `Jatuh tempo ${invoice.dueDate}`
                  : 'Tanggal jatuh tempo belum ditentukan'
                : 'Tagihan terbaru tidak tersedia'}
            </Text>
          </View>
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => rootNavigation?.navigate('BayarTagihan')}
            disabled={!invoice || invoice.status === 'Lunas'}
            style={[styles.payButton, (!invoice || invoice.status === 'Lunas') && styles.payButtonDisabled]}
          >
            <Text style={styles.payButtonText}>Bayar tagihan</Text>
            <Ionicons name="arrow-forward" size={17} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.sectionHeading}>
          <Text style={styles.sectionTitle}>Akses cepat</Text>
        </View>
        <View style={styles.quickActions}>
          <TouchableOpacity accessibilityRole="button" onPress={() => navigation.navigate('TagihanPelanggan')} style={styles.quickAction}>
            <View style={[styles.quickIcon, { backgroundColor: '#EAF7F4' }]}>
              <Ionicons name="receipt-outline" size={21} color="#0F766E" />
            </View>
            <Text style={styles.quickLabel}>Tagihan</Text>
          </TouchableOpacity>
          <TouchableOpacity accessibilityRole="button" onPress={() => navigation.navigate('RiwayatPembayaran')} style={styles.quickAction}>
            <View style={[styles.quickIcon, { backgroundColor: '#EFF4FF' }]}>
              <Ionicons name="time-outline" size={21} color="#3569C8" />
            </View>
            <Text style={styles.quickLabel}>Riwayat</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionHeading}>
          <Text style={styles.sectionTitle}>Pembayaran terakhir</Text>
          <TouchableOpacity accessibilityRole="button" onPress={() => navigation.navigate('RiwayatPembayaran')}>
            <Text style={styles.seeAll}>Lihat semua</Text>
          </TouchableOpacity>
        </View>
        {invoice?.status === 'Lunas' && (
        <View style={styles.historyCard}>
          <View style={styles.historyIcon}>
            <Ionicons name="checkmark" size={19} color="#0F766E" />
          </View>
          <View style={styles.historyCopy}>
            <Text style={styles.historyTitle}>{invoice.period || `Tagihan ${invoice.id}`}</Text>
            <Text style={styles.historySubtitle}>{invoice.paidAt ? `Dibayar ${invoice.paidAt}` : invoice.status}</Text>
          </View>
          <Text style={styles.historyAmount}>{formatRupiah(invoice.amount)}</Text>
        </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F7F9FC' },
  content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 30 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  greeting: { color: '#15343A', fontSize: 23, fontWeight: '800' },
  subtitle: { color: '#788B8D', fontSize: 13, marginTop: 5 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerActionButton: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  connectionCard: { backgroundColor: '#0F766E', borderRadius: 19, padding: 18, marginBottom: 23 },
  connectionTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 19 },
  wifiIcon: { width: 40, height: 40, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' },
  onlineBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 9, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20 },
  onlineDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#9EF0C1' },
  onlineText: { color: '#E8FFFA', fontSize: 11, fontWeight: '700' },
  planLabel: { color: '#BCE6DE', fontSize: 10, fontWeight: '700' },
  planName: { color: '#FFFFFF', fontSize: 20, fontWeight: '800', marginTop: 5 },
  connectionDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginVertical: 16 },
  connectionDetails: { flexDirection: 'row' },
  speedBlock: { marginLeft: 46 },
  detailLabel: { color: '#BCE6DE', fontSize: 10 },
  detailValue: { color: '#FFFFFF', fontSize: 12, fontWeight: '700', marginTop: 4 },
  sectionHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 11 },
  sectionTitle: { color: '#18373C', fontSize: 16, fontWeight: '800' },
  period: { color: '#879798', fontSize: 11 },
  billCard: { backgroundColor: '#FFFFFF', borderRadius: 17, padding: 16, marginBottom: 22, borderWidth: 1, borderColor: '#E9EFEE' },
  billTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  billCaption: { color: '#788B8D', fontSize: 11 },
  billAmount: { color: '#17363B', fontSize: 25, fontWeight: '800', marginTop: 6 },
  unpaidBadge: { backgroundColor: '#FFF4E5', borderRadius: 20, paddingHorizontal: 9, paddingVertical: 6 },
  unpaidText: { color: '#B66A18', fontSize: 10, fontWeight: '700' },
  paidBadge: { backgroundColor: '#E8F6EE' },
  paidText: { color: '#16804A' },
  dueRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 12 },
  dueText: { color: '#788B8D', fontSize: 11 },
  payButton: { height: 47, backgroundColor: '#0F766E', borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 15 },
  payButtonDisabled: { opacity: 0.5 },
  payButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  quickActions: { flexDirection: 'row', gap: 11, marginBottom: 22 },
  quickAction: { flex: 1, minHeight: 66, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 14, paddingHorizontal: 12, borderWidth: 1, borderColor: '#E9EFEE' },
  quickIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  quickLabel: { color: '#294449', fontSize: 12, fontWeight: '700' },
  seeAll: { color: '#0F766E', fontSize: 11, fontWeight: '700' },
  historyCard: { minHeight: 68, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 14, paddingHorizontal: 12, borderWidth: 1, borderColor: '#E9EFEE' },
  historyIcon: { width: 35, height: 35, borderRadius: 11, backgroundColor: '#EAF7F4', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  historyCopy: { flex: 1 },
  historyTitle: { color: '#294449', fontSize: 12, fontWeight: '700' },
  historySubtitle: { color: '#879798', fontSize: 10, marginTop: 4 },
  historyAmount: { color: '#294449', fontSize: 11, fontWeight: '700' },
});