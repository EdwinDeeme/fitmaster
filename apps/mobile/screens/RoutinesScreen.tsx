import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator,
  TouchableOpacity, RefreshControl, TextInput, Alert,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dumbbell, X, Weight, Check, TrendingUp, ChevronLeft } from 'lucide-react-native';
import { getMyProfile, getEquipment, getExerciseLogs, logExercise, Equipment, RoutineAssignment } from '../lib/client';
import { BottomSheet } from '../components/BottomSheet';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const DIFFICULTY_LABELS: Record<string, string> = {
  BEGINNER: 'Principiante', INTERMEDIATE: 'Intermedio', ADVANCED: 'Avanzado',
};
const DIFFICULTY_COLORS: Record<string, string> = {
  BEGINNER: '#16A34A', INTERMEDIATE: '#D97706', ADVANCED: '#DC2626',
};
const GOAL_LABELS: Record<string, string> = {
  WEIGHT_LOSS: 'Pérdida de peso', MUSCLE_GAIN: 'Ganancia muscular',
  MAINTENANCE: 'Mantenimiento', STRENGTH: 'Fuerza', ENDURANCE: 'Resistencia',
};
const DAY_KEYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
const DAY_ABBR = ['L','M','X','J','V','S','D'];
const DAY_FULL: Record<string, string> = {
  monday:'Lunes', tuesday:'Martes', wednesday:'Miércoles',
  thursday:'Jueves', friday:'Viernes', saturday:'Sábado', sunday:'Domingo',
};

interface ExerciseDetail {
  name: string;
  sets: number;
  reps: number | string;
  restSeconds: number;
  weight?: string;
  equipmentName?: string;
}

interface DayData {
  day: string;
  exercises: ExerciseDetail[];
  clientId: string;
  routineId: string;
}

interface LogData {
  clientId: string;
  routineId: string;
  exerciseName: string;
  defaultSets: number;
  defaultReps: string;
  defaultWeight?: string;
}

// Single sheet view: 'day' shows exercises, 'log' shows weight history
type SheetView = 'day' | 'log';

