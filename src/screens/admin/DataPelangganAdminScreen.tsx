import React, { useRef, useState, useSyncExternalStore } from 'react';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import * as QrImage from 'qrcode';
import * as MediaLibrary from 'expo-media-library';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import ViewShot, { type ViewShotRef } from 'react-native-view-shot';
import {
  ActivityIndicator,
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  createCustomer,
  deleteCustomer,
  getCustomers,
  subscribeToCustomers,
  updateCustomer,
  type Customer,
} from '../../customerStore';
import { createCustomerAddressQr } from '../../customerQr';
import { deleteInvoicePayment } from '../../paymentStore';

const packages = ['10 Mbps', '20 Mbps', '30 Mbps'] as const;
type CustomerPackage = (typeof packages)[number];
type CustomerStatus = Customer['status'];

export default function DataPelangganAdminScreen() {
  const customers = useSyncExternalStore(subscribeToCustomers, getCustomers, getCustomers);
  const [formVisible, setFormVisible] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [qrCustomer, setQrCustomer] = useState<Customer | null>(null);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [packageName, setPackageName] = useState<CustomerPackage>('20 Mbps');
  const [status, setStatus] = useState<CustomerStatus>('Aktif');
  const [formError, setFormError] = useState('');
  const [qrAction, setQrAction] = useState<'download' | 'print' | null>(null);
  const qrCaptureRef = useRef<ViewShotRef>(null);

  const downloadQr = async () => {
    if (!currentQrCustomer || qrAction) return;
    setQrAction('download');

    try {
      const imageUri = await qrCaptureRef.current?.capture();
      if (!imageUri) {
        throw new Error('Gambar QR belum siap. Tutup lalu buka kembali QR pelanggan.');
      }

      const permission = await MediaLibrary.requestPermissionsAsync(true, ['photo']);
      if (permission.granted) {
        try {
          await MediaLibrary.saveToLibraryAsync(imageUri);
          Alert.alert('QR tersimpan', `QR ${currentQrCustomer.name} sudah disimpan ke galeri.`);
          return;
        } catch (error) {
          console.error('Gagal menyimpan QR langsung ke galeri:', error);
        }
      }

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(imageUri, {
          mimeType: 'image/png',
          UTI: 'public.png',
          dialogTitle: `Simpan QR ${currentQrCustomer.name}`,
        });
        return;
      }

      Alert.alert(
        'Izin galeri diperlukan',
        'Izinkan akses galeri di pengaturan perangkat, lalu coba simpan QR kembali.',
      );
    } catch (error) {
      console.error('Gagal mengunduh QR pelanggan:', error);
      Alert.alert(
        'Gagal menyimpan QR',
        error instanceof Error ? error.message : 'Gambar QR tidak dapat disimpan ke galeri.',
      );
    } finally {
      setQrAction(null);
    }
  };

  const printQr = async () => {
    if (!currentQrCustomer || qrAction) return;
    setQrAction('print');

    try {
      const svg = await QrImage.toString(createCustomerAddressQr(currentQrCustomer), {
        type: 'svg',
        width: 720,
        margin: 4,
        color: { dark: '#000000', light: '#FFFFFF' },
      });
      const escapeHtml = (value: string) => value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

      await Print.printAsync({
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <style>
                body { font-family: Arial, sans-serif; color: #172B45; text-align: center; padding: 32px 20px; }
                .qr { width: 280px; height: 280px; margin: 24px auto; }
                h1 { font-size: 22px; margin-bottom: 8px; }
                p { font-size: 14px; line-height: 1.5; }
                .id { color: #64748B; font-size: 12px; }
              </style>
            </head>
            <body>
              <h1>${escapeHtml(currentQrCustomer.name)}</h1>
              <p class="id">${escapeHtml(currentQrCustomer.id)}</p>
              <div class="qr">${svg}</div>
              <p>${escapeHtml(currentQrCustomer.address)}</p>
            </body>
          </html>
        `,
      });
    } catch (error) {
      console.error('Gagal mencetak QR pelanggan:', error);
      Alert.alert(
        'Gagal mencetak QR',
        error instanceof Error ? error.message : 'Dokumen QR tidak dapat dicetak.',
      );
    } finally {
      setQrAction(null);
    }
  };

  const openNewCustomer = () => {
    setEditingCustomer(null);
    setName('');
    setAddress('');
    setPackageName('20 Mbps');
    setStatus('Aktif');
    setFormError('');
    setFormVisible(true);
  };

  const openEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setName(customer.name);
    setAddress(customer.address);
    setPackageName(packages.find((item) => item === customer.package) ?? '20 Mbps');
    setStatus(customer.status);
    setFormError('');
    setFormVisible(true);
  };

  const saveCustomer = () => {
    if (!name.trim() || !address.trim()) {
      setFormError('Nama dan alamat pelanggan wajib diisi.');
      return;
    }

    if (editingCustomer) {
      updateCustomer(editingCustomer.id, {
        ...editingCustomer,
        name: name.trim(),
        address: address.trim(),
        package: packageName,
        status,
      });
    } else {
      createCustomer({
        name: name.trim(),
        address: address.trim(),
        package: packageName,
        status,
      });
    }
    setFormVisible(false);
  };

  const confirmDelete = (customer: Customer) => {
    Alert.alert(
      'Hapus pelanggan?',
      `Data ${customer.name} dan catatan pembayarannya akan dihapus dari perangkat ini.`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: () => {
            deleteInvoicePayment(customer.id);
            deleteCustomer(customer.id);
          },
        },
      ],
    );
  };

  const currentQrCustomer = qrCustomer
    ? customers.find((customer) => customer.id === qrCustomer.id) ?? qrCustomer
    : null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heading}>
          <View style={styles.headingCopy}>
            <Text style={styles.title}>Data pelanggan</Text>
            <Text style={styles.subtitle}>Kelola profil, paket, dan QR data pelanggan.</Text>
          </View>
          <View style={styles.totalBadge}>
            <Text style={styles.totalText}>{customers.length} pelanggan</Text>
          </View>
        </View>

        <TouchableOpacity
          accessibilityRole="button"
          onPress={openNewCustomer}
          style={styles.addButton}
        >
          <Ionicons name="person-add-outline" size={19} color="#FFFFFF" />
          <Text style={styles.addButtonText}>Tambah pelanggan</Text>
        </TouchableOpacity>

        {customers.length ? customers.map((customer) => (
          <View key={customer.id} style={styles.card}>
            <View style={styles.cardHeading}>
              <View style={styles.customerIcon}>
                <Ionicons name="person-outline" size={20} color="#2563EB" />
              </View>
              <View style={styles.customerCopy}>
                <Text style={styles.name}>{customer.name}</Text>
                <Text style={styles.customerId}>{customer.id}</Text>
              </View>
              <Text style={[styles.status, customer.status === 'Aktif' ? styles.active : styles.pending]}>
                {customer.status}
              </Text>
            </View>

            <View style={styles.metaRow}>
              <Ionicons name="wifi-outline" size={15} color="#64748B" />
              <Text style={styles.meta}>{customer.package}</Text>
            </View>
            <View style={styles.addressRow}>
              <Ionicons name="location-outline" size={17} color="#64748B" />
              <Text style={styles.address}>{customer.address}</Text>
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity
                accessibilityRole="button"
                onPress={() => setQrCustomer(customer)}
                style={[styles.actionButton, styles.qrButton]}
              >
                <Ionicons name="qr-code-outline" size={17} color="#2563EB" />
                <Text style={styles.qrText}>QR Data Pelanggan</Text>
              </TouchableOpacity>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={`Edit ${customer.name}`}
                onPress={() => openEditCustomer(customer)}
                style={styles.iconButton}
              >
                <Ionicons name="create-outline" size={19} color="#2563EB" />
              </TouchableOpacity>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={`Hapus ${customer.name}`}
                onPress={() => confirmDelete(customer)}
                style={styles.iconButton}
              >
                <Ionicons name="trash-outline" size={18} color="#DC4C4C" />
              </TouchableOpacity>
            </View>
          </View>
        )) : (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={30} color="#94A3B8" />
            <Text style={styles.emptyText}>Belum ada data pelanggan.</Text>
          </View>
        )}
        <Text style={styles.disclaimer}>Data disimpan lokal di perangkat selama aplikasi berjalan.</Text>
      </ScrollView>

      <Modal
        visible={formVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFormVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <ScrollView contentContainerStyle={styles.modalScroll} keyboardShouldPersistTaps="handled">
            <View style={styles.formCard}>
              <View style={styles.formHeading}>
                <View style={styles.formCopy}>
                  <Text style={styles.formTitle}>{editingCustomer ? 'Edit pelanggan' : 'Pelanggan baru'}</Text>
                  <Text style={styles.formSubtitle}>Isi informasi pelanggan WiFiPay.</Text>
                </View>
                <TouchableOpacity accessibilityLabel="Tutup form" onPress={() => setFormVisible(false)} style={styles.closeButton}>
                  <Ionicons name="close" size={20} color="#475569" />
                </TouchableOpacity>
              </View>

              <Text style={styles.fieldLabel}>Nama</Text>
              <TextInput
                accessibilityLabel="Nama pelanggan"
                autoCapitalize="words"
                onChangeText={setName}
                placeholder="Nama lengkap"
                placeholderTextColor="#94A3B8"
                style={styles.input}
                value={name}
              />
              <Text style={styles.fieldLabel}>Alamat pemasangan</Text>
              <TextInput
                accessibilityLabel="Alamat pelanggan"
                autoCapitalize="sentences"
                multiline
                onChangeText={setAddress}
                placeholder="Alamat lengkap pelanggan"
                placeholderTextColor="#94A3B8"
                style={[styles.input, styles.multilineInput]}
                value={address}
              />
              <Text style={styles.fieldLabel}>Paket internet</Text>
              <View style={styles.choiceRow}>
                {packages.map((item) => (
                  <TouchableOpacity
                    key={item}
                    accessibilityRole="button"
                    accessibilityState={{ selected: packageName === item }}
                    onPress={() => setPackageName(item)}
                    style={[styles.choice, packageName === item && styles.selectedChoice]}
                  >
                    <Text style={[styles.choiceText, packageName === item && styles.selectedChoiceText]}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.fieldLabel}>Status pelanggan</Text>
              <View style={styles.choiceRow}>
                {(['Aktif', 'Menunggu'] as const).map((item) => (
                  <TouchableOpacity
                    key={item}
                    accessibilityRole="button"
                    accessibilityState={{ selected: status === item }}
                    onPress={() => setStatus(item)}
                    style={[styles.choice, status === item && styles.selectedChoice]}
                  >
                    <Text style={[styles.choiceText, status === item && styles.selectedChoiceText]}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {formError ? <Text accessibilityRole="alert" style={styles.formError}>{formError}</Text> : null}
              <TouchableOpacity accessibilityRole="button" onPress={saveCustomer} style={styles.saveButton}>
                <Text style={styles.saveButtonText}>{editingCustomer ? 'Simpan perubahan' : 'Simpan pelanggan'}</Text>
              </TouchableOpacity>
              <TouchableOpacity accessibilityRole="button" onPress={() => setFormVisible(false)} style={styles.cancelButton}>
                <Text style={styles.cancelText}>Batal</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      <Modal
        visible={currentQrCustomer !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setQrCustomer(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.qrCard}>
            <View style={styles.qrHeading}>
              <View style={styles.formCopy}>
                <Text style={styles.formTitle}>QR data pelanggan</Text>
                {currentQrCustomer ? <Text style={styles.formSubtitle}>{currentQrCustomer.name} · {currentQrCustomer.id}</Text> : null}
              </View>
              <TouchableOpacity accessibilityLabel="Tutup QR" onPress={() => setQrCustomer(null)} style={styles.closeButton}>
                <Ionicons name="close" size={20} color="#475569" />
              </TouchableOpacity>
            </View>
            {currentQrCustomer ? (
              <>
                <View style={styles.qrCode}>
                  <ViewShot ref={qrCaptureRef} options={{ format: 'png', quality: 1 }}>
                    <View style={styles.qrCapture}>
                      <QRCode value={createCustomerAddressQr(currentQrCustomer)} size={210} />
                    </View>
                  </ViewShot>
                </View>
                <View style={styles.qrAddress}>
                  <Ionicons name="location-outline" size={17} color="#2563EB" />
                  <Text style={styles.address}>{currentQrCustomer.address}</Text>
                </View>
                <Text style={styles.qrMeta}>
                  Paket: {currentQrCustomer.package} · Status: {currentQrCustomer.status}
                </Text>
                <Text style={styles.qrHint}>QR ini berisi ID, nama, alamat, paket, dan status pelanggan. Pegawai dapat memindainya dari menu Data Pelanggan.</Text>
                <View style={styles.qrActions}>
                  <TouchableOpacity
                    accessibilityRole="button"
                    disabled={qrAction !== null}
                    onPress={() => void downloadQr()}
                    style={[styles.qrActionButton, styles.downloadButton, qrAction !== null && styles.disabledButton]}
                  >
                    {qrAction === 'download' ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Ionicons name="download-outline" size={17} color="#FFFFFF" />
                    )}
                    <Text style={styles.qrActionText}>Unduh ke galeri</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    accessibilityRole="button"
                    disabled={qrAction !== null}
                    onPress={() => void printQr()}
                    style={[styles.qrActionButton, styles.printButton, qrAction !== null && styles.disabledButton]}
                  >
                    {qrAction === 'print' ? (
                      <ActivityIndicator size="small" color="#2563EB" />
                    ) : (
                      <Ionicons name="print-outline" size={17} color="#2563EB" />
                    )}
                    <Text style={styles.printButtonText}>Cetak QR</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : null}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F7F9FC' },
  content: { padding: 18, paddingBottom: 30 },
  heading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  headingCopy: { flex: 1, paddingRight: 8 },
  title: { color: '#172B45', fontSize: 22, fontWeight: '800' },
  subtitle: { color: '#718096', fontSize: 12, lineHeight: 17, marginTop: 4 },
  totalBadge: { backgroundColor: '#EAF2FF', paddingHorizontal: 9, paddingVertical: 7, borderRadius: 10 },
  totalText: { color: '#2563EB', fontSize: 10, fontWeight: '700' },
  addButton: { minHeight: 45, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#2563EB', borderRadius: 12, marginBottom: 14 },
  addButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, marginBottom: 11, borderWidth: 1, borderColor: '#EDF0F5' },
  cardHeading: { flexDirection: 'row', alignItems: 'center' },
  customerIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  customerCopy: { flex: 1 },
  name: { color: '#172B45', fontSize: 14, fontWeight: '700' },
  customerId: { color: '#94A3B8', fontSize: 10, marginTop: 3 },
  status: { overflow: 'hidden', paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999, fontWeight: '700', fontSize: 10 },
  active: { backgroundColor: '#DCFCE7', color: '#166534' },
  pending: { backgroundColor: '#FEF3C7', color: '#92400E' },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 6 },
  meta: { color: '#64748B', fontSize: 11 },
  addressRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 8 },
  address: { flex: 1, color: '#475569', fontSize: 11, lineHeight: 17, marginLeft: 6 },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 13, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  actionButton: { minHeight: 38, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 10 },
  qrButton: { flex: 1, backgroundColor: '#EFF6FF' },
  qrText: { color: '#2563EB', fontSize: 11, fontWeight: '700' },
  iconButton: { width: 40, minHeight: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: '#F4F7FB' },
  emptyState: { alignItems: 'center', padding: 28, backgroundColor: '#FFFFFF', borderRadius: 15 },
  emptyText: { color: '#718096', fontSize: 12, marginTop: 9 },
  disclaimer: { color: '#9AA6B5', fontSize: 10, textAlign: 'center', marginTop: 9 },
  modalBackdrop: { flex: 1, justifyContent: 'center', padding: 18, backgroundColor: 'rgba(20, 39, 59, 0.48)' },
  modalScroll: { flexGrow: 1, justifyContent: 'center' },
  formCard: { backgroundColor: '#FFFFFF', borderRadius: 19, padding: 18 },
  formHeading: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 15 },
  formCopy: { flex: 1, paddingRight: 8 },
  formTitle: { color: '#203951', fontSize: 18, fontWeight: '800' },
  formSubtitle: { color: '#718096', fontSize: 11, lineHeight: 16, marginTop: 4 },
  closeButton: { width: 33, height: 33, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F1F5F9', borderRadius: 11 },
  fieldLabel: { color: '#334155', fontSize: 11, fontWeight: '700', marginBottom: 6 },
  input: { minHeight: 42, borderWidth: 1, borderColor: '#D9E2EC', borderRadius: 10, paddingHorizontal: 11, color: '#172B45', fontSize: 12, marginBottom: 13, backgroundColor: '#FBFDFF' },
  multilineInput: { minHeight: 68, paddingTop: 10, textAlignVertical: 'top' },
  choiceRow: { flexDirection: 'row', gap: 7, marginBottom: 14 },
  choice: { flex: 1, minHeight: 37, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0' },
  selectedChoice: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  choiceText: { color: '#64748B', fontSize: 10, fontWeight: '700' },
  selectedChoiceText: { color: '#FFFFFF' },
  formError: { color: '#B42318', fontSize: 11, marginBottom: 8 },
  saveButton: { minHeight: 44, alignItems: 'center', justifyContent: 'center', backgroundColor: '#2563EB', borderRadius: 11, marginTop: 3 },
  saveButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  cancelButton: { minHeight: 38, alignItems: 'center', justifyContent: 'center' },
  cancelText: { color: '#64748B', fontSize: 11, fontWeight: '700' },
  qrCard: { alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 19, padding: 18 },
  qrHeading: { width: '100%', flexDirection: 'row', alignItems: 'flex-start', marginBottom: 17 },
  qrCode: { padding: 13, borderRadius: 15, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5EAF1' },
  qrCapture: { width: 210, height: 210, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' },
  qrAddress: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 16 },
  qrMeta: { color: '#475569', fontSize: 11, fontWeight: '700', marginTop: 10 },
  qrHint: { color: '#8A96A6', fontSize: 10, lineHeight: 15, textAlign: 'center', marginTop: 12 },
  qrActions: { width: '100%', flexDirection: 'row', gap: 9, marginTop: 16 },
  qrActionButton: { flex: 1, minHeight: 43, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, borderRadius: 11 },
  downloadButton: { backgroundColor: '#2563EB' },
  printButton: { backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE' },
  disabledButton: { opacity: 0.6 },
  qrActionText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  printButtonText: { color: '#2563EB', fontSize: 11, fontWeight: '700' },
});
