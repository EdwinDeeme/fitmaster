import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator,
  RefreshControl, TouchableOpacity, TextInput, Alert,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Scale, TrendingUp, TrendingDown, Plus, X, Check } from 'lucide-react-native';
import { LineChart } from 'react-native-gifted-charts';
import { getMyProfile, addProgress } from '../lib/client';
import { BottomSheet } from '../components/BottomSheet';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

type ChartTab = 'peso' | 'grasa' | 'medidas';

const MEASURE_SERIES = [
  { key: 'waist',  label: 'Cintura', color: '#F97316' },
  { key: 'chest',  label: 'Pecho',   color: '#A78BFA' },
  { key: 'arms',   label: 'Brazos',  color: '#34D399' },
  { key: 'hips',   label: 'Caderas', color: '#FB7185' },
  { key: 'thighs', label: 'Muslos',  color: '#FBBF24' },
];

const fmt = (d: string) => format(new Date(d), 'dd MMM', { locale: es });

export function ProgressScreen() {
  const qc = useQueryClient();
  const [chartTab, setChartTab] = useState<ChartTab>('peso');
  const [logOpen, setLogOpen] = useState(false);
  const [weight, setWeight] = useState('');
  const [fat, setFat] = useState('');
  const [waist, setWaist] = useState('');
  const [chest, setChest] = useState('');
  const [arms, setArms] = useState('');
  const [hips, setHips] = useState('');
  const [thighs, setThighs] = useState('');
  const [notes, setNotes] = useState('');

  const { data: profile, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['my-profile'],
    queryFn: getMyProfile,
  });

  const mutation = useMutation({
    mutationFn: addProgress,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-profile'] });
      setLogOpen(false);
      setWeight(''); setFat(''); setWaist(''); setChest('');
      setArms(''); setHips(''); setThighs(''); setNotes('');
    },
    onError: () => Alert.alert('Error', 'No se pudo guardar el registro.'),
  });

  const handleSave = () => {
    if (!weight) { Alert.alert('Requerido', 'Ingresa tu peso.'); return; }
    mutation.mutate({
      weight: parseFloat(weight),
      bodyFatPercentage: fat ? parseFloat(fat) : undefined,
      measurements: {
        waist:  waist  ? parseFloat(waist)  : undefined,
        chest:  chest  ? parseFloat(chest)  : undefined,
        arms:   arms   ? parseFloat(arms)   : undefined,
        hips:   hips   ? parseFloat(hips)   : undefined,
        thighs: thighs ? parseFloat(thighs) : undefined,
      },
      notes: notes || undefined,
    });
  };

  const progress = profile?.physicalProgress ?? [];
  const latest = progress[0];
  const oldest = progress[progress.length - 1];
  const weightDelta = latest && oldest && latest !== oldest
    ? +(latest.weight - oldest.weight).toFixed(1) : null;

  // Build chart data
  const reversed = [...progress].reverse();

  const weightData = reversed.map(p => ({
    value: p.weight,
    label: fmt(p.date),
    dataPointText: `${p.weight}`,
  }));

  const fatData = reversed
    .filter(p => p.bodyFatPercentage)
    .map(p => ({ value: p.bodyFatPercentage!, label: fmt(p.date) }));

  const hasFat = fatData.length >= 2;
  const hasMeasures = reversed.some(p => {
    const m = p.measurements as any;
    return m && Object.values(m).some(Boolean);
  });

  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#C1EF00" /></View>;
  }

  return (
    <>
      <ScrollView
        style={styles.root}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#C1EF00" />}
      >
        {/* Header */}
        <View style={styles.pageHeader}>
          <View>
            <Text style={styles.pageTitle}>Mi Progreso</Text>
            <Text style={styles.pageSubtitle}>{progress.length} registro{progress.length !== 1 ? 's' : ''}</Text>
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={() => setLogOpen(true)} activeOpacity={0.8}>
            <Plus size={18} color="#212121" />
            <Text style={styles.addBtnText}>Registrar</Text>
          </TouchableOpacity>
        </View>

        {/* Summary KPIs */}
        {latest && (
          <View style={styles.kpiRow}>
            <View style={[styles.kpiCard, styles.kpiCardAccent]}>
              <Scale size={16} color="#C1EF00" />
              <Text style={styles.kpiValueAccent}>{latest.weight} kg</Text>
              <Text style={styles.kpiLabelAccent}>Peso actual</Text>
            </View>
            <View style={styles.kpiCard}>
              {weightDelta === null ? <Scale size={16} color="#9CA3AF" />
                : weightDelta < 0 ? <TrendingDown size={16} color="#16A34A" />
                : <TrendingUp size={16} color="#DC2626" />}
              <Text style={styles.kpiValue}>
                {weightDelta !== null ? `${weightDelta > 0 ? '+' : ''}${weightDelta} kg` : '—'}
              </Text>
              <Text style={styles.kpiLabel}>Variación</Text>
            </View>
            {latest.bodyFatPercentage && (
              <View style={styles.kpiCard}>
                <TrendingUp size={16} color="#6B7280" />
                <Text style={styles.kpiValue}>{latest.bodyFatPercentage}%</Text>
                <Text style={styles.kpiLabel}>% Grasa</Text>
              </View>
            )}
          </View>
        )}

        {/* Chart */}
        {progress.length >= 2 && (
          <View style={styles.chartCard}>
            {/* Tabs */}
            <View style={styles.chartTabs}>
              {([
                { key: 'peso', label: 'Peso' },
                ...(hasFat ? [{ key: 'grasa', label: '% Grasa' }] : []),
                ...(hasMeasures ? [{ key: 'medidas', label: 'Medidas' }] : []),
              ] as { key: ChartTab; label: string }[]).map(t => (
                <TouchableOpacity
                  key={t.key}
                  style={[styles.chartTab, chartTab === t.key && styles.chartTabActive]}
                  onPress={() => setChartTab(t.key)}
                >
                  <Text style={[styles.chartTabText, chartTab === t.key && styles.chartTabTextActive]}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Weight chart */}
            {chartTab === 'peso' && weightData.length >= 2 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <LineChart
                  data={weightData}
                  height={160}
                  width={Math.max(300, weightData.length * 60)}
                  color="#C1EF00"
                  thickness={2.5}
                  startFillColor="#C1EF00"
                  endFillColor="transparent"
                  startOpacity={0.25}
                  endOpacity={0}
                  areaChart
                  curved
                  hideDataPoints={false}
                  dataPointsColor="#C1EF00"
                  dataPointsRadius={4}
                  xAxisLabelTextStyle={{ color: '#9CA3AF', fontSize: 9 }}
                  yAxisTextStyle={{ color: '#9CA3AF', fontSize: 9 }}
                  yAxisColor="transparent"
                  xAxisColor="#F1F2F6"
                  rulesColor="#F1F2F6"
                  noOfSections={4}
                  yAxisOffset={Math.min(...weightData.map(d => d.value)) - 2}
                  showReferenceLine1={!!profile?.targetWeight}
                  referenceLine1Position={profile?.targetWeight ?? 0}
                  referenceLine1Config={{ color: '#C1EF00', dashWidth: 4, dashGap: 4, thickness: 1 }}
                />
              </ScrollView>
            )}

            {/* Fat chart */}
            {chartTab === 'grasa' && fatData.length >= 2 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <LineChart
                  data={fatData}
                  height={160}
                  width={Math.max(300, fatData.length * 60)}
                  color="#60A5FA"
                  thickness={2.5}
                  startFillColor="#60A5FA"
                  endFillColor="transparent"
                  startOpacity={0.25}
                  endOpacity={0}
                  areaChart
                  curved
                  dataPointsColor="#60A5FA"
                  dataPointsRadius={4}
                  xAxisLabelTextStyle={{ color: '#9CA3AF', fontSize: 9 }}
                  yAxisTextStyle={{ color: '#9CA3AF', fontSize: 9 }}
                  yAxisColor="transparent"
                  xAxisColor="#F1F2F6"
                  rulesColor="#F1F2F6"
                  noOfSections={4}
                />
              </ScrollView>
            )}

            {/* Measures chart */}
            {chartTab === 'medidas' && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View>
                  {MEASURE_SERIES.map(s => {
                    const seriesData = reversed
                      .filter(p => (p.measurements as any)?.[s.key])
                      .map(p => ({ value: (p.measurements as any)[s.key], label: fmt(p.date) }));
                    if (seriesData.length < 2) return null;
                    return (
                      <View key={s.key} style={{ marginBottom: 8 }}>
                        <View style={styles.measureSeriesLabel}>
                          <View style={[styles.measureDot, { backgroundColor: s.color }]} />
                          <Text style={styles.measureSeriesText}>{s.label}</Text>
                        </View>
                        <LineChart
                          data={seriesData}
                          height={100}
                          width={Math.max(280, seriesData.length * 60)}
                          color={s.color}
                          thickness={2}
                          startFillColor={s.color}
                          endFillColor="transparent"
                          startOpacity={0.15}
                          endOpacity={0}
                          areaChart
                          curved
                          dataPointsColor={s.color}
                          dataPointsRadius={3}
                          xAxisLabelTextStyle={{ color: '#9CA3AF', fontSize: 8 }}
                          yAxisTextStyle={{ color: '#9CA3AF', fontSize: 8 }}
                          yAxisColor="transparent"
                          xAxisColor="#F1F2F6"
                          rulesColor="#F1F2F6"
                          noOfSections={3}
                          hideYAxisText={false}
                        />
                      </View>
                    );
                  })}
                </View>
              </ScrollView>
            )}
          </View>
        )}

        {/* History */}
        <Text style={styles.sectionTitle}>Historial</Text>
        {progress.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}><Scale size={32} color="#9CA3AF" /></View>
            <Text style={styles.emptyTitle}>Sin registros aún</Text>
            <Text style={styles.emptyText}>Registra tu primera medición con el botón de arriba</Text>
          </View>
        ) : (
          progress.map((p, i) => {
            const m = p.measurements as any;
            const hasMeas = m && Object.values(m).some(Boolean);
            return (
              <View key={p.id} style={styles.historyCard}>
                <View style={styles.historyHeader}>
                  <View style={styles.historyDateWrap}>
                    <Text style={styles.historyDate}>
                      {new Date(p.date).toLocaleDateString('es-CR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </Text>
                    {i === 0 && <View style={styles.latestBadge}><Text style={styles.latestBadgeText}>Último</Text></View>}
                  </View>
                  <Text style={styles.historyWeight}>{p.weight} kg</Text>
                </View>
                <View style={styles.historyChips}>
                  {p.bodyFatPercentage && (
                    <View style={styles.chip}><Text style={styles.chipText}>Grasa: {p.bodyFatPercentage}%</Text></View>
                  )}
                  {hasMeas && MEASURE_SERIES.map(s => m?.[s.key] ? (
                    <View key={s.key} style={[styles.chip, { borderLeftColor: s.color, borderLeftWidth: 2 }]}>
                      <Text style={styles.chipText}>{s.label}: {m[s.key]} cm</Text>
                    </View>
                  ) : null)}
                </View>
                {p.notes && <Text style={styles.historyNotes}>{p.notes}</Text>}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Log bottom sheet */}
      <BottomSheet visible={logOpen} onClose={() => setLogOpen(false)}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Nueva medición</Text>
          <TouchableOpacity onPress={() => setLogOpen(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <X size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <View style={styles.formGrid}>
          <Field label="Peso (kg) *" value={weight} onChange={setWeight} placeholder="ej: 75.5" />
          <Field label="% Grasa" value={fat} onChange={setFat} placeholder="ej: 18.5" />
        </View>

        <Text style={styles.formSection}>Medidas (cm)</Text>
        <View style={styles.formGrid}>
          <Field label="Cintura" value={waist} onChange={setWaist} placeholder="—" />
          <Field label="Pecho" value={chest} onChange={setChest} placeholder="—" />
          <Field label="Brazos" value={arms} onChange={setArms} placeholder="—" />
          <Field label="Caderas" value={hips} onChange={setHips} placeholder="—" />
          <Field label="Muslos" value={thighs} onChange={setThighs} placeholder="—" />
        </View>

        <Text style={styles.formSection}>Notas</Text>
        <TextInput
          style={styles.notesInput}
          value={notes} onChangeText={setNotes}
          placeholder="Opcional..." placeholderTextColor="#9CA3AF"
          multiline numberOfLines={3}
        />

        <TouchableOpacity
          style={[styles.saveBtn, mutation.isPending && { opacity: 0.7 }]}
          onPress={handleSave} disabled={mutation.isPending} activeOpacity={0.85}
        >
          {mutation.isPending
            ? <ActivityIndicator color="#212121" />
            : <><Check size={18} color="#212121" /><Text style={styles.saveBtnText}>Guardar medición</Text></>}
        </TouchableOpacity>
      </BottomSheet>
    </>
  );
}

function Field({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.fieldInput}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        keyboardType="decimal-pad"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F1F2F6' },
  content: { padding: 20, paddingBottom: 32 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F1F2F6' },

  pageHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  pageTitle: { fontSize: 22, fontWeight: '800', color: '#212121' },
  pageSubtitle: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#C1EF00', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
  },
  addBtnText: { fontSize: 13, fontWeight: '700', color: '#212121' },

  kpiRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  kpiCard: {
    flex: 1, backgroundColor: '#FFFFFF', borderRadius: 14, padding: 12,
    alignItems: 'flex-start', gap: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  kpiCardAccent: { backgroundColor: '#212121' },
  kpiValue: { fontSize: 16, fontWeight: '800', color: '#212121' },
  kpiValueAccent: { fontSize: 16, fontWeight: '800', color: '#C1EF00' },
  kpiLabel: { fontSize: 10, color: '#9CA3AF' },
  kpiLabelAccent: { fontSize: 10, color: '#6B7280' },

  chartCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, marginBottom: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  chartTabs: { flexDirection: 'row', backgroundColor: '#F1F2F6', borderRadius: 10, padding: 3, marginBottom: 14 },
  chartTab: { flex: 1, paddingVertical: 7, borderRadius: 8, alignItems: 'center' },
  chartTabActive: { backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 2, elevation: 1 },
  chartTabText: { fontSize: 12, fontWeight: '600', color: '#9CA3AF' },
  chartTabTextActive: { color: '#212121', fontWeight: '700' },

  measureSeriesLabel: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  measureDot: { width: 8, height: 8, borderRadius: 4 },
  measureSeriesText: { fontSize: 11, fontWeight: '600', color: '#6B7280' },

  sectionTitle: {
    fontSize: 12, fontWeight: '700', color: '#6B7280',
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12,
  },

  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyIcon: {
    width: 72, height: 72, borderRadius: 24,
    backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#212121', marginBottom: 6 },
  emptyText: { fontSize: 13, color: '#9CA3AF', textAlign: 'center' },

  historyCard: {
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  historyHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  historyDateWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  historyDate: { fontSize: 13, fontWeight: '600', color: '#212121' },
  latestBadge: { backgroundColor: '#C1EF00', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  latestBadgeText: { fontSize: 9, fontWeight: '700', color: '#212121' },
  historyWeight: { fontSize: 18, fontWeight: '800', color: '#212121' },
  historyChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { backgroundColor: '#F1F2F6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  chipText: { fontSize: 11, color: '#6B7280', fontWeight: '500' },
  historyNotes: {
    fontSize: 12, color: '#9CA3AF', marginTop: 8,
    borderTopWidth: 1, borderTopColor: '#F1F2F6', paddingTop: 8,
  },

  // Modal
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#212121' },

  formGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 8 },
  formSection: {
    fontSize: 11, fontWeight: '700', color: '#6B7280',
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, marginTop: 8,
  },
  fieldWrap: { width: '47%' },
  fieldLabel: { fontSize: 11, fontWeight: '600', color: '#6B7280', marginBottom: 4 },
  fieldInput: {
    height: 44, backgroundColor: '#F1F2F6', borderRadius: 10,
    paddingHorizontal: 12, fontSize: 14, color: '#212121',
  },
  notesInput: {
    backgroundColor: '#F1F2F6', borderRadius: 10, padding: 12,
    fontSize: 14, color: '#212121', minHeight: 72, textAlignVertical: 'top',
  },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#C1EF00', borderRadius: 14, height: 52, marginTop: 16, marginBottom: 8,
  },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: '#212121' },
});