export function RoutinesScreen() {
  const qc = useQueryClient();
  const [selectedRoutine, setSelectedRoutine] = useState<string | null>(null);

  // Single bottom sheet state
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetView, setSheetView] = useState<SheetView>('day');
  const [dayData, setDayData] = useState<DayData | null>(null);
  const [logData, setLogData] = useState<LogData | null>(null);

  // Log form fields
  const [logWeight, setLogWeight] = useState('');
  const [logSets, setLogSets] = useState('');
  const [logReps, setLogReps] = useState('');
  const [logNotes, setLogNotes] = useState('');

  const { data: profile, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['my-profile'],
    queryFn: getMyProfile,
  });
  const { data: equipment = [] } = useQuery<Equipment[]>({
    queryKey: ['equipment'],
    queryFn: getEquipment,
  });
  const { data: exerciseLogs = {} } = useQuery({
    queryKey: ['exercise-logs', logData?.clientId, logData?.routineId],
    queryFn: () => getExerciseLogs(logData!.clientId, logData!.routineId),
    enabled: !!logData && sheetView === 'log',
  });

  const logMutation = useMutation({
    mutationFn: () => logExercise(logData!.clientId, logData!.routineId, {
      exerciseName: logData!.exerciseName,
      sets: parseInt(logSets) || logData!.defaultSets,
      reps: logReps || logData!.defaultReps,
      weightKg: parseFloat(logWeight),
      notes: logNotes || undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['exercise-logs', logData?.clientId, logData?.routineId] });
      setLogWeight(''); setLogSets(''); setLogReps(''); setLogNotes('');
      Alert.alert('Guardado', 'Peso actualizado correctamente.');
    },
    onError: () => Alert.alert('Error', 'No se pudo guardar.'),
  });

  const handleSaveLog = () => {
    if (!logWeight || isNaN(parseFloat(logWeight))) {
      Alert.alert('Requerido', 'Ingresa el peso.');
      return;
    }
    logMutation.mutate();
  };

  const resolveExercises = (exercises: any[]): ExerciseDetail[] =>
    exercises.map(ex => {
      const [weight = '', equipmentId = ''] = (ex.notes ?? '').split('|');
      const eq = equipmentId ? equipment.find(e => e.id === equipmentId) : null;
      return { ...ex, weight: weight || undefined, equipmentName: eq?.name };
    });

  const openDay = (a: RoutineAssignment, dayKey: string) => {
    const day = a.routine?.weeklySchedule?.[dayKey];
    if (!day?.exercises?.length) return;
    setDayData({
      day: DAY_FULL[dayKey] ?? dayKey,
      exercises: resolveExercises(day.exercises),
      clientId: profile!.id,
      routineId: a.routineId,
    });
    setSheetView('day');
    setSheetOpen(true);
  };

  const openLog = (ex: ExerciseDetail) => {
    if (!dayData) return;
    setLogData({
      clientId: dayData.clientId,
      routineId: dayData.routineId,
      exerciseName: ex.name,
      defaultSets: ex.sets,
      defaultReps: String(ex.reps),
      defaultWeight: ex.weight,
    });
    setLogSets(String(ex.sets));
    setLogReps(String(ex.reps));
    setLogWeight(ex.weight ?? '');
    setLogNotes('');
    setSheetView('log');
  };

  const closeSheet = () => setSheetOpen(false);
  const backToDay = () => setSheetView('day');

  const routines = profile?.routineAssignments ?? [];
  const activeRoutines = routines.filter(r => r.isActive);
  const inactiveRoutines = routines.filter(r => !r.isActive);

  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#C1EF00" /></View>;
  }

  const renderRoutine = (a: RoutineAssignment) => {
    const r = a.routine;
    const isSelected = selectedRoutine === a.id;
    const ws = r?.weeklySchedule ?? {};

    return (
      <View key={a.id} style={styles.card}>
        <TouchableOpacity
          style={styles.cardHeader}
          onPress={() => setSelectedRoutine(isSelected ? null : a.id)}
          activeOpacity={0.7}
        >
          <View style={[styles.cardIcon, !a.isActive && { backgroundColor: '#F1F2F6' }]}>
            <Dumbbell size={16} color={a.isActive ? '#212121' : '#9CA3AF'} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.routineName} numberOfLines={1}>{r?.name ?? 'Rutina'}</Text>
            <Text style={styles.routineMeta}>
              {r?.durationWeeks} sem · {GOAL_LABELS[r?.targetGoal ?? ''] ?? r?.targetGoal}
            </Text>
          </View>
          <View style={styles.cardHeaderRight}>
            {r?.difficulty && (
              <View style={[styles.diffBadge, { backgroundColor: DIFFICULTY_COLORS[r.difficulty] + '20' }]}>
                <Text style={[styles.diffText, { color: DIFFICULTY_COLORS[r.difficulty] }]}>
                  {DIFFICULTY_LABELS[r.difficulty]}
                </Text>
              </View>
            )}
            <Text style={styles.chevron}>{isSelected ? '▲' : '▼'}</Text>
          </View>
        </TouchableOpacity>

        {isSelected && (
          <View style={styles.scheduleWrap}>
            <Text style={styles.scheduleLabel}>Horario semanal</Text>
            <View style={styles.weekGrid}>
              {DAY_KEYS.map((key, i) => {
                const day = ws[key];
                const exs = day?.exercises ?? [];
                const hasEx = exs.length > 0;
                const isWeekend = key === 'saturday' || key === 'sunday';
                if (isWeekend && !hasEx) return null;
                return (
                  <TouchableOpacity
                    key={key} style={styles.dayCol}
                    onPress={() => openDay(a, key)} activeOpacity={hasEx ? 0.7 : 1}
                  >
                    <View style={[styles.dayHeader, hasEx && styles.dayHeaderActive]}>
                      <Text style={[styles.dayAbbr, hasEx && styles.dayAbbrActive]}>{DAY_ABBR[i]}</Text>
                      {hasEx && <Text style={styles.dayCount}>{exs.length}</Text>}
                    </View>
                    <View style={styles.dayExercises}>
                      {hasEx ? resolveExercises(exs).map((ex, idx) => (
                        <View key={idx} style={styles.exChip}>
                          <Text style={styles.exChipName} numberOfLines={2}>{ex.name}</Text>
                          <Text style={styles.exChipMeta}>{ex.sets}×{ex.reps}</Text>
                          {ex.weight && <Text style={styles.exChipWeight}>{ex.weight} kg</Text>}
                        </View>
                      )) : <View style={styles.dayEmpty} />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text style={styles.tapHint}>Toca un día para ver el detalle y registrar pesos</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <>
      <ScrollView
        style={styles.root} contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#C1EF00" />}
      >
        <Text style={styles.pageTitle}>Mis Rutinas</Text>
        {routines.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}><Dumbbell size={32} color="#9CA3AF" /></View>
            <Text style={styles.emptyTitle}>Sin rutinas asignadas</Text>
            <Text style={styles.emptyText}>Tu entrenador aún no te ha asignado ninguna rutina</Text>
          </View>
        ) : (
          <>
            {activeRoutines.length > 0 && (
              <><Text style={styles.sectionTitle}>Activas</Text>{activeRoutines.map(renderRoutine)}</>
            )}
            {inactiveRoutines.length > 0 && (
              <><Text style={[styles.sectionTitle, { marginTop: 16 }]}>Anteriores</Text>{inactiveRoutines.map(renderRoutine)}</>
            )}
          </>
        )}
      </ScrollView>

      {/* Single bottom sheet — switches between day view and log view */}
      <BottomSheet visible={sheetOpen} onClose={closeSheet}>

        {/* ── DAY VIEW ── */}
        {sheetView === 'day' && (
          <>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{dayData?.day}</Text>
              <TouchableOpacity onPress={closeSheet} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <X size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>
            {dayData?.exercises.map((ex, i) => (
              <TouchableOpacity
                key={i} style={styles.exDetailCard}
                onPress={() => openLog(ex)} activeOpacity={0.75}
              >
                <View style={styles.exDetailHeader}>
                  <View style={styles.exDetailIcon}><Dumbbell size={14} color="#212121" /></View>
                  <Text style={styles.exDetailName}>{ex.name}</Text>
                  <View style={styles.logBtn}>
                    <TrendingUp size={12} color="#212121" />
                    <Text style={styles.logBtnText}>Pesos</Text>
                  </View>
                </View>
                <View style={styles.exStatsRow}>
                  <StatBox label="Series" value={String(ex.sets)} />
                  <View style={styles.exStatDivider} />
                  <StatBox label="Reps" value={String(ex.reps)} />
                  {ex.weight && <><View style={styles.exStatDivider} /><StatBox label="Peso" value={`${ex.weight} kg`} /></>}
                  {ex.restSeconds > 0 && <><View style={styles.exStatDivider} /><StatBox label="Descanso" value={`${ex.restSeconds}s`} /></>}
                </View>
                {ex.equipmentName && (
                  <View style={styles.exMachineRow}>
                    <Weight size={12} color="#9CA3AF" />
                    <Text style={styles.exMachineText}>Máquina: {ex.equipmentName}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </>
        )}

        {/* ── LOG VIEW ── */}
        {sheetView === 'log' && (
          <>
            <View style={styles.sheetHeader}>
              <TouchableOpacity onPress={backToDay} style={styles.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <ChevronLeft size={18} color="#5A7A00" />
                <Text style={styles.backBtnText}>Volver</Text>
              </TouchableOpacity>
              <Text style={styles.sheetTitleCentered}>Actualizar pesos</Text>
              <TouchableOpacity onPress={closeSheet} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <X size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <Text style={styles.sheetSubtitle} numberOfLines={1}>{logData?.exerciseName}</Text>

            <View style={styles.logForm}>
              <View style={styles.logFormRow}>
                <View style={styles.logField}>
                  <Text style={styles.logFieldLabel}>Peso (kg) *</Text>
                  <TextInput
                    style={styles.logFieldInput} value={logWeight} onChangeText={setLogWeight}
                    placeholder={logData?.defaultWeight ?? 'ej: 50'} placeholderTextColor="#9CA3AF"
                    keyboardType="decimal-pad"
                  />
                </View>
                <View style={styles.logField}>
                  <Text style={styles.logFieldLabel}>Series</Text>
                  <TextInput
                    style={styles.logFieldInput} value={logSets} onChangeText={setLogSets}
                    placeholder={String(logData?.defaultSets ?? 3)} placeholderTextColor="#9CA3AF"
                    keyboardType="number-pad"
                  />
                </View>
                <View style={styles.logField}>
                  <Text style={styles.logFieldLabel}>Reps</Text>
                  <TextInput
                    style={styles.logFieldInput} value={logReps} onChangeText={setLogReps}
                    placeholder={logData?.defaultReps ?? '10'} placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>
              <TextInput
                style={styles.logNotesInput} value={logNotes} onChangeText={setLogNotes}
                placeholder="Notas opcionales..." placeholderTextColor="#9CA3AF" multiline
              />
              <TouchableOpacity
                style={[styles.saveBtn, logMutation.isPending && { opacity: 0.7 }]}
                onPress={handleSaveLog} disabled={logMutation.isPending} activeOpacity={0.85}
              >
                {logMutation.isPending
                  ? <ActivityIndicator color="#212121" size="small" />
                  : <><Check size={16} color="#212121" /><Text style={styles.saveBtnText}>Actualizar</Text></>}
              </TouchableOpacity>
            </View>

            {(() => {
              const history = logData ? (exerciseLogs[logData.exerciseName] ?? []) : [];
              if (!history.length) return (
                <Text style={styles.noHistory}>Aún no hay registros para este ejercicio</Text>
              );
              return (
                <View style={styles.historySection}>
                  <Text style={styles.historySectionTitle}>Historial</Text>
                  {[...history].reverse().map(log => (
                    <View key={log.id} style={styles.historyRow}>
                      <View>
                        <Text style={styles.historyRowDate}>
                          {format(new Date(log.date), 'dd MMM yy', { locale: es })}
                        </Text>
                        <Text style={styles.historyRowMeta}>{log.sets} series × {log.reps} reps</Text>
                      </View>
                      <Text style={styles.historyRowWeight}>{log.weightKg} kg</Text>
                    </View>
                  ))}
                </View>
              );
            })()}
          </>
        )}
      </BottomSheet>
    </>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.exStat}>
      <Text style={styles.exStatValue}>{value}</Text>
      <Text style={styles.exStatLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F1F2F6' },
  content: { padding: 20, paddingBottom: 32 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F1F2F6' },

  pageTitle: { fontSize: 22, fontWeight: '800', color: '#212121', marginBottom: 20 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },

  emptyState: { alignItems: 'center', paddingVertical: 48 },
  emptyIcon: { width: 72, height: 72, borderRadius: 24, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#212121', marginBottom: 6 },
  emptyText: { fontSize: 13, color: '#9CA3AF', textAlign: 'center' },

  card: {
    backgroundColor: '#FFFFFF', borderRadius: 16, marginBottom: 12, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 10 },
  cardIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#C1EF00', alignItems: 'center', justifyContent: 'center' },
  cardHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  routineName: { fontSize: 14, fontWeight: '700', color: '#212121', marginBottom: 2 },
  routineMeta: { fontSize: 11, color: '#6B7280' },
  diffBadge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 7 },
  diffText: { fontSize: 10, fontWeight: '700' },
  chevron: { fontSize: 10, color: '#9CA3AF' },

  scheduleWrap: { borderTopWidth: 1, borderTopColor: '#F1F2F6', padding: 12 },
  scheduleLabel: { fontSize: 11, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  weekGrid: { flexDirection: 'row', gap: 4 },
  dayCol: { flex: 1, alignItems: 'center' },
  dayHeader: { width: '100%', borderRadius: 8, paddingVertical: 6, alignItems: 'center', backgroundColor: '#F1F2F6', marginBottom: 4 },
  dayHeaderActive: { backgroundColor: '#C1EF00' },
  dayAbbr: { fontSize: 11, fontWeight: '700', color: '#9CA3AF' },
  dayAbbrActive: { color: '#212121' },
  dayCount: { fontSize: 9, color: '#212121', opacity: 0.6, marginTop: 1 },
  dayExercises: { width: '100%', gap: 3 },
  dayEmpty: { height: 40, borderRadius: 6, borderWidth: 1, borderColor: '#F1F2F6', borderStyle: 'dashed' },
  exChip: { backgroundColor: '#F8F9FA', borderRadius: 6, padding: 5, borderLeftWidth: 2, borderLeftColor: '#C1EF00' },
  exChipName: { fontSize: 9, fontWeight: '600', color: '#212121', lineHeight: 12 },
  exChipMeta: { fontSize: 8, color: '#6B7280', marginTop: 1 },
  exChipWeight: { fontSize: 8, color: '#5A7A00', fontWeight: '700', marginTop: 1 },
  tapHint: { fontSize: 10, color: '#9CA3AF', textAlign: 'center', marginTop: 10 },

  // Sheet
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: '#212121', flex: 1 },
  sheetTitleCentered: { fontSize: 16, fontWeight: '800', color: '#212121', flex: 1, textAlign: 'center' },
  sheetSubtitle: { fontSize: 12, color: '#9CA3AF', marginBottom: 14 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 2, marginRight: 8 },
  backBtnText: { fontSize: 13, fontWeight: '600', color: '#5A7A00' },

  exDetailCard: { backgroundColor: '#F8F9FA', borderRadius: 14, padding: 14, marginBottom: 10, borderLeftWidth: 3, borderLeftColor: '#C1EF00' },
  exDetailHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  exDetailIcon: { width: 28, height: 28, borderRadius: 8, backgroundColor: '#C1EF00', alignItems: 'center', justifyContent: 'center' },
  exDetailName: { fontSize: 14, fontWeight: '700', color: '#212121', flex: 1 },
  logBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#C1EF00', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  logBtnText: { fontSize: 10, fontWeight: '700', color: '#212121' },
  exStatsRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 10, padding: 10 },
  exStat: { flex: 1, alignItems: 'center' },
  exStatValue: { fontSize: 16, fontWeight: '800', color: '#212121' },
  exStatLabel: { fontSize: 10, color: '#9CA3AF', marginTop: 2 },
  exStatDivider: { width: 1, height: 28, backgroundColor: '#F1F2F6' },
  exMachineRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8 },
  exMachineText: { fontSize: 11, color: '#9CA3AF' },

  logForm: { backgroundColor: '#F8F9FA', borderRadius: 14, padding: 14, marginBottom: 16 },
  logFormRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  logField: { flex: 1 },
  logFieldLabel: { fontSize: 10, fontWeight: '600', color: '#6B7280', marginBottom: 4, textTransform: 'uppercase' },
  logFieldInput: { height: 40, backgroundColor: '#FFFFFF', borderRadius: 10, paddingHorizontal: 10, fontSize: 14, color: '#212121' },
  logNotesInput: { backgroundColor: '#FFFFFF', borderRadius: 10, padding: 10, fontSize: 13, color: '#212121', minHeight: 52, textAlignVertical: 'top', marginBottom: 10 },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#C1EF00', borderRadius: 12, height: 44 },
  saveBtnText: { fontSize: 14, fontWeight: '700', color: '#212121' },

  noHistory: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', paddingVertical: 16 },
  historySection: { gap: 6 },
  historySectionTitle: { fontSize: 12, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  historyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F8F9FA', borderRadius: 10, padding: 12 },
  historyRowDate: { fontSize: 13, fontWeight: '600', color: '#212121' },
  historyRowMeta: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  historyRowWeight: { fontSize: 18, fontWeight: '800', color: '#212121' },
});
