import React from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  ActivityIndicator, RefreshControl, TouchableOpacity,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Dumbbell, CreditCard, TrendingUp, Target, Scale, Activity, ChevronRight } from 'lucide-react-native';
import { getMyProfile } from '../lib/client';
import { AuthUser } from '../lib/auth';
import { FitMasterLogo } from '../components/FitMasterLogo';
import { Tab } from '../components/BottomNav';

const GOAL_LABELS: Record<string, string> = {
  WEIGHT_LOSS: 'Pérdida de peso',
  MUSCLE_GAIN: 'Ganancia muscular',
  MAINTENANCE: 'Mantenimiento',
  STRENGTH: 'Fuerza',
  ENDURANCE: 'Resistencia',
};

const MEMBERSHIP_LABELS: Record<string, string> = {
  MONTHLY: 'Mensual',
  QUARTERLY: 'Trimestral',
  ANNUAL: 'Anual',
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: '#16A34A',
  EXPIRING_SOON: '#D97706',
  EXPIRED: '#DC2626',
};

const MEASURE_SERIES = [
  { key: 'waist',  label: 'Cintura', color: '#F97316' },
  { key: 'chest',  label: 'Pecho',   color: '#A78BFA' },
  { key: 'arms',   label: 'Brazos',  color: '#34D399' },
  { key: 'hips',   label: 'Caderas', color: '#FB7185' },
  { key: 'thighs', label: 'Muslos',  color: '#FBBF24' },
];

interface Props {
  user: AuthUser;
  onTabChange: (tab: Tab) => void;
}

