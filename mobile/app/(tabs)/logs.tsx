import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApi } from '../../hooks/useApi';
import { useStore, TerminalSession } from '../../store';
import { colors, spacing, radius, fontSize } from '../../constants/theme';

export default function LogsScreen() {
  const { apiFetch } = useApi();
  const { sessions } = useStore();
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [logData, setLogData] = useState<string>('');
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchLogs = useCallback(
    async (sessionId: string) => {
      setLoading(true);
      try {
        const { logs } = await apiFetch(`/api/sessions/${sessionId}/logs`);
        setLogData(logs || '');
      } catch {
        setLogData('');
      } finally {
        setLoading(false);
      }
    },
    [apiFetch],
  );

  useEffect(() => {
    if (!selectedSession && sessions.length > 0) {
      setSelectedSession(sessions[0].id);
    }
  }, [sessions]);

  useEffect(() => {
    if (selectedSession) fetchLogs(selectedSession);
  }, [selectedSession, fetchLogs]);

  useEffect(() => {
    if (!selectedSession) return;
    const interval = setInterval(() => fetchLogs(selectedSession), 3000);
    return () => clearInterval(interval);
  }, [selectedSession, fetchLogs]);

  const onRefresh = async () => {
    if (!selectedSession) return;
    setRefreshing(true);
    await fetchLogs(selectedSession);
    setRefreshing(false);
  };

  const logLines = logData
    .split('\n')
    .filter((line) => !search || line.toLowerCase().includes(search.toLowerCase()));

  const selectedInfo = sessions.find((s) => s.id === selectedSession);

  return (
    <View style={styles.container}>
      {/* Session selector */}
      <View style={styles.sessionBar}>
        <Text style={styles.sectionLabel}>SESSIE</Text>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={sessions}
          keyExtractor={(s) => s.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.chip, item.id === selectedSession && styles.chipActive]}
              onPress={() => setSelectedSession(item.id)}
            >
              <View style={[styles.chipDot, { backgroundColor: item.active ? colors.accent : colors.textDim }]} />
              <Text style={[styles.chipText, item.id === selectedSession && styles.chipTextActive]}>
                {item.title}
              </Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text style={styles.noSessions}>Geen sessies beschikbaar</Text>}
        />
      </View>

      {/* Session info */}
      {selectedInfo && (
        <View style={styles.infoBar}>
          <Ionicons name="terminal" size={14} color={colors.accent} />
          <Text style={styles.infoText} numberOfLines={1}>{selectedInfo.workdir}</Text>
          <Text style={styles.infoStatus}>{selectedInfo.active ? 'Actief' : 'Gestopt'}</Text>
        </View>
      )}

      {/* Search bar */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={16} color={colors.textDim} style={{ marginRight: spacing.sm }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Zoeken in logs..."
          placeholderTextColor={colors.textDim}
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close-circle" size={18} color={colors.textDim} />
          </TouchableOpacity>
        )}
      </View>

      {/* Log output */}
      {loading && !logData ? (
        <ActivityIndicator color={colors.accent} style={{ padding: 40 }} />
      ) : !selectedSession ? (
        <View style={styles.empty}>
          <Ionicons name="document-text-outline" size={48} color={colors.textDim} />
          <Text style={styles.emptyText}>Selecteer een sessie om logs te bekijken</Text>
        </View>
      ) : logLines.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="document-text-outline" size={48} color={colors.textDim} />
          <Text style={styles.emptyText}>
            {search ? 'Geen resultaten gevonden' : 'Nog geen output in deze sessie'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={logLines}
          keyExtractor={(_, i) => String(i)}
          renderItem={({ item, index }) => (
            <View style={styles.logLine}>
              <Text style={styles.lineNum}>{index + 1}</Text>
              <Text style={styles.lineText} selectable>{item}</Text>
            </View>
          )}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
          initialNumToRender={50}
          inverted={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  sessionBar: {
    paddingVertical: spacing.md, paddingHorizontal: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  sectionLabel: {
    color: colors.textDim, fontSize: fontSize.micro, fontWeight: '700', letterSpacing: 1.5, marginBottom: spacing.sm,
  },
  chip: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.elevated, borderRadius: radius.sm,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm, marginRight: spacing.sm,
    borderWidth: 1, borderColor: colors.borderStrong,
  },
  chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  chipText: { color: colors.textSecondary, fontSize: fontSize.caption },
  chipTextActive: { color: colors.bg, fontWeight: '600' },
  noSessions: { color: colors.textDim, fontSize: fontSize.standard },
  infoBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingVertical: 6,
    backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  infoText: { color: colors.textMuted, fontSize: fontSize.micro, fontFamily: 'monospace', flex: 1, marginLeft: 6 },
  infoStatus: { color: colors.accent, fontSize: fontSize.micro, fontWeight: '600' },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.elevated, margin: spacing.md, marginBottom: spacing.xs,
    borderRadius: radius.md, paddingHorizontal: spacing.md,
    borderWidth: 1, borderColor: colors.borderStrong,
  },
  searchInput: { flex: 1, color: colors.text, fontSize: fontSize.standard, paddingVertical: 10 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyText: { color: colors.textDim, marginTop: spacing.md, textAlign: 'center', fontSize: fontSize.standard },
  logLine: {
    flexDirection: 'row', paddingVertical: 1, paddingHorizontal: spacing.xs,
  },
  lineNum: {
    color: colors.textDim, fontSize: fontSize.micro, fontFamily: 'monospace',
    width: 36, textAlign: 'right', marginRight: spacing.sm,
  },
  lineText: { color: colors.textSecondary, fontSize: fontSize.caption, fontFamily: 'monospace', flex: 1, lineHeight: 18 },
});
