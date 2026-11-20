
import React from 'react';
import { createNativeStackNavigator } from
  '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import RoleTabIcon from '../components/role-tab-icon';
import { COLORS } from '../constants/theme';
import DashboardAdmin from '../screens/admin/DashboardAdmin';
import DataPegawaiAdminScreen from '../screens/admin/DataPegawaiAdminScreen';
import DataPenggunaAdminScreen from '../screens/admin/DataPenggunaAdminScreen';
import DataTagihanAdminScreen from '../screens/admin/DataTagihanAdminScreen';
import KeuanganAdminScreen from '../screens/admin/KeuanganAdminScreen';
import PaketAdminScreen from '../screens/admin/PaketAdminScreen';
import LaporanAdminScreen from '../screens/admin/LaporanAdminScreen';
import NotifikasiAdminScreen from '../screens/admin/NotifikasiAdminScreen';
import ProfilAdminScreen from '../screens/admin/ProfilAdminScreen';
import PengaduanAdminScreen from '../screens/admin/PengaduanAdminScreen';
import type { AdminStackParamList, AdminTabParamList } from './adminTypes';
import { createTabBarOptions } from './tabBarOptions';

const Stack = createNativeStackNavigator<AdminStackParamList>();
const Tab = createBottomTabNavigator<AdminTabParamList>();

function AdminTabs() {
  return (
    <Tab.Navigator screenOptions={createTabBarOptions(COLORS.admin)}>
      <Tab.Screen
        name="DashboardAdmin"
        component={DashboardAdmin}
        options={{ title: 'Home', tabBarIcon: ({ color, size, focused }) => <RoleTabIcon name="home-outline" size={size} color={color} focused={focused} accentColor={COLORS.admin} /> }}
      />
      <Tab.Screen
        name="DataPenggunaAdmin"
        component={DataPenggunaAdminScreen}
        options={{ title: 'Pengguna', tabBarIcon: ({ color, size, focused }) => <RoleTabIcon name="people-outline" size={size} color={color} focused={focused} accentColor={COLORS.admin} /> }}
      />
      <Tab.Screen
        name="DataTagihanAdmin"
        component={DataTagihanAdminScreen}
        options={{ title: 'Tagihan', tabBarIcon: ({ color, size, focused }) => <RoleTabIcon name="receipt-outline" size={size} color={color} focused={focused} accentColor={COLORS.admin} /> }}
      />
      <Tab.Screen
        name="KeuanganAdmin"
        component={KeuanganAdminScreen}
        options={{ title: 'Keuangan', tabBarIcon: ({ color, size, focused }) => <RoleTabIcon name="wallet-outline" size={size} color={color} focused={focused} accentColor={COLORS.admin} /> }}
      />
      <Tab.Screen
        name="ProfilAdmin"
        component={ProfilAdminScreen}
        options={{ title: 'Profil', tabBarIcon: ({ color, size, focused }) => <RoleTabIcon name="person-outline" size={size} color={color} focused={focused} accentColor={COLORS.admin} /> }}
      />
    </Tab.Navigator>
  );
}

export default function AdminNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#FFFFFF' },
        headerTintColor: '#172B45',
        headerTitleStyle: { fontWeight: '700' },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: '#F7F9FC' },
      }}
    >
      <Stack.Screen name="AdminTabs" component={AdminTabs} options={{ headerShown: false }} />
      <Stack.Screen name="DataPegawaiAdmin" component={DataPegawaiAdminScreen} options={{ title: 'Data Pegawai' }} />
      <Stack.Screen name="PaketAdmin" component={PaketAdminScreen} options={{ title: 'Paket Internet' }} />
      <Stack.Screen name="LaporanAdmin" component={LaporanAdminScreen} options={{ title: 'Laporan' }} />
      <Stack.Screen name="NotifikasiAdmin" component={NotifikasiAdminScreen} options={{ title: 'Notifikasi' }} />
      <Stack.Screen name="PengaduanAdmin" component={PengaduanAdminScreen} options={{ title: 'Pengaduan' }} />
    </Stack.Navigator>
  );
}
