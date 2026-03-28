import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SplashScreen } from './screens/SplashScreen';
import { LoginScreen } from './screens/LoginScreen';
import { ChangePasswordScreen } from './screens/ChangePasswordScreen';
import { HomeScreen } from './screens/HomeScreen';
import { RoutinesScreen } from './screens/RoutinesScreen';
import { ProgressScreen } from './screens/ProgressScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { BottomNav, Tab } from './components/BottomNav';
import { AuthUser } from './lib/auth';

const queryClient = new QueryClient();

type Screen = 'splash' | 'login' | 'change-password' | 'app';

function AppContent() {
  const [screen, setScreen] = useState<Screen>('splash');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [tab, setTab] = useState<Tab>('home');
  const insets = useSafeAreaInsets();

  const handleLoginSuccess = (loggedUser: AuthUser) => {
    setUser(loggedUser);
    if (loggedUser.mustChangePassword) {
      setScreen('change-password');
    } else {
      setScreen('app');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setTab('home');
    queryClient.clear();
    setScreen('login');
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar style={screen === 'splash' ? 'light' : 'dark'} />

      {screen === 'splash' && <SplashScreen onFinish={() => setScreen('login')} />}
      {screen === 'login' && (
        <LoginScreen onLoginSuccess={handleLoginSuccess} onChangePassword={() => setScreen('change-password')} />
      )}
      {screen === 'change-password' && (
        <ChangePasswordScreen onSuccess={() => setScreen('app')} />
      )}

      {screen === 'app' && user && (
        <View style={styles.app}>
          <View style={styles.content}>
            {tab === 'home'     && <HomeScreen user={user} onTabChange={setTab} />}
            {tab === 'routines' && <RoutinesScreen />}
            {tab === 'progress' && <ProgressScreen />}
            {tab === 'profile'  && <ProfileScreen user={user} onLogout={handleLogout} />}
          </View>
          <BottomNav active={tab} onChange={setTab} bottomInset={insets.bottom} />
        </View>
      )}
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AppContent />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F1F2F6' },
  app: { flex: 1 },
  content: { flex: 1 },
});
