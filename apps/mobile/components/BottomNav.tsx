import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Home, Dumbbell, TrendingUp, User } from 'lucide-react-native';

export type Tab = 'home' | 'routines' | 'progress' | 'profile';

interface Props {
  active: Tab;
  onChange: (tab: Tab) => void;
  bottomInset?: number;
}

const TABS: { key: Tab; label: string; Icon: any }[] = [
  { key: 'home',     label: 'Inicio',   Icon: Home },
  { key: 'routines', label: 'Rutinas',  Icon: Dumbbell },
  { key: 'progress', label: 'Progreso', Icon: TrendingUp },
  { key: 'profile',  label: 'Perfil',   Icon: User },
];

export function BottomNav({ active, onChange, bottomInset = 0 }: Props) {
  return (
    <View style={[styles.container, { paddingBottom: Math.max(bottomInset, 8) }]}>
      {TABS.map(({ key, label, Icon }) => {
        const isActive = active === key;
        return (
          <TouchableOpacity
            key={key}
            style={styles.tab}
            onPress={() => onChange(key)}
            activeOpacity={0.7}
          >
            <View style={[styles.iconWrap, isActive && styles.iconWrapActive]}>
              <Icon size={20} color={isActive ? '#212121' : '#9CA3AF'} />
            </View>
            <Text style={[styles.label, isActive && styles.labelActive]}>{label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F2F6',
    paddingTop: 8,
    paddingHorizontal: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  iconWrap: {
    width: 40,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: '#C1EF00',
  },
  label: {
    fontSize: 10,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  labelActive: {
    color: '#212121',
    fontWeight: '700',
  },
});
