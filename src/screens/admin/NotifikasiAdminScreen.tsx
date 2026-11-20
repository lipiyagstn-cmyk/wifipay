import React, { useCallback, useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { api, getApiErrorMessage } from '../../api';
import { findApiList, getText, isRecord } from './adminApiUtils';

type AdminNotification = {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
};

function normalizeNotification(value: unknown): AdminNotification {
  if (!isRecord(value)) throw new Error('Format notifikasi dari backend tidak valid.');
  const id = getText(value, ['id', 'notification_id']);
  if (!id) throw new Error('Notifikasi dari backend tidak memiliki ID.');
  const isRead = value.read === true || value.is_read === true || value.read_at != null;
  return {
    id,
    title: getText(value, ['title', 'judul', 'type']) || 'Notifikasi WiFiPay',
    message: getText(value, ['message', 'body', 'pesan', 'description']),
    createdAt: getText(value, ['created_at', 'createdAt', 'tanggal']),
    read: isRead,
  };
}

export default function NotifikasiAdminScreen() {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get<unknown>('/admin/notifications');
      const list = findApiList(data, ['notifications', 'notifikasi']);
      if (!list) throw new Error('Format daftar notifikasi dari backend tidak valid.');
      setNotifications(list.map(normalizeNotification));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications().catch((error: unknown) => {
      Alert.alert('Gagal memuat notifikasi', getApiErrorMessage(error));
    });
  }, [loadNotifications]);

  const markRead = async (id: string) => {
    try {
      await api.patch(`/admin/notifications/${encodeURIComponent(id)}/read`);
      setNotifications((current) => current.map((item) => item.id === id ? { ...item, read: true } : item));
    } catch (error) {
      Alert.alert('Gagal memperbarui notifikasi', getApiErrorMessage(error));
    }
  };

  const markAllRead = async () => {
    try {
      await api.patch('/admin/notifications/read-all');
      setNotifications((current) => current.map((item) => ({ ...item, read: true })));
    } catch (error) {
      Alert.alert('Gagal memperbarui notifikasi', getApiErrorMessage(error));
    }
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heading}>
          <View style={styles.headingCopy}>
            <Text style={styles.title}>Notifikasi admin</Text>
            <Text style={styles.subtitle}>Pemberitahuan akun dan operasional.</Text>
          </View>
          <TouchableOpacity accessibilityRole="button" onPress={markAllRead} disabled={!notifications.some((item) => !item.read)} style={styles.readAllButton}>
            <Text style={styles.readAllText}>Baca semua</Text>
          </TouchableOpacity>
        </View>
        {loading ? <ActivityIndicator color="#2563EB" /> : notifications.length ? notifications.map((item) => (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={item.read ? item.title : `${item.title}, tandai dibaca`}
            key={item.id}
            onPress={() => !item.read && void markRead(item.id)}
            style={[styles.card, !item.read && styles.unreadCard]}
          >
            <View style={[styles.iconWrap, !item.read && styles.unreadIcon]}>
              <Ionicons name="notifications-outline" size={18} color={!item.read ? '#2563EB' : '#718096'} />
            </View>
            <View style={styles.copy}>
              <View style={styles.titleRow}>
                <Text style={styles.notificationTitle}>{item.title}</Text>
                {!item.read ? <View style={styles.dot} /> : null}
              </View>
              {item.message ? <Text style={styles.message}>{item.message}</Text> : null}
              {item.createdAt ? <Text style={styles.date}>{item.createdAt}</Text> : null}
            </View>
          </TouchableOpacity>
        )) : (
          <View style={styles.empty}>
            <Ionicons name="notifications-off-outline" size={28} color="#94A3B8" />
            <Text style={styles.emptyText}>Belum ada notifikasi.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F7F9FC' },
  content: { padding: 18, paddingBottom: 30 },
  heading: { flexDirection: 'row', alignItems: 'center', marginBottom: 17 },
  headingCopy: { flex: 1 },
  title: { color: '#172B45', fontSize: 21, fontWeight: '800' },
  subtitle: { color: '#718096', fontSize: 12, marginTop: 4 },
  readAllButton: { backgroundColor: '#EAF2FF', paddingHorizontal: 11, paddingVertical: 9, borderRadius: 10 },
  readAllText: { color: '#2563EB', fontSize: 10, fontWeight: '700' },
  card: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E8EDF3', borderRadius: 14, padding: 13, marginBottom: 9 },
  unreadCard: { borderColor: '#BFD4FF', backgroundColor: '#FBFDFF' },
  iconWrap: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F1F4F8', marginRight: 10 },
  unreadIcon: { backgroundColor: '#EAF2FF' },
  copy: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  notificationTitle: { flex: 1, color: '#26384E', fontSize: 13, fontWeight: '700' },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#2563EB' },
  message: { color: '#64748B', fontSize: 11, lineHeight: 16, marginTop: 5 },
  date: { color: '#94A3B8', fontSize: 10, marginTop: 7 },
  empty: { alignItems: 'center', gap: 8, backgroundColor: '#FFFFFF', padding: 25, borderRadius: 15 },
  emptyText: { color: '#718096', fontSize: 12 },
});
