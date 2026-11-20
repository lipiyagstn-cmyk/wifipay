import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import RoleTabIcon from '../components/role-tab-icon';
import { COLORS } from '../constants/theme';
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
import type { RootStackParamList, PegawaiTabParamList, PelangganTabParamList } from './types';
import { createTabBarOptions } from './tabBarOptions';

const Stack = createNativeStackNavigator<RootStackParamList>();
const PegawaiTab = createBottomTabNavigator<PegawaiTabParamList>();
const PelangganTab = createBottomTabNavigator<PelangganTabParamList>();

function PegawaiTabs() {
  return (
    <PegawaiTab.Navigator screenOptions={createTabBarOptions(COLORS.pegawai)}>
      <PegawaiTab.Screen
        name="DashboardPegawai"
        component={PegawaiDashboardScreen}
        options={{ title: 'Home', tabBarIcon: ({ color, size, focused }) => <RoleTabIcon name="home-outline" size={size} color={color} focused={focused} accentColor={COLORS.pegawai} /> }}
      />
      <PegawaiTab.Screen
        name="DataPelanggan"
        component={DataPelangganScreen}
        options={{ title: 'Pelanggan', tabBarIcon: ({ color, size, focused }) => <RoleTabIcon name="people-outline" size={size} color={color} focused={focused} accentColor={COLORS.pegawai} /> }}
      />
      <PegawaiTab.Screen
        name="GangguanPegawai"
        component={GangguanPegawaiScreen}
        options={{ title: 'Gangguan', tabBarIcon: ({ color, size, focused }) => <RoleTabIcon name="warning-outline" size={size} color={color} focused={focused} accentColor={COLORS.pegawai} /> }}
      />
      <PegawaiTab.Screen
        name="KunjunganPegawai"
        component={KunjunganScreen}
        options={{ title: 'Kunjungan', tabBarIcon: ({ color, size, focused }) => <RoleTabIcon name="location-outline" size={size} color={color} focused={focused} accentColor={COLORS.pegawai} /> }}
      />
      <PegawaiTab.Screen
        name="ProfilPegawai"
        component={ProfilPegawaiScreen}
        options={{ title: 'Profil', tabBarIcon: ({ color, size, focused }) => <RoleTabIcon name="person-outline" size={size} color={color} focused={focused} accentColor={COLORS.pegawai} /> }}
      />
    </PegawaiTab.Navigator>
  );
}

function PelangganTabs() {
  return (
    <PelangganTab.Navigator screenOptions={createTabBarOptions(COLORS.pelanggan)}>
      <PelangganTab.Screen
        name="HomePelanggan"
        component={PelangganHomeScreen}
        options={{ title: 'Home', tabBarIcon: ({ color, size, focused }) => <RoleTabIcon name="home-outline" size={size} color={color} focused={focused} accentColor={COLORS.pelanggan} /> }}
      />
      <PelangganTab.Screen
        name="TagihanPelanggan"
        component={TagihanScreen}
        options={{ title: 'Tagihan', tabBarIcon: ({ color, size, focused }) => <RoleTabIcon name="receipt-outline" size={size} color={color} focused={focused} accentColor={COLORS.pelanggan} /> }}
      />
      <PelangganTab.Screen
        name="RiwayatPembayaran"
        component={RiwayatPembayaranScreen}
        options={{ title: 'Riwayat', tabBarIcon: ({ color, size, focused }) => <RoleTabIcon name="time-outline" size={size} color={color} focused={focused} accentColor={COLORS.pelanggan} /> }}
      />
      <PelangganTab.Screen
        name="KeluhanPelanggan"
        component={KeluhanPelangganScreen}
        options={{ title: 'Keluhan', tabBarIcon: ({ color, size, focused }) => <RoleTabIcon name="chatbubble-ellipses-outline" size={size} color={color} focused={focused} accentColor={COLORS.pelanggan} /> }}
      />
      <PelangganTab.Screen
        name="ProfilPelanggan"
        component={ProfilPelangganScreen}
        options={{ title: 'Profil', tabBarIcon: ({ color, size, focused }) => <RoleTabIcon name="person-outline" size={size} color={color} focused={focused} accentColor={COLORS.pelanggan} /> }}
      />
    </PelangganTab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerShown: false,
        headerStyle: { backgroundColor: '#FFFFFF' },
        headerTintColor: '#172B45',
        headerTitleStyle: { fontWeight: '700' },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: '#F7F9FC' },
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Admin" component={AdminNavigator} />
      <Stack.Screen name="PegawaiTabs" component={PegawaiTabs} />
      <Stack.Screen name="PelangganTabs" component={PelangganTabs} />
      <Stack.Screen name="BayarTagihan" component={BayarTagihanScreen} options={{ headerShown: true, title: 'Bayar Tagihan' }} />
      <Stack.Screen name="PembayaranPegawai" component={PembayaranScreen} options={{ headerShown: true, title: 'Pembayaran' }} />
    </Stack.Navigator>
  );
}