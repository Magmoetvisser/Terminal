import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  color?: string;
}

export function StatCard({ label, value, sub, color = '#4ade80' }: StatCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, { color }]}>{value}</Text>
      {sub && <Text style={styles.sub}>{sub}</Text>}
    </View>
  );
}

interface BarProps {
  label: string;
  percent: number;
  color?: string;
}

export function UsageBar({ label, percent, color = '#4ade80' }: BarProps) {
  return (
    <View style={styles.barContainer}>
      <View style={styles.barHeader}>
        <Text style={styles.barLabel}>{label}</Text>
        <Text style={styles.barPercent}>{percent.toFixed(1)}%</Text>
      </View>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${Math.min(percent, 100)}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 14,
    flex: 1,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  label: {
    color: '#888',
    fontSize: 11,
    marginBottom: 4,
  },
  value: {
    fontSize: 22,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  sub: {
    color: '#666',
    fontSize: 10,
    marginTop: 2,
  },
  barContainer: {
    marginBottom: 12,
  },
  barHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  barLabel: {
    color: '#aaa',
    fontSize: 12,
  },
  barPercent: {
    color: '#888',
    fontSize: 12,
    fontFamily: 'monospace',
  },
  barTrack: {
    height: 6,
    backgroundColor: '#2a2a2a',
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
});
