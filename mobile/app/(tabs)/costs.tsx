import React from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useApi } from '../../hooks/useApi';
import { useStore } from '../../store';
import { formatTokens, formatCost } from '../../utils/formatters';

export default function CostsScreen() {
  const { apiFetch } = useApi();
  const { accentColor } = useStore();

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['costs-stats'],
    queryFn: () => apiFetch('/api/agents/stats'),
    refetchInterval: 3000,
  });

  const { data: sessions, isLoading: sessionsLoading, refetch: refetchSessions } = useQuery({
    queryKey: ['costs-sessions'],
    queryFn: () => apiFetch('/api/agents/sessions'),
    refetchInterval: 3000,
  });

  const { data: agents, refetch: refetchAgents } = useQuery({
    queryKey: ['costs-agents'],
    queryFn: () => apiFetch('/api/agents'),
    refetchInterval: 3000,
  });

  const onRefresh = () => {
    refetchStats();
    refetchSessions();
    refetchAgents();
  };

  // Map sessionId -> agent name
  const agentNameMap: Record<string, string> = {};
  if (Array.isArray(agents)) {
    for (const a of agents) {
      if (a.sessionId) agentNameMap[a.sessionId] = a.name || a.project || a.id;
    }
  }

  // Calculate totals from all sessions (stats only shows current agent)
  const sessionList = sessions
    ? Object.entries(sessions).map(([id, s]: [string, any]) => ({ id, ...s }))
        .sort((a: any, b: any) => (b.estimatedCost || 0) - (a.estimatedCost || 0))
    : [];

  const inputTokens = sessionList.reduce((sum: number, s: any) => sum + (s.inputTokens || 0), 0);
  const outputTokens = sessionList.reduce((sum: number, s: any) => sum + (s.outputTokens || 0), 0);
  const totalTokens = inputTokens + outputTokens;
  const totalCost = sessionList.reduce((sum: number, s: any) => sum + (s.estimatedCost || 0), 0);

  const inputPercent = totalTokens > 0 ? (inputTokens / totalTokens) * 100 : 0;
  const outputPercent = totalTokens > 0 ? (outputTokens / totalTokens) * 100 : 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={statsLoading || sessionsLoading}
          onRefresh={onRefresh}
          tintColor={accentColor}
        />
      }
    >
          {/* Total cost hero */}
          <View style={styles.heroCard}>
            <View style={styles.heroRow}>
              <View style={styles.heroBlock}>
                <Text style={styles.heroLabel}>Huidige sessies</Text>
                <Text style={[styles.heroCost, { color: accentColor }]}>
                  {formatCost(totalCost)}
                </Text>
              </View>
              {(stats?.lifetimeCost != null || stats?.totalCost != null) && (
                <View style={[styles.heroBlock, styles.heroDivider]}>
                  <Text style={styles.heroLabel}>Lifetime totaal</Text>
                  <Text style={[styles.heroCost, { color: '#facc15' }]}>
                    {formatCost(stats?.lifetimeCost ?? stats?.totalCost ?? 0)}
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.heroSub}>live bijgewerkt</Text>
          </View>

          {/* Token breakdown */}
          <Text style={styles.sectionTitle}>Tokens</Text>
          <View style={styles.tokenCard}>
            <View style={styles.tokenRow}>
              <View style={styles.tokenItem}>
                <Ionicons name="arrow-up" size={14} color="#60a5fa" />
                <Text style={styles.tokenLabel}> Input</Text>
              </View>
              <View style={styles.tokenRight}>
                <Text style={[styles.tokenValue, { color: '#60a5fa' }]}>{formatTokens(inputTokens)}</Text>
                <Text style={styles.tokenPercent}>{inputPercent.toFixed(1)}%</Text>
              </View>
            </View>
            <View style={styles.tokenRow}>
              <View style={styles.tokenItem}>
                <Ionicons name="arrow-down" size={14} color="#c084fc" />
                <Text style={styles.tokenLabel}> Output</Text>
              </View>
              <View style={styles.tokenRight}>
                <Text style={[styles.tokenValue, { color: '#c084fc' }]}>{formatTokens(outputTokens)}</Text>
                <Text style={styles.tokenPercent}>{outputPercent.toFixed(1)}%</Text>
              </View>
            </View>
            <View style={[styles.tokenRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.tokenLabel}>Totaal</Text>
              <Text style={styles.tokenValue}>{formatTokens(totalTokens)}</Text>
            </View>

            {/* Bar */}
            <View style={styles.bar}>
              <View style={[styles.barSegment, { width: `${inputPercent}%`, backgroundColor: '#60a5fa' }]} />
              <View style={[styles.barSegment, { width: `${outputPercent}%`, backgroundColor: '#c084fc' }]} />
            </View>
          </View>

          {/* Per session breakdown */}
          {sessionList.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Per sessie</Text>
              {sessionList.map((s: any) => {
                const sessionTokens = (s.inputTokens || 0) + (s.outputTokens || 0);
                const tokenPct = totalTokens > 0 ? (sessionTokens / totalTokens) * 100 : 0;
                const agentName = agentNameMap[s.id];
                return (
                  <View key={s.id} style={styles.sessionRow}>
                    <View style={styles.sessionInfo}>
                      <Text style={styles.sessionName} numberOfLines={1}>
                        {agentName || s.id.slice(0, 16)}
                      </Text>
                      <Text style={styles.sessionModel}>{s.model || 'onbekend'}</Text>
                    </View>
                    <View style={styles.sessionMid}>
                      <Text style={styles.sessionTokens}>
                        {formatTokens(sessionTokens)}
                      </Text>
                      <Text style={styles.sessionPct}>{tokenPct.toFixed(1)}%</Text>
                    </View>
                    <View style={styles.sessionRight}>
                      <Text style={[styles.sessionCost, { color: accentColor }]}>
                        {formatCost(s.estimatedCost || 0)}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </>
          )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  content: { padding: 12, paddingBottom: 40 },
  heroCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    marginTop: 8,
  },
  heroRow: { flexDirection: 'row', width: '100%', justifyContent: 'space-around' },
  heroBlock: { alignItems: 'center', flex: 1 },
  heroDivider: { borderLeftWidth: 1, borderLeftColor: '#2a2a2a' },
  heroLabel: { color: '#888', fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  heroCost: { fontSize: 32, fontWeight: '800', fontFamily: 'monospace', marginVertical: 8 },
  heroSub: { color: '#555', fontSize: 11, marginTop: 4 },
  sectionTitle: {
    color: '#888', fontSize: 12, fontWeight: '600',
    textTransform: 'uppercase', letterSpacing: 1,
    marginTop: 20, marginBottom: 8, marginLeft: 4,
  },
  tokenCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  tokenRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  tokenItem: { flexDirection: 'row', alignItems: 'center' },
  tokenLabel: { color: '#aaa', fontSize: 13 },
  tokenRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tokenValue: { color: '#e0e0e0', fontSize: 14, fontWeight: '700', fontFamily: 'monospace' },
  tokenPercent: { color: '#666', fontSize: 11, fontFamily: 'monospace', width: 45, textAlign: 'right' },
  bar: {
    flexDirection: 'row',
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2a2a2a',
    marginTop: 12,
    overflow: 'hidden',
  },
  barSegment: { height: '100%' },
  sessionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    padding: 12,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  sessionInfo: { flex: 1 },
  sessionName: { color: '#e0e0e0', fontSize: 13, fontWeight: '600' },
  sessionModel: { color: '#666', fontSize: 10, marginTop: 2 },
  sessionMid: { alignItems: 'flex-end', marginRight: 12 },
  sessionTokens: { color: '#aaa', fontSize: 12, fontFamily: 'monospace' },
  sessionPct: { color: '#666', fontSize: 10, marginTop: 2 },
  sessionRight: { alignItems: 'flex-end' },
  sessionCost: { fontSize: 14, fontWeight: '700', fontFamily: 'monospace' },
});
