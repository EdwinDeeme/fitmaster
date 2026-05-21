import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { FitMasterLogo } from '../components/FitMasterLogo';
import api from '../lib/api';
import * as SecureStore from 'expo-secure-store';

interface Props {
  onSuccess: () => void;
}

export function ChangePasswordScreen({ onSuccess }: Props) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!current || !next || !confirm) {
      Alert.alert('Campos requeridos', 'Completa todos los campos.');
      return;
    }
    if (next.length < 8) {
      Alert.alert('Contraseña muy corta', 'La nueva contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (next !== confirm) {
      Alert.alert('No coinciden', 'La nueva contraseña y la confirmación no coinciden.');
      return;
    }
    setLoading(true);
    try {
      await api.patch('/api/v1/auth/change-password', {
        currentPassword: current,
        newPassword: next,
      });
      // Update stored user
      const raw = await SecureStore.getItemAsync('user');
      if (raw) {
        const user = JSON.parse(raw);
        user.mustChangePassword = false;
        await SecureStore.setItemAsync('user', JSON.stringify(user));
      }
      onSuccess();
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Error al cambiar la contraseña.';
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
        {/* Logo */}
        <View style={styles.logoRow}>
          <FitMasterLogo size={64} />
          <Text style={styles.brandName}>FitMaster</Text>
        </View>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Cambia tu contraseña</Text>
          <Text style={styles.subtitle}>
            Por seguridad debes cambiar tu contraseña temporal antes de continuar.
          </Text>
        </View>

        {/* Fields */}
        <View style={styles.form}>
          {[
            { label: 'Contraseña temporal', value: current, set: setCurrent, show: showCurrent, toggle: () => setShowCurrent(v => !v) },
            { label: 'Nueva contraseña', value: next, set: setNext, show: showNext, toggle: () => setShowNext(v => !v) },
            { label: 'Confirmar contraseña', value: confirm, set: setConfirm, show: showConfirm, toggle: () => setShowConfirm(v => !v) },
          ].map(({ label, value, set, show, toggle }) => (
            <View key={label}>
              <Text style={styles.fieldLabel}>{label}</Text>
              <View style={styles.passwordWrapper}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder={label}
                  placeholderTextColor="#9CA3AF"
                  value={value}
                  onChangeText={set}
                  secureTextEntry={!show}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity onPress={toggle} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  {show
                    ? <Feather name="eye-off" size={20} color="#9CA3AF" />
                    : <Feather name="eye" size={20} color="#9CA3AF" />}
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.btn, loading && { opacity: 0.7 }]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator color="#212121" />
            : <Text style={styles.btnText}>Guardar contraseña</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F1F2F6' },
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingVertical: 48,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 32,
  },
  brandName: {
    fontSize: 26,
    fontWeight: '800',
    color: '#212121',
    letterSpacing: 0.5,
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#212121',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  form: {
    width: '100%',
    gap: 12,
    marginBottom: 24,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
  btn: {
    width: '100%',
    height: 54,
    backgroundColor: '#C1EF00',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#C1EF00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  btnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#212121',
  },
});
