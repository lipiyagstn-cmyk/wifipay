import React, { useRef, useState, useSyncExternalStore } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import {
  Alert,
  FlatList,
  Image,
  Linking,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { parseCustomerAddressQr, type CustomerAddressQrPayload } from '../../customerQr';
import {
  getCustomers,
  subscribeToCustomers,
  updateCustomerHomePhoto,
  type Customer,
} from '../../customerStore';

export default function DataPelangganScreen() {
  const customers = useSyncExternalStore(subscribeToCustomers, getCustomers, getCustomers);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [scannerVisible, setScannerVisible] = useState(false);
  const [scanError, setScanError] = useState('');
  const [scannedCustomer, setScannedCustomer] = useState<CustomerAddressQrPayload | null>(null);
  const hasScanned = useRef(false);

  const openScanner = async () => {
    setScanError('');
    hasScanned.current = false;
    if (!cameraPermission?.granted) {
      const permission = await requestCameraPermission();
      if (!permission.granted) {
        Alert.alert(
          'Izin kamera diperlukan',
          'Izinkan akses kamera untuk memindai QR data pelanggan.',
          permission.canAskAgain
            ? [{ text: 'Mengerti' }]
            : [
              { text: 'Batal', style: 'cancel' },
              { text: 'Pengaturan', onPress: () => void Linking.openSettings() },
            ],
        );
        return;
      }
    }
    setScannerVisible(true);
  };

  const handleQrScanned = (result: BarcodeScanningResult) => {
    if (hasScanned.current) return;
    hasScanned.current = true;
    const payload = parseCustomerAddressQr(result.data);
    if (!payload) {
      setScanError('QR tidak berisi data pelanggan WiFiPay yang valid.');
      return;
    }

    setScannerVisible(false);
    setScannedCustomer(payload);
  };

  const chooseHomePhoto = async (customer: Customer) => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Izin foto diperlukan',
          'Izinkan akses galeri di pengaturan perangkat untuk menambahkan foto rumah pelanggan.',
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      const photo = result.assets?.[0];
      if (!result.canceled && photo) {
        updateCustomerHomePhoto(customer.id, photo.uri);
      }
    } catch (error) {
      console.error('Gagal membuka galeri foto rumah pelanggan:', error);
      Alert.alert('Foto tidak dapat dipilih', 'Galeri tidak dapat dibuka. Periksa izin foto lalu coba lagi.');
    }
  };

  const openHomePhoto = (customer: Customer) => {
    if (customer.homePhotoUri) {
      setSelectedCustomer(customer);
      return;
    }
    void chooseHomePhoto(customer);
  };

  const photoCustomer = selectedCustomer
    ? customers.find((customer) => customer.id === selectedCustomer.id) ?? selectedCustomer
    : null;

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Data Pelanggan</Text>
      <Text style={styles.subtitle}>Informasi alamat dan dokumentasi rumah pelanggan.</Text>
      <TouchableOpacity
        accessibilityRole="button"
        onPress={() => void openScanner()}
        style={styles.scanButton}
      >
        <Ionicons name="scan-outline" size={19} color="#FFFFFF" />
        <Text style={styles.scanButtonText}>Scan QR data pelanggan</Text>
      </TouchableOpacity>
      <FlatList
        data={customers}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeading}>
              <View style={styles.customerIcon}>
                <Ionicons name="person-outline" size={20} color="#2563EB" />
              </View>
              <View style={styles.customerCopy}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.customerId}>{item.id}</Text>
              </View>
              <Text style={[styles.status, item.status === 'Aktif' ? styles.active : styles.pending]}>
                {item.status}
              </Text>
            </View>

            <Text style={styles.meta}>Paket: {item.package}</Text>

            <View style={styles.addressRow}>
              <Ionicons name="location-outline" size={18} color="#64748B" />
              <Text style={styles.address}>{item.address}</Text>
            </View>

            <View style={styles.divider} />
            <View style={styles.actions}>
              <TouchableOpacity
                accessibilityRole="button"
                onPress={() => openHomePhoto(item)}
                style={styles.primaryButton}
              >
                <Ionicons
                  name={item.homePhotoUri ? 'image-outline' : 'camera-outline'}
                  size={17}
                  color="#FFFFFF"
                />
                <Text style={styles.primaryButtonText}>
                  {item.homePhotoUri ? 'Lihat Foto Rumah' : 'Tambah Foto Rumah'}
                </Text>
              </TouchableOpacity>
              {item.homePhotoUri ? (
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel={`Ganti foto rumah ${item.name}`}
                  onPress={() => void chooseHomePhoto(item)}
                  style={styles.replaceButton}
                >
                  <Ionicons name="refresh-outline" size={19} color="#2563EB" />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        )}
      />

      <Modal
        visible={photoCustomer !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedCustomer(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.photoModal}>
            <View style={styles.modalHeader}>
              <View style={styles.modalCopy}>
                <Text style={styles.modalTitle}>Foto Rumah</Text>
                {photoCustomer ? <Text style={styles.modalSubtitle}>{photoCustomer.name}</Text> : null}
              </View>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Tutup foto rumah"
                onPress={() => setSelectedCustomer(null)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={21} color="#475569" />
              </TouchableOpacity>
            </View>
            {photoCustomer?.homePhotoUri ? (
              <Image
                source={{ uri: photoCustomer.homePhotoUri }}
                resizeMode="contain"
                style={styles.homePhoto}
              />
            ) : null}
            {photoCustomer ? (
              <View style={styles.modalAddress}>
                <Ionicons name="location-outline" size={17} color="#64748B" />
                <Text style={styles.address}>{photoCustomer.address}</Text>
              </View>
            ) : null}
          </View>
        </View>
      </Modal>

      <Modal
        visible={scannerVisible}
        animationType="slide"
        onRequestClose={() => {
          setScannerVisible(false);
          setScanError('');
          hasScanned.current = false;
        }}
      >
        <View style={styles.scannerContainer}>
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={scanError ? undefined : handleQrScanned}
          />
          <View style={styles.scannerHeader}>
            <View>
              <Text style={styles.scannerTitle}>Scan QR data pelanggan</Text>
              <Text style={styles.scannerSubtitle}>Arahkan kamera ke QR pelanggan WiFiPay.</Text>
            </View>
            <TouchableOpacity
              accessibilityLabel="Tutup pemindai"
              onPress={() => {
                setScannerVisible(false);
                setScanError('');
                hasScanned.current = false;
              }}
              style={styles.scannerClose}
            >
              <Ionicons name="close" size={22} color="#172B45" />
            </TouchableOpacity>
          </View>
          <View pointerEvents="none" style={styles.scanFrameWrap}>
            <View style={styles.scanFrame} />
          </View>
          {scanError ? (
            <View style={styles.scanErrorCard}>
              <Text style={styles.scanErrorText}>{scanError}</Text>
              <TouchableOpacity
                accessibilityRole="button"
                onPress={() => {
                  setScanError('');
                  hasScanned.current = false;
                }}
                style={styles.retryButton}
              >
                <Text style={styles.retryText}>Coba scan lagi</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      </Modal>

      <Modal
        visible={scannedCustomer !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setScannedCustomer(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.addressResultCard}>
            <View style={styles.resultIcon}>
              <Ionicons name="person-outline" size={23} color="#2563EB" />
            </View>
            <Text style={styles.resultTitle}>Data pelanggan</Text>
            {scannedCustomer ? (
              <>
                <Text style={styles.resultName}>{scannedCustomer.name}</Text>
                <Text style={styles.resultId}>{scannedCustomer.customerId}</Text>
                {scannedCustomer.package ? (
                  <Text style={styles.resultMeta}>Paket: {scannedCustomer.package}</Text>
                ) : null}
                {scannedCustomer.status ? (
                  <Text style={styles.resultMeta}>Status: {scannedCustomer.status}</Text>
                ) : null}
                <Text style={styles.resultAddress}>{scannedCustomer.address}</Text>
              </>
            ) : null}
            <TouchableOpacity
              accessibilityRole="button"
              onPress={() => setScannedCustomer(null)}
              style={styles.resultButton}
            >
              <Text style={styles.resultButtonText}>Selesai</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', paddingHorizontal: 18, paddingTop: 16 },
  title: { fontSize: 24, fontWeight: '800', color: '#0F172A' },
  subtitle: { color: '#64748B', marginTop: 5, marginBottom: 13 },
  scanButton: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#2563EB', borderRadius: 11, marginBottom: 14 },
  scanButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  listContent: { paddingBottom: 20 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeading: { flexDirection: 'row', alignItems: 'center' },
  customerIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },
  customerCopy: { flex: 1 },
  name: { fontSize: 17, fontWeight: '700', color: '#0F172A' },
  customerId: { color: '#94A3B8', fontSize: 12, marginTop: 2 },
  meta: { color: '#64748B', marginTop: 12 },
  addressRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 10 },
  address: { flex: 1, color: '#475569', marginLeft: 7, lineHeight: 21 },
  status: { overflow: 'hidden', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, fontWeight: '700', fontSize: 12 },
  active: { backgroundColor: '#DCFCE7', color: '#166534' },
  pending: { backgroundColor: '#FEF3C7', color: '#92400E' },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 14 },
  actions: { flexDirection: 'row', alignItems: 'center' },
  primaryButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 11,
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  replaceButton: {
    width: 44,
    height: 44,
    marginLeft: 8,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBackdrop: {
    flex: 1,
    padding: 20,
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    justifyContent: 'center',
  },
  photoModal: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  modalCopy: { flex: 1 },
  modalTitle: { color: '#0F172A', fontSize: 18, fontWeight: '800' },
  modalSubtitle: { color: '#64748B', marginTop: 3 },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  homePhoto: { width: '100%', height: 320, backgroundColor: '#F1F5F9', borderRadius: 12 },
  modalAddress: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 13 },
  scannerContainer: { flex: 1, backgroundColor: '#0F172A', justifyContent: 'space-between' },
  scannerHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 54, marginHorizontal: 20, padding: 14, borderRadius: 15, backgroundColor: '#FFFFFF' },
  scannerTitle: { color: '#172B45', fontSize: 16, fontWeight: '800' },
  scannerSubtitle: { color: '#718096', fontSize: 11, marginTop: 4 },
  scannerClose: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 11, backgroundColor: '#F1F5F9' },
  scanFrameWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scanFrame: { width: 250, height: 250, borderWidth: 3, borderColor: '#FFFFFF', borderRadius: 22, backgroundColor: 'transparent' },
  scanErrorCard: { margin: 20, padding: 14, borderRadius: 14, backgroundColor: '#FFFFFF' },
  scanErrorText: { color: '#B42318', fontSize: 12, textAlign: 'center' },
  retryButton: { minHeight: 39, alignItems: 'center', justifyContent: 'center', backgroundColor: '#2563EB', borderRadius: 10, marginTop: 11 },
  retryText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  addressResultCard: { alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 18, padding: 20 },
  resultIcon: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EAF2FF', borderRadius: 15 },
  resultTitle: { color: '#172B45', fontSize: 17, fontWeight: '800', marginTop: 11 },
  resultName: { color: '#334155', fontSize: 14, fontWeight: '700', marginTop: 13 },
  resultId: { color: '#94A3B8', fontSize: 10, marginTop: 4 },
  resultMeta: { color: '#64748B', fontSize: 12, marginTop: 7 },
  resultAddress: { color: '#475569', fontSize: 13, lineHeight: 20, textAlign: 'center', marginTop: 12 },
  resultButton: { width: '100%', minHeight: 43, alignItems: 'center', justifyContent: 'center', borderRadius: 11, backgroundColor: '#2563EB', marginTop: 18 },
  resultButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
});
