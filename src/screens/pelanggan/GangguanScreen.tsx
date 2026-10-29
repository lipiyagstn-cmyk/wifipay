import React, { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Image, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { PelangganTabParamList } from '../../navigation/types';
import { addComplaintReport, getComplaintReports, subscribeToComplaintReports } from '../../complaintStore';
import { useSyncExternalStore } from 'react';

type Props = BottomTabScreenProps<PelangganTabParamList, 'KeluhanPelanggan'>;
type Category = 'Internet lambat' | 'Tidak ada koneksi' | 'Masalah router' | 'Lainnya';

const categories: Array<{ label: Category; icon: keyof typeof Ionicons.glyphMap }> = [
  { label: 'Internet lambat', icon: 'speedometer-outline' },
  { label: 'Tidak ada koneksi', icon: 'wifi-outline' },
  { label: 'Masalah router', icon: 'hardware-chip-outline' },
  { label: 'Lainnya', icon: 'ellipsis-horizontal-circle-outline' },
];

export default function GangguanScreen({ navigation }: Props) {
  const [category, setCategory] = useState<Category>('Internet lambat');
  const [detail, setDetail] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState('');
  const [error, setError] = useState('');
  const complaints = useSyncExternalStore(subscribeToComplaintReports, getComplaintReports, getComplaintReports);

  const pickPhoto = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setPhotoError('Izinkan akses foto di pengaturan perangkat untuk melampirkan gambar.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        setPhotoUri(result.assets[0].uri);
        setPhotoError('');
      }
    } catch {
      setPhotoError('Galeri tidak dapat dibuka. Coba lagi atau periksa izin foto.');
    }
  };

  const submitComplaint = () => {
    if (detail.trim().length < 10) {
      setError('Jelaskan kendala minimal 10 karakter agar tim kami dapat membantu.');
      return;
    }

    addComplaintReport({
      category,
      detail: detail.trim(),
      customer: 'Budi Santoso',
      customerId: 'WFP-008241',
      address: 'Jl. Cikutra No. 12, Bandung',
      createdAt: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      priority: 'Sedang',
      photoUri,
    });
    setDetail('');
    setPhotoUri(null);
    setError('');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Keluhan & Bantuan</Text>
            <Text style={styles.subtitle}>Ceritakan kendala layanan WiFi Anda.</Text>
          </View>
          <View style={styles.headerIcon}>
            <Ionicons name="chatbubble-ellipses-outline" size={22} color="#0F766E" />
          </View>
        </View>

        <View style={styles.notice}>
          <Ionicons name="information-circle-outline" size={19} color="#0F766E" />
          <Text style={styles.noticeText}>Tim dukungan akan meninjau laporan dan menghubungi Anda melalui nomor terdaftar.</Text>
        </View>

        <Text style={styles.sectionTitle}>Apa kendala yang Anda alami?</Text>
        <View style={styles.categoryGrid}>
          {categories.map((item) => {
            const selected = category === item.label;
            return (
              <TouchableOpacity
                key={item.label}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => setCategory(item.label)}
                style={[styles.categoryOption, selected && styles.categoryOptionSelected]}
              >
                <Ionicons name={item.icon} size={19} color={selected ? '#0F766E' : '#748887'} />
                <Text style={[styles.categoryText, selected && styles.categoryTextSelected]}>{item.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>Foto pendukung <Text style={styles.optionalLabel}>Opsional</Text></Text>
        {photoUri ? (
          <View style={styles.photoPreviewWrap}>
            <Image source={{ uri: photoUri }} style={styles.photoPreview} />
            <TouchableOpacity accessibilityLabel="Hapus foto" onPress={() => setPhotoUri(null)} style={styles.removePhoto}>
              <Ionicons name="close" size={18} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.photoReadyBadge}>
              <Ionicons name="checkmark-circle" size={14} color="#16804A" />
              <Text style={styles.photoReadyText}>Foto terlampir</Text>
            </View>
          </View>
        ) : (
          <>
            <TouchableOpacity accessibilityRole="button" onPress={pickPhoto} style={styles.photoPicker}>
              <View style={styles.photoPickerIcon}>
                <Ionicons name="camera-outline" size={21} color="#0F766E" />
              </View>
              <View style={styles.photoPickerCopy}>
                <Text style={styles.photoPickerTitle}>Tambah foto kondisi</Text>
                <Text style={styles.photoPickerHint}>Pilih foto router atau lokasi kendala</Text>
              </View>
              <Ionicons name="add-circle-outline" size={22} color="#0F766E" />
            </TouchableOpacity>
            {photoError ? <Text accessibilityRole="alert" style={styles.photoError}>{photoError}</Text> : null}
          </>
        )}

        <Text style={[styles.sectionTitle, styles.detailHeading]}>Detail keluhan</Text>
        <TextInput
          accessibilityLabel="Detail keluhan"
          multiline
          maxLength={500}
          onChangeText={(value) => {
            setDetail(value);
            setError('');
          }}
          placeholder="Contoh: internet terputus sejak pukul 19.00 meskipun modem menyala..."
          placeholderTextColor="#9AA8A7"
          textAlignVertical="top"
          value={detail}
          style={styles.detailInput}
        />
        <View style={styles.inputFooter}>
          {error ? <Text accessibilityRole="alert" style={styles.errorText}>{error}</Text> : <Text style={styles.helperText}>Tuliskan lokasi dan waktu kejadian bila diketahui.</Text>}
          <Text style={styles.charCount}>{detail.length}/500</Text>
        </View>

        <TouchableOpacity accessibilityRole="button" onPress={submitComplaint} style={styles.submitButton}>
          <Text style={styles.submitText}>Kirim keluhan</Text>
          <Ionicons name="arrow-forward" size={17} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.historyHeader}>
          <Text style={styles.sectionTitle}>Laporan saya</Text>
          <Text style={styles.reportCount}>{complaints.length} laporan</Text>
        </View>
        {complaints.map((complaint) => (
          <View key={complaint.id} style={styles.complaintCard}>
            <View style={styles.complaintTop}>
              <View style={styles.complaintIcon}>
                <Ionicons name="chatbubble-outline" size={17} color="#0F766E" />
              </View>
              <View style={styles.complaintHeading}>
                <Text style={styles.complaintCategory}>{complaint.category}</Text>
                <Text style={styles.complaintMeta}>{complaint.id} · {complaint.createdAt}</Text>
              </View>
              <View style={styles.processingBadge}>
                <Text style={styles.processingText}>{complaint.status === 'Baru' ? 'Diterima' : complaint.status}</Text>
              </View>
            </View>
            <Text style={styles.complaintDetail}>{complaint.detail}</Text>
          {complaint.photoUri && <Image source={{ uri: complaint.photoUri }} style={styles.complaintPhoto} />}
          </View>
        ))}

        <TouchableOpacity accessibilityRole="button" onPress={() => navigation.navigate('HomePelanggan')} style={styles.homeLink}>
          <Ionicons name="arrow-back" size={15} color="#0F766E" />
          <Text style={styles.homeLinkText}>Kembali ke Home</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F5F8F8' },
  content: { paddingHorizontal: 18, paddingTop: 15, paddingBottom: 28 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 },
  title: { color: '#17363B', fontSize: 21, fontWeight: '800' },
  subtitle: { color: '#788B8D', fontSize: 12, marginTop: 5 },
  headerIcon: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EAF7F4' },
  notice: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#EAF7F4', borderRadius: 13, padding: 12, marginBottom: 20 },
  noticeText: { flex: 1, color: '#3F716B', fontSize: 11, lineHeight: 16 },
  sectionTitle: { color: '#244247', fontSize: 14, fontWeight: '800', marginBottom: 10 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 19 },
  categoryOption: { width: '48.5%', minHeight: 50, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 10, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5ECEA', borderRadius: 12, marginBottom: 8 },
  categoryOptionSelected: { backgroundColor: '#EAF7F4', borderColor: '#8CCFC1' },
  categoryText: { flex: 1, color: '#718381', fontSize: 10, fontWeight: '600' },
  categoryTextSelected: { color: '#0F766E', fontWeight: '700' },
  optionalLabel: { color: '#899896', fontSize: 10, fontWeight: '400' },
  photoPicker: { minHeight: 68, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderStyle: 'dashed', borderColor: '#9ACFC5', borderRadius: 13, paddingHorizontal: 11, marginBottom: 17 },
  photoPickerIcon: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EAF7F4', borderRadius: 11, marginRight: 10 },
  photoPickerCopy: { flex: 1 },
  photoPickerTitle: { color: '#294449', fontSize: 11, fontWeight: '700' },
  photoPickerHint: { color: '#899896', fontSize: 9, marginTop: 4 },
  photoPreviewWrap: { height: 150, borderRadius: 13, overflow: 'hidden', marginBottom: 17, backgroundColor: '#E8EFED' },
  photoPreview: { width: '100%', height: '100%' },
  removePhoto: { position: 'absolute', top: 9, right: 9, width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(25, 43, 42, 0.72)' },
  photoReadyBadge: { position: 'absolute', left: 9, bottom: 9, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#FFFFFF', borderRadius: 16, paddingHorizontal: 8, paddingVertical: 5 },
  photoReadyText: { color: '#16804A', fontSize: 9, fontWeight: '700' },
  photoError: { color: '#B54747', fontSize: 10, lineHeight: 15, marginTop: -10, marginBottom: 12 },
  detailHeading: { marginTop: 1 },
  detailInput: { minHeight: 116, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E1EAE8', borderRadius: 13, padding: 12, color: '#294449', fontSize: 12, lineHeight: 18 },
  inputFooter: { minHeight: 25, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 5 },
  helperText: { flex: 1, color: '#899896', fontSize: 9 },
  errorText: { flex: 1, color: '#B54747', fontSize: 9 },
  charCount: { color: '#99A5A3', fontSize: 9 },
  submitButton: { minHeight: 46, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#0F766E', borderRadius: 12, marginTop: 8, marginBottom: 23 },
  submitText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  historyHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 },
  reportCount: { color: '#879798', fontSize: 10 },
  complaintCard: { backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1, borderColor: '#E6EFED', padding: 12, marginBottom: 9 },
  complaintTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  complaintIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EAF7F4' },
  complaintHeading: { flex: 1 },
  complaintCategory: { color: '#294449', fontSize: 11, fontWeight: '700' },
  complaintMeta: { color: '#899896', fontSize: 9, marginTop: 3 },
  processingBadge: { backgroundColor: '#FFF4D9', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 15 },
  processingText: { color: '#A96A08', fontSize: 9, fontWeight: '700' },
  complaintDetail: { color: '#657876', fontSize: 10, lineHeight: 15, marginTop: 9 },
  complaintPhoto: { width: '100%', height: 135, borderRadius: 10, marginTop: 9, backgroundColor: '#E8EFED' },
  homeLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, marginTop: 4 },
  homeLinkText: { color: '#0F766E', fontSize: 11, fontWeight: '700' },
});