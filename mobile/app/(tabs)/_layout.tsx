import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Drawer } from 'expo-router/drawer';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { useStore } from '../../store';
import { DrawerContentScrollView, DrawerContentComponentProps, useDrawerStatus } from '@react-navigation/drawer';
import { useNavigation, DrawerActions } from '@react-navigation/native';

const ACCENT_KEY = 'hussle_accent_color';

interface MenuItem {
  name: string;
  title: string;
  icon: string;
  section?: string;
}

const MENU_ITEMS: MenuItem[] = [
  { name: 'terminal', title: 'Terminal', icon: 'terminal', section: 'Hoofd' },
  { name: 'agents', title: 'Agents', icon: 'people', section: 'Hoofd' },
  { name: 'logs', title: 'Logs', icon: 'document-text', section: 'Monitor' },
  { name: 'usage', title: 'Usage', icon: 'stats-chart', section: 'Monitor' },
  { name: 'costs', title: 'Kosten', icon: 'wallet', section: 'Monitor' },
  { name: 'settings', title: 'Instellingen', icon: 'settings-sharp', section: 'Overig' },
];

function CustomDrawerContent(props: DrawerContentComponentProps) {
  const { accentColor } = useStore();
  const currentRoute = props.state.routes[props.state.index]?.name;

  let lastSection = '';

  return (
    <DrawerContentScrollView {...props} style={styles.drawer} contentContainerStyle={styles.drawerContent}>
      {/* Header */}
      <View style={styles.drawerHeader}>
        <View style={[styles.logoCircle, { backgroundColor: accentColor }]}>
          <Ionicons name="terminal" size={20} color="#0a0a0a" />
        </View>
        <Text style={styles.drawerTitle}>Hussle Terminal</Text>
      </View>

      {/* Menu items */}
      {MENU_ITEMS.map((item) => {
        const isActive = currentRoute === item.name;
        const showSection = item.section && item.section !== lastSection;
        if (item.section) lastSection = item.section;

        return (
          <View key={item.name}>
            {showSection && (
              <Text style={styles.sectionLabel}>{item.section}</Text>
            )}
            <TouchableOpacity
              style={[styles.menuItem, isActive && { backgroundColor: accentColor + '18' }]}
              onPress={() => props.navigation.navigate(item.name)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={item.icon as any}
                size={20}
                color={isActive ? accentColor : '#888'}
              />
              <Text style={[styles.menuText, isActive && { color: accentColor, fontWeight: '700' }]}>
                {item.title}
              </Text>
              {isActive && <View style={[styles.activeDot, { backgroundColor: accentColor }]} />}
            </TouchableOpacity>
          </View>
        );
      })}
    </DrawerContentScrollView>
  );
}

function DrawerToggle() {
  const navigation = useNavigation();
  return (
    <TouchableOpacity
      style={{ marginLeft: 14 }}
      onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Ionicons name="menu" size={24} color="#e0e0e0" />
    </TouchableOpacity>
  );
}

export default function DrawerLayout() {
  const { accentColor, setAccentColor } = useStore();

  useEffect(() => {
    SecureStore.getItemAsync(ACCENT_KEY).then((stored) => {
      if (stored) setAccentColor(stored);
    });
  }, []);

  return (
    <Drawer
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        drawerStyle: {
          backgroundColor: '#0a0a0a',
          width: 260,
        },
        headerStyle: { backgroundColor: '#0a0a0a' },
        headerTintColor: '#e0e0e0',
        headerTitleStyle: { fontWeight: '600' },
        swipeEnabled: true,
        swipeEdgeWidth: 50,
        headerLeft: () => <DrawerToggle />,
      }}
    >
      <Drawer.Screen name="terminal" options={{ title: 'Terminal' }} />
      <Drawer.Screen name="agents" options={{ title: 'Agents' }} />
      <Drawer.Screen name="logs" options={{ title: 'Logs' }} />
      <Drawer.Screen name="usage" options={{ title: 'Usage' }} />
      <Drawer.Screen name="costs" options={{ title: 'Kosten' }} />
      <Drawer.Screen name="settings" options={{ title: 'Instellingen' }} />
    </Drawer>
  );
}

const styles = StyleSheet.create({
  drawer: {
    backgroundColor: '#0a0a0a',
  },
  drawerContent: {
    paddingTop: 0,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
    marginBottom: 8,
  },
  logoCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerTitle: {
    color: '#e0e0e0',
    fontSize: 17,
    fontWeight: '800',
    marginLeft: 12,
  },
  sectionLabel: {
    color: '#555',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 6,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginHorizontal: 8,
    borderRadius: 10,
  },
  menuText: {
    color: '#ccc',
    fontSize: 15,
    marginLeft: 14,
    flex: 1,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
