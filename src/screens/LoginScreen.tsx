import React, { useEffect, useRef, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
  type TextInputInstance,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { authenticate } from '../auth/demoAccounts';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const passwordInput = useRef<TextInputInstance>(null);
  const { height, width } = useWindowDimensions();
  const compact = keyboardVisible || height < 720;

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const handleLogin = () => {
    if (!identifier.trim() || !password) {
      setLoginError('Masukkan email/username dan password untuk melanjutkan.');
      return;
    }

    const user = authenticate(identifier, password);
    if (!user) {
      setLoginError('Email/username atau password tidak sesuai. Coba periksa kembali.');
      return;
    }

    setLoginError('');
    Keyboard.dismiss();
    const destination = user.role === 'admin'
      ? 'Admin'
      : user.role === 'pegawai'
        ? 'PegawaiTabs'
        : 'PelangganTabs';
    navigation.replace(destination);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingHorizontal: Math.min(width * 0.065, 24) },
            compact && styles.compactContent,
          ]}
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.contentWidth}>
            <View style={[styles.brand, compact && styles.compactBrand]}>
              <Image
                source={require('../../assets/images/logo.jpeg')}
                style={[styles.logo, compact && styles.compactLogo]}
                resizeMode="contain"
              />
              <Text style={styles.brandName}>WiFiPay</Text>
              {!keyboardVisible && height >= 590 && (
                <Text style={styles.tagline}>Manajemen layanan internet, lebih mudah.</Text>
              )}
            </View>

            <View style={[styles.form, compact && styles.compactForm]}>
              <Text style={styles.heading}>Selamat datang</Text>
              <Text style={styles.description}>Masuk untuk melanjutkan ke akun Anda.</Text>

              <Text style={styles.label}>Email atau username</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="person-outline" size={19} color="#64748B" />
                <TextInput
                  accessibilityLabel="Email atau username"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="username"
                  placeholder="nama@email.com"
                  placeholderTextColor="#94A3B8"
                  returnKeyType="next"
                  style={styles.input}
                  value={identifier}
                  onChangeText={(value) => {
                    setIdentifier(value);
                    setLoginError('');
                  }}
                  onSubmitEditing={() => passwordInput.current?.focus()}
                />
              </View>

              <Text style={styles.label}>Password</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="lock-closed-outline" size={19} color="#64748B" />
                <TextInput
                  ref={passwordInput}
                  accessibilityLabel="Password"
                  autoComplete="password"
                  placeholder="Masukkan password"
                  placeholderTextColor="#94A3B8"
                  returnKeyType="done"
                  secureTextEntry={!showPassword}
                  style={styles.input}
                  value={password}
                  onChangeText={(value) => {
                    setPassword(value);
                    setLoginError('');
                  }}
                  onSubmitEditing={handleLogin}
                />
                <TouchableOpacity
                  accessibilityLabel={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                  onPress={() => setShowPassword((visible) => !visible)}
                >
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#64748B" />
                </TouchableOpacity>
              </View>

              <TouchableOpacity accessibilityRole="button" activeOpacity={0.85} onPress={handleLogin} style={styles.loginButton}>
                <Text style={styles.loginText}>Masuk</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </TouchableOpacity>
              {loginError ? <Text accessibilityRole="alert" style={styles.errorText}>{loginError}</Text> : null}
              {!keyboardVisible && (
                <>
                  <Text style={styles.demoHint}>Demo Admin: admin / admin123</Text>
                  <Text style={styles.demoHint}>Demo Pegawai: pegawai / pegawai123</Text>
                  <Text style={styles.demoHint}>Demo Pelanggan: pelanggan / pelanggan123</Text>
                </>
              )}
            </View>
          </View>
        </ScrollView> 
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F6FC' },
  keyboardView: { flex: 1 },
  content: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 28 },
  compactContent: { paddingVertical: 12 },
  contentWidth: { width: '100%', maxWidth: 440 },
  brand: { alignItems: 'center', marginBottom: 30 },
  compactBrand: { marginBottom: 14 },
  logo: { width: 90, height: 90, marginBottom: 12 },
  compactLogo: { width: 64, height: 64, marginBottom: 7 },
  brandName: { color: '#0F172A', fontSize: 30, fontWeight: '800' },
  tagline: { color: '#64748B', marginTop: 5, fontSize: 13 },
  form: { backgroundColor: '#FFFFFF', borderRadius: 22, padding: 22, shadowColor: '#16324F', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.08, shadowRadius: 20, elevation: 4 },
  compactForm: { padding: 18 },
  heading: { color: '#0F172A', fontSize: 23, fontWeight: '800' },
  description: { color: '#64748B', fontSize: 13, marginTop: 5, marginBottom: 24 },
  label: { color: '#334155', fontSize: 13, fontWeight: '700', marginBottom: 8 },
  inputWrap: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: '#D9E2EC', borderRadius: 12, paddingHorizontal: 13, backgroundColor: '#FBFDFF', marginBottom: 17 },
  input: { flex: 1, color: '#0F172A', fontSize: 15, paddingVertical: 12 },
  loginButton: { minHeight: 52, marginTop: 6, backgroundColor: '#2563EB', borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 9 },
  loginText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  errorText: { color: '#B42318', fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 12 },
  demoHint: { color: '#94A3B8', fontSize: 11, textAlign: 'center', marginTop: 15 },
});