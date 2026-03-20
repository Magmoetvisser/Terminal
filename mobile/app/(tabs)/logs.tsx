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

  // Auto-select first session
  useEffect(() => {
    if (!selectedSession && sessions.length > 0) {
      setSelectedSession(sessions[0].id);
    }
  }, [sessions]);

  // Fetch logs when session changes
  useEffect(() => {
    if (selectedSession) fetchLogs(selectedSession);
  }, [selectedSession, fetchLogs]);

  // Auto-refresh elke 3 sec
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

  // Split log in regels en filter op zoekterm
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
              <View style={[styles.chipDot, { backgroundColor: item.active ? '#4ade80' : '#555' }]} />
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
          <Ionicons name="terminal" size={14} color="#4ade80" />
          <Text style={styles.infoText} numberOfLines={1}>{selectedInfo.workdir}</Text>
          <Text style={styles.infoStatus}>{selectedInfo.active ? 'Actief' : 'Gestopt'}</Text>
        </View>
      )}

      {/* Search bar */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={16} color="#555" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Zoeken in logs..."
          placeholderTextColor="#555"
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color="#555" />
          </TouchableOpacity>
        )}
      </View>

      {/* Log output */}
      {loading && !logData ? (
        <ActivityIndicator color="#4ade80" style={{ padding: 40 }} />
      ) : !selectedSession ? (
        <View style={styles.empty}>
          <Ionicons name="document-text-outline" size={48} color="#333" />
          <Text style={styles.emptyText}>Selecteer een sessie om logs te bekijken</Text>
        </View>
      ) : logLines.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="document-text-outline" size={48} color="#333" />
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
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4ade80" />}
          initialNumToRender={50}
          inverted={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  sessionBar: {
    paddingVertical: 10, paddingHorizontal: 12,
    borderBottomWidth: 1, borderBottomColor: '#1a1a1a',
  },
  sectionLabel: {
    color: '#555', fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginBottom: 8,
  },
  chip: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1a1a1a', borderRadius: 16,
    paddingHorizontal: 14, paddingVertical: 7, marginRight: 8,
    borderWidth: 1, borderColor: '#2a2a2a',
  },
  chipActive: { backgroundColor: '#4ade80', borderColor: '#4ade80' },
  chipDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  chipText: { color: '#aaa', fontSize: 12 },
  chipTextActive: { color: '#0a0a0a', fontWeight: '600' },
  noSessions: { color: '#555', fontSize: 13 },
  infoBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 6,
    backgroundColor: '#0f0f0f', borderBottomWidth: 1, borderBottomColor: '#1a1a1a',
  },
  infoText: { color: '#666', fontSize: 11, fontFamily: 'monospace', flex: 1, marginLeft: 6 },
  infoStatus: { color: '#4ade80', fontSize: 10, fontWeight: '600' },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1a1a1a', margin: 12, marginBottom: 4,
    borderRadius: 10, paddingHorizontal: 12,
    borderWidth: 1, borderColor: '#2a2a2a',
  },
  searchInput: { flex: 1, color: '#e0e0e0', fontSize: 14, paddingVertical: 10 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyText: { color: '#555', marginTop: 12, textAlign: 'center' },
  logLine: {
    flexDirection: 'row', paddingVertical: 1, paddingHorizontal: 4,
  },
  lineNum: {
    color: '#333', fontSize: 11, fontFamily: 'monospace',
    width: 36, textAlign: 'right', marginRight: 8,
  },
  lineText: { color: '#ccc', fontSize: 12, fontFamily: 'monospace', flex: 1, lineHeight: 18 },
});
