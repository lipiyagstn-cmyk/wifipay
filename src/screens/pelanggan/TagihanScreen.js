import React, { useEffect, useSyncExternalStore } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Alert, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { getApiErrorMessage } from '../../api';
import { getCurrentCustomerId } from '../../auth/authService';
import { getCurrentInvoice, loadInvoices, subscribeToInvoices } from '../../paymentStore';
import { formatRupiah } from '../admin/adminData';

export default function TagihanScreen({ navigation }) {
  const customerId = getCurrentCustomerId();
  const invoice = useSyncExternalStore(
    subscribeToInvoices,
    () => getCurrentInvoice(customerId),
    () => getCurrentInvoice(customerId),
  );

  useEffect(() => {
    loadInvoices().catch((error) => {
      Alert.alert('Gagal memuat tagihan', getApiErrorMessage(error));
    });
  }, []);

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.label}>Tagihan Bulan Ini</Text>
        <Text style={styles.amount}>{invoice ? formatRupiah(invoice.amount) : '-'}</Text>
        <Text style={styles.description}>
          {invoice ? `${invoice.period} · ${invoice.status}` : 'Tagihan tidak tersedia'}
        </Text>
        {invoice?.paymentMethod && <Text style={styles.method}>Metode: {invoice.paymentMethod}</Text>}

        {invoice && invoice.status !== 'Lunas' && (
          <TouchableOpacity style={styles.payButton} onPress={() => navigation.navigate('BayarTagihan')}>
            <Text style={styles.payButtonText}>Bayar Sekarang</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 18,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  label: {
    color: '#6B7280',
    fontSize: 14,
    marginBottom: 8,
  },
  amount: {
    fontSize: 32,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
  },
  description: {
    color: '#4B5563',
    fontSize: 15,
    marginBottom: 24,
  },
  method: {
    color: '#16804A',
    fontSize: 14,
    fontWeight: '600',
    marginTop: -16,
    marginBottom: 24,
  },
  payButton: {
    backgroundColor: '#059669',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  payButtonText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 16,
  },
});
