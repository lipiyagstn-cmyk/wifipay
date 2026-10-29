import React, { useState, useSyncExternalStore } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { Asset } from 'expo-asset';
import * as Sharing from 'expo-sharing';
import { CURRENT_CUSTOMER_ID, getInvoicePayment, subscribeToInvoicePayments } from '../../paymentStore';

// 1. Impor gambar QR lokal (Sesuaikan ekstensi .jpeg/.jpg/.png dengan file kamu)
const localQrImage = require('../../../assets/images/qr.jpeg');

export default function BayarTagihanScreen() {
  const [isDownloading, setIsDownloading] = useState(false);

  // Sync state pembayaran dari store eksternal
  const invoicePayment = useSyncExternalStore(
    subscribeToInvoicePayments,
    () => getInvoicePayment(CURRENT_CUSTOMER_ID),
  );

  const handleDownloadQR = async () => {
    try {
      setIsDownloading(true);

      // Ambil file dari modul aset lokal
      const asset = Asset.fromModule(localQrImage);
      await asset.downloadAsync();
      const localUri = asset.localUri || asset.uri;

      const isSharingAvailable = await Sharing.isAvailableAsync();
      if (isSharingAvailable && localUri) {
        await Sharing.shareAsync(localUri, {
          mimeType: 'image/jpeg',
          dialogTitle: 'Simpan atau Bagikan Kode QR',
        });
      } else {
        Alert.alert('Berhasil', 'Gambar QR berhasil disiapkan.');
      }
    } catch (error) {
      Alert.alert('Gagal', 'Terjadi kesalahan saat memproses QR code.');
      console.error(error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Ringkasan Tagihan */}
        <View style={styles.amountCard}>
          <View style={styles.amountIcon}>
            <Ionicons name="receipt-outline" size={21} color="#0F766E" />
          </View>
          <Text style={styles.amountLabel}>Total pembayaran</Text>
          <Text style={styles.amount}>Rp 150.000</Text>
          <Text style={styles.dueDate}>Tagihan WiFi · September 2026</Text>

          {/* Badge Status Pembayaran */}
          <View style={[styles.paymentStatus, invoicePayment && styles.paymentStatusPaid]}>
            <Ionicons
              name={invoicePayment ? 'checkmark-circle' : 'alert-circle'}
              size={16}
              color={invoicePayment ? '#16804A' : '#9A5B08'}
            />
            <Text style={[styles.paymentStatusText, invoicePayment && styles.paymentStatusTextPaid]}>
              {invoicePayment ? `Sudah dibayar · ${invoicePayment.method}` : 'Status pembayaran: Belum dibayar'}
            </Text>
          </View>
        </View>

        {/* Kartu QR Code (Hanya tampil jika belum dibayar) */}
        {!invoicePayment && (
          <View style={styles.qrCard}>
            <View style={styles.qrHeading}>
              <Text style={styles.sectionTitle}>Pindai QR untuk membayar</Text>
              <View style={styles.demoBadge}>
                <Text style={styles.demoText}>DEMO</Text>
              </View>
            </View>
            <Text style={styles.instruction}>Buka aplikasi pembayaran, lalu pindai kode berikut.</Text>

            <View style={styles.qrFrame}>
              <Image
                source={localQrImage}
                style={styles.qrImage}
                resizeMode="contain"
              />
            </View>

            {/* Tombol Unduh / Simpan QR Code */}
            <TouchableOpacity
              style={styles.downloadButton}
              onPress={handleDownloadQR}
              disabled={isDownloading}
              activeOpacity={0.8}
            >
              {isDownloading ? (
                <ActivityIndicator size="small" color="#0F766E" />
              ) : (
                <>
                  <Ionicons name="download-outline" size={16} color="#0F766E" />
                  <Text style={styles.downloadButtonText}>Unduh / Simpan Kode QR</Text>
                </>
              )}
            </TouchableOpacity>

            <View style={styles.invoiceRow}>
              <Text style={styles.invoiceLabel}>Nomor invoice</Text>
              <Text style={styles.invoiceValue}>WFP-008241-2026-09</Text>
            </View>
          </View>
        )}

        {/* Catatan Informasi */}
        {!invoicePayment && (
          <View style={styles.notice}>
            <Ionicons name="information-circle-outline" size={20} color="#A15C15" />
            <Text style={styles.noticeText}>
              QRIS ini tidak menyertakan nominal. Masukkan Rp 150.000 di aplikasi pembayaran dan pastikan nama merchant ICHINETWORK sebelum membayar.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F5F8F8' },
  content: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 30 },
  amountCard: { backgroundColor: '#0F766E', borderRadius: 18, padding: 18, marginBottom: 16 },
  amountIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  amountLabel: { color: '#D4F1EC', fontSize: 12 },
  amount: { color: '#FFFFFF', fontSize: 29, fontWeight: '800', marginTop: 4 },
  dueDate: { color: '#D4F1EC', fontSize: 12, marginTop: 7 },
  paymentStatus: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', backgroundColor: '#FFF3D6', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 7, marginTop: 13 },
  paymentStatusText: { color: '#80510B', fontSize: 11, fontWeight: '700' },
  paymentStatusPaid: { backgroundColor: '#E8F6EE' },
  paymentStatusTextPaid: { color: '#16804A' },
  qrCard: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 18, alignItems: 'center', borderWidth: 1, borderColor: '#E7EEEC' },
  qrHeading: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { color: '#17363B', fontSize: 16, fontWeight: '800' },
  demoBadge: { backgroundColor: '#FFF3E2', borderRadius: 20, paddingHorizontal: 9, paddingVertical: 5 },
  demoText: { color: '#A15C15', fontSize: 9, fontWeight: '800' },
  instruction: { alignSelf: 'flex-start', color: '#778B8C', fontSize: 12, lineHeight: 18, marginTop: 8 },
  qrFrame: { width: 250, height: 250, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', borderRadius: 14, marginTop: 18, marginBottom: 12, borderWidth: 1, borderColor: '#E8EFED', overflow: 'hidden' },
  qrImage: { width: 218, height: 218, borderRadius: 10 },
  downloadButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#E6F4F1', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10, marginBottom: 15, width: '100%' },
  downloadButtonText: { color: '#0F766E', fontSize: 13, fontWeight: '700' },
  invoiceRow: { width: '100%', paddingTop: 14, borderTopWidth: 1, borderTopColor: '#EDF1F0', alignItems: 'center' },
  invoiceLabel: { color: '#859495', fontSize: 10 },
  invoiceValue: { color: '#294449', fontSize: 12, fontWeight: '700', marginTop: 4 },
  notice: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, backgroundColor: '#FFF7EA', borderRadius: 13, padding: 13, marginTop: 14 },
  noticeText: { flex: 1, color: '#80531F', fontSize: 11, lineHeight: 17 },
});