export function HomeScreen({ user, onTabChange }: Props) {
  const { data: profile, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['my-profile'],
    queryFn: getMyProfile,
  });

  const activeMembership = profile?.memberships?.find(
    m => m.status === 'ACTIVE' || m.status === 'EXPIRING_SOON',
  );
  const lastProgress = profile?.physicalProgress?.[0];
  const activeRoutines = profile?.routineAssignments?.filter(r => r.isActive) ?? [];
  const lastMeasures = lastProgress?.measurements as any;
  const measureChips = MEASURE_SERIES.filter(s => lastMeasures?.[s.key]);

  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#C1EF00" /></View>;
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#C1EF00" />}
    >
      {/* Header con logo */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <FitMasterLogo size={36} />
          <View style={{ marginLeft: 10 }}>
            <Text style={styles.greeting}>Hola, {user.firstName}</Text>
            <Text style={styles.subGreeting}>Bienvenido de vuelta</Text>
          </View>
        </View>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user.firstName[0]}{user.lastName[0]}</Text>
        </View>
      </View>

      {/* Membresía */}
      {activeMembership ? (
        <View style={styles.membershipCard}>
          <View style={styles.membershipLeft}>
            <CreditCard size={18} color="#212121" />
            <View style={{ marginLeft: 10 }}>
              <Text style={styles.membershipType}>
                Membresía {MEMBERSHIP_LABELS[activeMembership.type] ?? activeMembership.type}
              </Text>
              <Text style={styles.membershipDate}>
                Vence: {new Date(activeMembership.endDate).toLocaleDateString('es-CR')}
              </Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[activeMembership.status] + '25' }]}>
            <Text style={[styles.statusText, { color: STATUS_COLORS[activeMembership.status] }]}>
              {activeMembership.status === 'ACTIVE' ? 'Activa' : 'Por vencer'}
            </Text>
          </View>
        </View>
      ) : (
        <View style={[styles.membershipCard, { backgroundColor: '#FEF2F2' }]}>
          <CreditCard size={18} color="#DC2626" />
          <Text style={[styles.membershipType, { color: '#DC2626', marginLeft: 10 }]}>Sin membresía activa</Text>
        </View>
      )}

      {/* Meta */}
      <View style={styles.goalCard}>
        <Dumbbell size={15} color="#C1EF00" />
        <Text style={styles.goalText}>
          Meta: {GOAL_LABELS[profile?.goalType ?? ''] ?? '—'}
          {profile?.targetWeight ? `  ·  Objetivo: ${profile.targetWeight} kg` : ''}
        </Text>
      </View>

      {/* Estado físico */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Tu estado físico</Text>
        <TouchableOpacity onPress={() => onTabChange('progress')} style={styles.seeDetailsBtn}>
          <Text style={styles.seeDetailsText}>Ver detalles</Text>
          <ChevronRight size={13} color="#5A7A00" />
        </TouchableOpacity>
      </View>

      <View style={styles.kpiGrid}>
        <KpiCard icon={<Scale size={18} color="#C1EF00" />} label="Peso actual"
          value={`${lastProgress?.weight ?? profile?.weight ?? '—'} kg`} accent />
        <KpiCard icon={<Activity size={18} color="#6B7280" />} label="IMC"
          value={profile?.bmi?.toFixed(1) ?? '—'} />
        <KpiCard icon={<Target size={18} color="#6B7280" />} label="Objetivo"
          value={profile?.targetWeight ? `${profile.targetWeight} kg` : '—'} />
        <KpiCard icon={<TrendingUp size={18} color="#6B7280" />} label="% Grasa"
          value={lastProgress?.bodyFatPercentage
            ? `${lastProgress.bodyFatPercentage}%`
            : profile?.bodyFatPercentage ? `${profile.bodyFatPercentage}%` : '—'} />
      </View>

      {/* Medidas corporales */}
      {measureChips.length > 0 && (
        <View style={styles.measuresRow}>
          {measureChips.map(s => (
            <View key={s.key} style={[styles.measureChip, { borderLeftColor: s.color }]}>
              <Text style={styles.measureChipLabel}>{s.label}</Text>
              <Text style={styles.measureChipValue}>{lastMeasures[s.key]} cm</Text>
            </View>
          ))}
        </View>
      )}

      {/* Rutinas activas */}
      <Text style={[styles.sectionTitle, { marginBottom: 12, marginTop: 8 }]}>Rutinas activas</Text>
      {activeRoutines.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No tienes rutinas asignadas</Text>
        </View>
      ) : (
        activeRoutines.map(a => (
          <TouchableOpacity key={a.id} style={styles.routineCard}
            onPress={() => onTabChange('routines')} activeOpacity={0.75}>
            <View style={styles.routineLeft}>
              <View style={styles.routineIcon}>
                <Dumbbell size={16} color="#212121" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.routineName}>{a.routine?.name}</Text>
                <Text style={styles.routineSub}>
                  {a.routine?.durationWeeks} semanas · Desde {new Date(a.startDate).toLocaleDateString('es-CR')}
                </Text>
              </View>
            </View>
            <ChevronRight size={16} color="#9CA3AF" />
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

function KpiCard({ icon, label, value, accent }: {
  icon: React.ReactNode; label: string; value: string; accent?: boolean;
}) {
  return (
    <View style={[styles.kpiCard, accent && styles.kpiCardAccent]}>
      <View style={styles.kpiIcon}>{icon}</View>
      <Text style={[styles.kpiValue, accent && styles.kpiValueAccent]}>{value}</Text>
      <Text style={[styles.kpiLabel, accent && styles.kpiLabelAccent]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F1F2F6' },
  content: { padding: 20, paddingBottom: 32 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F1F2F6' },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  greeting: { fontSize: 18, fontWeight: '800', color: '#212121' },
  subGreeting: { fontSize: 12, color: '#6B7280', marginTop: 1 },
  avatar: {
    width: 42, height: 42, borderRadius: 13,
    backgroundColor: '#C1EF00', alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 14, fontWeight: '800', color: '#212121' },

  membershipCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#C1EF00', borderRadius: 16, padding: 14, marginBottom: 10,
  },
  membershipLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  membershipType: { fontSize: 14, fontWeight: '700', color: '#212121' },
  membershipDate: { fontSize: 11, color: '#212121', opacity: 0.65, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '700' },

  goalCard: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#1A1A1A', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 10, marginBottom: 22,
  },
  goalText: { fontSize: 12, fontWeight: '600', color: '#D1D5DB', flex: 1 },

  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12,
  },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5 },
  seeDetailsBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  seeDetailsText: { fontSize: 12, fontWeight: '600', color: '#5A7A00' },

  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  kpiCard: {
    flex: 1, minWidth: '45%', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14,
    alignItems: 'flex-start',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  kpiCardAccent: { backgroundColor: '#212121' },
  kpiIcon: { marginBottom: 8 },
  kpiValue: { fontSize: 20, fontWeight: '800', color: '#212121', marginBottom: 2 },
  kpiValueAccent: { color: '#C1EF00' },
  kpiLabel: { fontSize: 11, color: '#6B7280' },
  kpiLabelAccent: { color: '#9CA3AF' },

  measuresRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  measureChip: {
    flex: 1,
    backgroundColor: '#FFFFFF', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 6,
    borderLeftWidth: 3, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2, elevation: 1,
    marginHorizontal: 2,
  },
  measureChipLabel: { fontSize: 9, color: '#9CA3AF', fontWeight: '600', textTransform: 'uppercase' },
  measureChipValue: { fontSize: 12, fontWeight: '700', color: '#212121', marginTop: 1 },

  routineCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, marginBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  routineLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 },
  routineIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#C1EF00', alignItems: 'center', justifyContent: 'center',
  },
  routineName: { fontSize: 14, fontWeight: '700', color: '#212121' },
  routineSub: { fontSize: 11, color: '#6B7280', marginTop: 2 },

  emptyCard: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 20, alignItems: 'center' },
  emptyText: { fontSize: 13, color: '#9CA3AF' },
});
