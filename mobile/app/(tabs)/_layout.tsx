import React, { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { useStore } from '../../store';

const ACCENT_KEY = 'hussle_accent_color';

export default function TabLayout() {
  const { accentColor, setAccentColor } = useStore();

  useEffect(() => {
    SecureStore.getItemAsync(ACCENT_KEY).then((stored) => {
      if (stored) setAccentColor(stored);
    });
  }, []);

  return (
    <Tabs
      sceneContainerStyle={{ backgroundColor: '#0a0a0a' }}
      screenOptions={{
        tabBarStyle: {
          backgroundColor: '#0a0a0a',
          borderTopColor: '#1a1a1a',
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: accentColor,
        tabBarInactiveTintColor: '#555',
        headerStyle: { backgroundColor: '#0a0a0a' },
        headerTintColor: '#e0e0e0',
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="terminal"
        options={{
          title: 'Terminal',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="terminal" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="logs"
        options={{
          title: 'Logs',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="document-text" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="agents"
        options={{
          title: 'Agents',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="costs"
        options={{
          title: 'Kosten',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="wallet" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="usage"
        options={{
          title: 'Usage',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="stats-chart" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Instellingen',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-sharp" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
