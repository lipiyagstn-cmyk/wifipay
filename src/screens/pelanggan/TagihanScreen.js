import React, { useSyncExternalStore } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { CURRENT_CUSTOMER_ID, getInvoicePayment, subscribeToInvoicePayments } from '../../paymentStore';

export default function TagihanScreen({ navigation }) {
  const invoicePayment = useSyncExternalStore(
    subscribeToInvoicePayments,
    () => getInvoicePayment(CURRENT_CUSTOMER_ID),
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.label}>Tagihan Bulan Ini</Text>
        <Text style={styles.amount}>Rp 150.000</Text>
        <Text style={styles.description}>Status: {invoicePayment ? 'Sudah dibayar' : 'Belum dibayar'}</Text>
        {invoicePayment && <Text style={styles.method}>Metode: {invoicePayment.method}</Text>}

        {!invoicePayment && (
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
