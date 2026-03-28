import React from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { User, Mail, Phone, Scale, Ruler, Target, LogOut } from 'lucide-react-native';
import { getMyProfile } from '../lib/client';
import { AuthUser, logout } from '../lib/auth';

const GOAL_LABELS: Record<string, string> = {
  WEIGHT_LOSS: 'Pérdida de peso',
  MUSCLE_GAIN: 'Ganancia muscular',
  MAINTENANCE: 'Mantenimiento',
  STRENGTH: 'Fuerza',
  ENDURANCE: 'Resistencia',
};

const GENDER_LABELS: Record<string, string> = {
  MALE: 'Masculino',
  FEMALE: 'Femenino',
  OTHER: 'Otro',
};

interface Props {
  user: AuthUser;
  onLogout: () => void;
}

export function ProfileScreen({ user, onLogout }: Props) {
  const { data: profile, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['my-profile'],
    queryFn: getMyProfile,
  });

  const handleLogout = async () => {
    await logout();
    onLogout();
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#C1EF00" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={refetch}
          tintColor="#C1EF00"
          colors={['#C1EF00']}
        />
      }
    >
      {/* Avatar header */}
      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user.firstName[0]}{user.lastName[0]}</Text>
        </View>
        <Text style={styles.name}>{user.firstName} {user.lastName}</Text>
        <Text style={styles.email}>{user.email}</Text>
      </View>

      {/* Info */}
      <Text style={styles.sectionTitle}>Información personal</Text>
      <View style={styles.infoCard}>
        {[
          { icon: <Mail size={15} color="#6B7280" />, label: 'Email', value: profile?.email ?? user.email },
          { icon: <Phone size={15} color="#6B7280" />, label: 'Teléfono', value: profile?.phone ?? '—' },
          { icon: <User size={15} color="#6B7280" />, label: 'Género', value: GENDER_LABELS[profile?.gender ?? ''] ?? '—' },
          { icon: <Target size={15} color="#6B7280" />, label: 'Objetivo', value: GOAL_LABELS[profile?.goalType ?? ''] ?? '—' },
        ].map(({ icon, label, value }, i, arr) => (
          <View key={label} style={[styles.infoRow, i < arr.length - 1 && styles.infoRowBorder]}>
            <View style={styles.infoLeft}>
              {icon}
              <Text style={styles.infoLabel}>{label}</Text>
            </View>
            <Text style={styles.infoValue}>{value}</Text>
          </View>
        ))}
      </View>

      {/* Físico */}
      <Text style={styles.sectionTitle}>Datos físicos</Text>
      <View style={styles.physicalGrid}>
        {[
          { icon: <Scale size={16} color="#212121" />, label: 'Peso', value: `${profile?.weight ?? '—'} kg`, accent: true },
          { icon: <Ruler size={16} color="#6B7280" />, label: 'Altura', value: `${profile?.height ?? '—'} cm` },
          { icon: <Target size={16} color="#6B7280" />, label: 'IMC', value: profile?.bmi?.toFixed(1) ?? '—' },
          { icon: <Target size={16} color="#6B7280" />, label: 'Objetivo', value: profile?.targetWeight ? `${profile.targetWeight} kg` : '—' },
        ].map(({ icon, label, value, accent }) => (
          <View key={label} style={[styles.physicalCard, accent && styles.physicalCardAccent]}>
            {icon}
            <Text style={[styles.physicalValue, accent && styles.physicalValueAccent]}>{value}</Text>
            <Text style={[styles.physicalLabel, accent && styles.physicalLabelAccent]}>{label}</Text>
          </View>
        ))}
      </View>

      {/* Medidas corporales */}
      {(() => {
        const lastP = profile?.physicalProgress?.[0];
        const m = lastP?.measurements as any;
        const MEASURES = [
          { key: 'waist',  label: 'Cintura', color: '#F97316' },
          { key: 'chest',  label: 'Pecho',   color: '#A78BFA' },
          { key: 'arms',   label: 'Brazos',  color: '#34D399' },
          { key: 'hips',   label: 'Caderas', color: '#FB7185' },
          { key: 'thighs', label: 'Muslos',  color: '#FBBF24' },
        ].filter(s => m?.[s.key]);
        if (!MEASURES.length) return null;
        return (
          <>
            <Text style={[styles.sectionTitle, { marginBottom: 10 }]}>Medidas corporales</Text>
            <View style={styles.measuresGrid}>
              {MEASURES.map(s => (
                <View key={s.key} style={[styles.measureCard, { borderTopColor: s.color }]}>
                  <Text style={styles.measureValue}>{m[s.key]} cm</Text>
                  <Text style={styles.measureLabel}>{s.label}</Text>
                </View>
              ))}
            </View>
          </>
        );
      })()}

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
        <LogOut size={18} color="#DC2626" />
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F1F2F6' },
  content: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F1F2F6' },

  avatarSection: { alignItems: 'center', marginBottom: 28 },
  avatar: {
    width: 72, height: 72, borderRadius: 22,
    backgroundColor: '#C1EF00', alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  avatarText: { fontSize: 24, fontWeight: '800', color: '#212121' },
  name: { fontSize: 20, fontWeight: '800', color: '#212121', marginBottom: 4 },
  email: { fontSize: 13, color: '#6B7280' },

  sectionTitle: {
    fontSize: 13, fontWeight: '700', color: '#6B7280',
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10,
  },

  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14 },
  infoRowBorder: { borderBottomWidth: 1, borderBottomColor: '#F1F2F6' },
  infoLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoLabel: { fontSize: 13, color: '#6B7280' },
  infoValue: { fontSize: 13, fontWeight: '600', color: '#212121', maxWidth: '60%', textAlign: 'right' },

  physicalGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 28 },
  physicalCard: {
    flex: 1, minWidth: '45%',
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14,
    alignItems: 'flex-start', gap: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  physicalCardAccent: { backgroundColor: '#212121' },
  physicalValue: { fontSize: 20, fontWeight: '800', color: '#212121' },
  physicalValueAccent: { color: '#C1EF00' },
  physicalLabel: { fontSize: 11, color: '#9CA3AF' },
  physicalLabelAccent: { color: '#6B7280' },

  measuresGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 28 },
  measureCard: {
    flex: 1, backgroundColor: '#FFFFFF', borderRadius: 12, paddingVertical: 10,
    alignItems: 'center', borderTopWidth: 3, marginHorizontal: 3,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2, elevation: 1,
  },
  measureValue: { fontSize: 14, fontWeight: '800', color: '#212121' },
  measureLabel: { fontSize: 9, color: '#9CA3AF', marginTop: 2 },

  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: '#FEF2F2', borderRadius: 14,
    padding: 16, borderWidth: 1, borderColor: '#FECACA',
  },
  logoutText: { fontSize: 15, fontWeight: '700', color: '#DC2626' },
});
