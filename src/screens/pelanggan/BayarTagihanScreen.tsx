import React, { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import ViewShot, { type ViewShotRef } from 'react-native-view-shot';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getApiErrorMessage } from '../../api';
import { getCurrentCustomerId } from '../../auth/authService';
import { getCurrentInvoice, loadInvoices, subscribeToInvoices } from '../../paymentStore';
import { formatRupiah } from '../admin/adminData';

export default function BayarTagihanScreen() {
  const [isSavingQr, setIsSavingQr] = useState(false);
  const qrCaptureRef = useRef<ViewShotRef>(null);
  const customerId = getCurrentCustomerId();
  const invoice = useSyncExternalStore(
    subscribeToInvoices,
    () => getCurrentInvoice(customerId),
    () => getCurrentInvoice(customerId),
  );

  useEffect(() => {
    loadInvoices().catch((error: unknown) => {
      Alert.alert('Gagal memuat tagihan', getApiErrorMessage(error));
    });
  }, []);

  const downloadQr = async () => {
    if (!invoice || isSavingQr) return;
    setIsSavingQr(true);

    try {
      const imageUri = await qrCaptureRef.current?.capture();
      if (!imageUri) {
        throw new Error('QR belum siap. Coba lagi beberapa saat.');
      }

      let canSaveToGallery = false;
      try {
        const permission = await MediaLibrary.requestPermissionsAsync(true, ['photo']);
        canSaveToGallery = permission.granted;
      } catch (permissionError) {
        console.warn('Izin galeri tidak tersedia; beralih ke menu berbagi:', permissionError);
      }

      if (canSaveToGallery) {
        try {
          await MediaLibrary.createAssetAsync(imageUri);
          Alert.alert('QR tersimpan', 'QR pembayaran berhasil disimpan ke galeri.');
          return;
        } catch (saveError) {
          console.warn('Gagal menyimpan QR pembayaran ke galeri; beralih ke menu berbagi:', saveError);
        }
      }

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(imageUri, {
          mimeType: 'image/png',
          UTI: 'public.png',
          dialogTitle: 'Simpan QR pembayaran',
        });
        return;
      }

      throw new Error('Menu berbagi tidak tersedia di perangkat ini.');
    } catch (error) {
      console.error('Gagal mengunduh QR pembayaran:', error);
      Alert.alert(
        'Gagal menyimpan QR',
        error instanceof Error ? error.message : 'QR pembayaran tidak dapat disimpan.',
      );
    } finally {
      setIsSavingQr(false);
    }
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Ringkasan Tagihan */}
        <View style={styles.amountCard}>
          <View style={styles.amountIcon}>
            <Ionicons name="receipt-outline" size={21} color="#0F766E" />
          </View>
          <Text style={styles.amountLabel}>Total pembayaran</Text>
          <Text style={styles.amount}>{invoice ? formatRupiah(invoice.amount) : '-'}</Text>
          <Text style={styles.dueDate}>{invoice?.period ? `Tagihan WiFi · ${invoice.period}` : 'Tagihan terbaru'}</Text>

          {/* Badge Status Pembayaran */}
          <View style={[styles.paymentStatus, invoice?.status === 'Lunas' && styles.paymentStatusPaid]}>
            <Ionicons
              name={invoice?.status === 'Lunas' ? 'checkmark-circle' : 'alert-circle'}
              size={16}
              color={invoice?.status === 'Lunas' ? '#16804A' : '#9A5B08'}
            />
            <Text style={[styles.paymentStatusText, invoice?.status === 'Lunas' && styles.paymentStatusTextPaid]}>
              {invoice ? `${invoice.status}${invoice.paymentMethod ? ` · ${invoice.paymentMethod}` : ''}` : 'Tagihan tidak tersedia'}
            </Text>
          </View>
        </View>

        {invoice && invoice.status !== 'Lunas' && (
          <View style={styles.qrCard}>
            <View style={styles.qrHeading}>
              <Text style={styles.sectionTitle}>Instruksi pembayaran</Text>
            </View>
            <Text style={styles.instruction}>
              {invoice.qrCodeUri || invoice.qrCodeValue
                ? 'Gunakan QR pembayaran yang terhubung dengan tagihan ini.'
                : 'Gunakan QRIS WiFiPay dan masukkan nominal tagihan secara manual.'}
            </Text>

            <ViewShot
              ref={qrCaptureRef}
              options={{ format: 'png', quality: 1 }}
            >
              <View collapsable={false} style={styles.qrCapture}>
                {invoice.qrCodeUri ? (
                  <View style={styles.qrFrame}>
                    <Image source={{ uri: invoice.qrCodeUri }} style={styles.qrImage} resizeMode="contain" />
                  </View>
                ) : invoice.qrCodeValue ? (
                  <View style={styles.qrFrame}>
                    <QRCode value={invoice.qrCodeValue} size={218} />
                  </View>
                ) : (
                  <View style={styles.staticQrFrame}>
                    <Image
                      accessibilityLabel="QRIS pembayaran WiFiPay"
                      source={require('../../../assets/images/qr.jpeg')}
                      style={styles.staticQrImage}
                      resizeMode="cover"
                    />
                  </View>
                )}
              </View>
            </ViewShot>

            {!invoice.qrCodeUri && !invoice.qrCodeValue ? (
              <Text style={styles.qrPaymentHint}>
                Scan QRIS di atas lalu masukkan nominal tagihan {formatRupiah(invoice.amount)}.
              </Text>
            ) : null}
            <TouchableOpacity
              accessibilityRole="button"
              disabled={isSavingQr}
              onPress={() => void downloadQr()}
              style={[styles.downloadButton, isSavingQr && styles.disabledButton]}
            >
              {isSavingQr ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="download-outline" size={17} color="#FFFFFF" />
              )}
              <Text style={styles.downloadButtonText}>
                {isSavingQr ? 'Menyimpan...' : 'Unduh QR pembayaran'}
              </Text>
            </TouchableOpacity>

            <View style={styles.invoiceRow}>
              <Text style={styles.invoiceLabel}>Nomor invoice</Text>
              <Text style={styles.invoiceValue}>{invoice.id}</Text>
            </View>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F7F9FC' },
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
  instruction: { alignSelf: 'flex-start', color: '#778B8C', fontSize: 12, lineHeight: 18, marginTop: 8 },
  qrCapture: { alignItems: 'center', backgroundColor: '#FFFFFF' },
  qrFrame: { width: 250, height: 250, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', borderRadius: 14, marginTop: 18, marginBottom: 12, borderWidth: 1, borderColor: '#E8EFED', overflow: 'hidden' },
  qrImage: { width: 218, height: 218, borderRadius: 10 },
  staticQrFrame: { width: 280, height: 280, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', borderRadius: 14, marginTop: 18, marginBottom: 12, borderWidth: 1, borderColor: '#E8EFED', overflow: 'hidden' },
  staticQrImage: { width: 280, height: 280 },
  qrPaymentHint: { color: '#A96A08', fontSize: 11, lineHeight: 17, textAlign: 'center', marginTop: 4 },
  downloadButton: { width: '100%', minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, backgroundColor: '#0F766E', borderRadius: 11, marginTop: 12 },
  disabledButton: { opacity: 0.65 },
  downloadButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  invoiceRow: { width: '100%', paddingTop: 14, borderTopWidth: 1, borderTopColor: '#EDF1F0', alignItems: 'center' },
  invoiceLabel: { color: '#859495', fontSize: 10 },
  invoiceValue: { color: '#294449', fontSize: 12, fontWeight: '700', marginTop: 4 },
});