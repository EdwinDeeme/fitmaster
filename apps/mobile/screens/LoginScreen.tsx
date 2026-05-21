'use client';
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { FitMasterLogo } from '../components/FitMasterLogo';
import { login, AuthUser } from '../lib/auth';

interface Props {
  onLoginSuccess: (user: AuthUser) => void;
  onChangePassword: () => void;
}

export function LoginScreen({ onLoginSuccess, onChangePassword }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Campos requeridos', 'Por favor ingresa tu email y contraseña.');
      return;
    }
    setLoading(true);
    try {
      const result = await login(email.trim().toLowerCase(), password);
      onLoginSuccess(result.user);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Credenciales incorrectas. Intenta de nuevo.';
      Alert.alert('Error', Array.isArray(msg) ? msg.join('\n') : msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}
        overScrollMode="never"
      >
        {/* Logo row */}
        <View style={styles.logoRow}>
          <FitMasterLogo size={64} />
          <Text style={styles.brandName}>FitMaster</Text>
        </View>

        {/* Welcome */}
        <View style={styles.welcomeBlock}>
          <Text style={styles.welcomeTitle}>Bienvenido</Text>
          <Text style={styles.welcomeSub}>Inserte los detalles de su cuenta</Text>
        </View>

        {/* Inputs */}
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Inserte su email"
            placeholderTextColor="#9CA3AF"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <View style={styles.passwordWrapper}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Inserte su contraseña"
              placeholderTextColor="#9CA3AF"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(v => !v)}
              style={styles.eyeBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              {showPassword
                ? <Feather name="eye-off" size={20} color="#9CA3AF" />
                : <Feather name="eye" size={20} color="#9CA3AF" />}
            </TouchableOpacity>
          </View>
        </View>

        {/* Login button */}
        <TouchableOpacity
          style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator color="#212121" />
            : <Text style={styles.loginBtnText}>Iniciar sesión</Text>}
        </TouchableOpacity>

        {/* Change password */}
        <TouchableOpacity onPress={onChangePassword} style={styles.changePassBtn}>
          <Text style={styles.changePassText}>Cambiar contraseña</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F1F2F6',
  },
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingVertical: 48,
  },

  // Logo
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 36,
  },
  brandName: {
    fontSize: 26,
    fontWeight: '800',
    color: '#212121',
    letterSpacing: 0.5,
  },

  // Welcome
  welcomeBlock: {
    alignItems: 'center',
    marginBottom: 32,
  },
  welcomeTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#212121',
    marginBottom: 6,
  },
  welcomeSub: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
  },

  // Form
  form: {
    width: '100%',
    gap: 12,
    marginBottom: 24,
  },
  input: {
    width: '100%',
    height: 54,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 18,
    fontSize: 15,
    color: '#212121',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  passwordWrapper: {
    width: '100%',
    height: 54,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  passwordInput: {
    flex: 1,
    fontSize: 15,
    color: '#212121',
  },
  eyeBtn: {
    paddingLeft: 8,
  },

  // Button
  loginBtn: {
    width: '100%',
    height: 54,
    backgroundColor: '#C1EF00',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#C1EF00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  loginBtnDisabled: {
    opacity: 0.7,
  },
  loginBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#212121',
    letterSpacing: 0.3,
  },

  // Change password
  changePassBtn: {
    paddingVertical: 4,
  },
  changePassText: {
    fontSize: 14,
    color: '#212121',
    textDecorationLine: 'underline',
    fontWeight: '500',
  },
});
