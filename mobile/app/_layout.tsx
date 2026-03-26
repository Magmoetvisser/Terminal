import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';

import { Stack, useRouter, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import { useStore } from '../store';
import SplashScreen from '../components/SplashScreen';

const queryClient = new QueryClient();

function AuthRedirect({ onReady }: { onReady: () => void }) {
  const { isAuthenticated, loadStored } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadStored().then(() => {
      setLoaded(true);
      onReady();
    });
  }, []);

  useEffect(() => {
    if (!loaded) return;

    const inAuth = segments[0] === 'login';

    if (!isAuthenticated && !inAuth) {
      router.replace('/login');
    } else if (isAuthenticated && inAuth) {
      router.replace('/(tabs)/terminal');
    }
  }, [loaded, isAuthenticated, segments]);

  return null;
}

export default function RootLayout() {
  const showSplash = useStore((s) => s.showSplash);
  const setShowSplash = useStore((s) => s.setShowSplash);
  const accentColor = useStore((s) => s.accentColor);
  const [authReady, setAuthReady] = useState(false);

  const handleAuthReady = useCallback(() => {
    setAuthReady(true);
  }, []);

  const handleSplashFinish = useCallback(() => {
    setShowSplash(false);
  }, [setShowSplash]);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthRedirect onReady={handleAuthReady} />
      <View style={styles.root}>
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: '#0a0a0a' },
            headerTintColor: '#e0e0e0',
            contentStyle: { backgroundColor: '#0a0a0a' },
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="editor/[path]" options={{ headerShown: true, title: 'Editor' }} />
          <Stack.Screen name="agent-history/[id]" options={{ headerShown: true, title: 'Geschiedenis', animation: 'slide_from_right' }} />
        </Stack>

        {showSplash && (
          <SplashScreen onFinish={handleSplashFinish} accentColor={accentColor} />
        )}
      </View>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
});
