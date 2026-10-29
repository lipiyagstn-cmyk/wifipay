import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import LoginScreen from '../screens/LoginScreen';
import PegawaiDashboardScreen from '../screens/pegawai/PegawaiDashboardScreen';
import DataPelangganScreen from '../screens/pegawai/DataPelangganScreen';
import PembayaranScreen from '../screens/pegawai/PembayaranScreen';
import KunjunganScreen from '../screens/pegawai/KunjunganScreen';
import ProfilPegawaiScreen from '../screens/pegawai/ProfilScreen';
import PelangganHomeScreen from '../screens/pelanggan/PelangganHomeScreen';
import TagihanScreen from '../screens/pelanggan/TagihanScreen';
import BayarTagihanScreen from '../screens/pelanggan/BayarTagihanScreen';
import RiwayatPembayaranScreen from '../screens/pelanggan/RiwayatPembayaranScreen';
import ProfilPelangganScreen from '../screens/pelanggan/ProfilScreen';
import KeluhanPelangganScreen from '../screens/pelanggan/GangguanScreen';
import GangguanPegawaiScreen from '../screens/pegawai/GangguanScreen';
import AdminNavigator from './AdminNavigator';
import type { RootStackParamList } from './types';
import type { PegawaiTabParamList, PelangganTabParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const PegawaiTab = createBottomTabNavigator<PegawaiTabParamList>();
const PelangganTab = createBottomTabNavigator<PelangganTabParamList>();

const tabOptions = {
  headerShown: false,
  tabBarInactiveTintColor: '#94A3B8',
  tabBarStyle: { height: 64, paddingBottom: 9, paddingTop: 7 },
  tabBarLabelStyle: { fontSize: 11, fontWeight: '600' as const },
};

function PegawaiTabs() {
  return (
    <PegawaiTab.Navigator screenOptions={{ ...tabOptions, tabBarActiveTintColor: '#2563EB' }}>
      <PegawaiTab.Screen
        name="DashboardPegawai"
        component={PegawaiDashboardScreen}
        options={{ title: 'Home', tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} /> }}
      />
      <PegawaiTab.Screen
        name="DataPelanggan"
        component={DataPelangganScreen}
        options={{ title: 'Pelanggan', tabBarIcon: ({ color, size }) => <Ionicons name="people-outline" size={size} color={color} /> }}
      />
      <PegawaiTab.Screen
        name="GangguanPegawai"
        component={GangguanPegawaiScreen}
        options={{ title: 'Gangguan', tabBarIcon: ({ color, size }) => <Ionicons name="warning-outline" size={size} color={color} /> }}
      />
      <PegawaiTab.Screen
        name="KunjunganPegawai"
        component={KunjunganScreen}
        options={{ title: 'Kunjungan', tabBarIcon: ({ color, size }) => <Ionicons name="location-outline" size={size} color={color} /> }}
      />
      <PegawaiTab.Screen
        name="ProfilPegawai"
        component={ProfilPegawaiScreen}
        options={{ title: 'Profil', tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} /> }}
      />
    </PegawaiTab.Navigator>
  );
}

function PelangganTabs() {
  return (
    <PelangganTab.Navigator screenOptions={{ ...tabOptions, tabBarActiveTintColor: '#0F766E' }}>
      <PelangganTab.Screen
        name="HomePelanggan"
        component={PelangganHomeScreen}
        options={{ title: 'Home', tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} /> }}
      />
      <PelangganTab.Screen
        name="TagihanPelanggan"
        component={TagihanScreen}
        options={{ title: 'Tagihan', tabBarIcon: ({ color, size }) => <Ionicons name="receipt-outline" size={size} color={color} /> }}
      />
      <PelangganTab.Screen
        name="RiwayatPembayaran"
        component={RiwayatPembayaranScreen}
        options={{ title: 'Riwayat', tabBarIcon: ({ color, size }) => <Ionicons name="time-outline" size={size} color={color} /> }}
      />
      <PelangganTab.Screen
        name="KeluhanPelanggan"
        component={KeluhanPelangganScreen}
        options={{ title: 'Keluhan', tabBarIcon: ({ color, size }) => <Ionicons name="chatbubble-ellipses-outline" size={size} color={color} /> }}
      />
      <PelangganTab.Screen
        name="ProfilPelanggan"
        component={ProfilPelangganScreen}
        options={{ title: 'Profil', tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} /> }}
      />
    </PelangganTab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Admin" component={AdminNavigator} />
      <Stack.Screen name="PegawaiTabs" component={PegawaiTabs} />
      <Stack.Screen name="PelangganTabs" component={PelangganTabs} />
      <Stack.Screen name="BayarTagihan" component={BayarTagihanScreen} options={{ headerShown: true, title: 'Bayar Tagihan' }} />
      <Stack.Screen name="PembayaranPegawai" component={PembayaranScreen} options={{ headerShown: true, title: 'Pembayaran' }} />
    </Stack.Navigator>
  );
}