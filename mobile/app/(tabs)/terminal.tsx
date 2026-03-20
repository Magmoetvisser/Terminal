import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import TerminalWebView from '../../components/TerminalWebView';
import CreateModal from '../../components/CreateModal';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useApi } from '../../hooks/useApi';
import { useStore, TerminalSession } from '../../store';

export default function TerminalScreen() {
  const { sessions, activeSessionId, setSessions, setActiveSessionId, addSession, removeSession } = useStore();
  const [showCreate, setShowCreate] = useState(false);
  const [showSessions, setShowSessions] = useState(false);
  const { apiFetch } = useApi();

  const handleWsMessage = useCallback(
    (msg: any) => {
      if (msg.type === 'terminal/output' && msg.sessionId === activeSessionId) {
        TerminalWebView.write(msg.data);
      } else if (msg.type === 'session/list') {
        setSessions(msg.sessions);
      }
    },
    [activeSessionId, setSessions],
  );

  const { sendInput, subscribe, resize } = useWebSocket(handleWsMessage);

  useEffect(() => {
    if (activeSessionId) {
      TerminalWebView.clear();
      subscribe(activeSessionId);
    }
  }, [activeSessionId, subscribe]);

  useEffect(() => {
    apiFetch('/api/sessions')
      .then((data: TerminalSession[]) => {
        setSessions(data);
        if (data.length > 0 && !activeSessionId) {
          setActiveSessionId(data[0].id);
        }
      })
      .catch(() => {});
  }, []);

  const handleInput = useCallback(
    (data: string) => { if (activeSessionId) sendInput(activeSessionId, data); },
    [activeSessionId, sendInput],
  );

  const handleResize = useCallback(
    (cols: number, rows: number) => { if (activeSessionId) resize(activeSessionId, cols, rows); },
    [activeSessionId, resize],
  );

  const handleSessionCreated = (session: TerminalSession) => {
    addSession(session);
    setActiveSessionId(session.id);
    setShowSessions(false);
  };

  const killSession = (id: string) => {
    Alert.alert('Sessie beëindigen?', 'Weet je het zeker?', [
      { text: 'Annuleer', style: 'cancel' },
      {
        text: 'Beëindigen', style: 'destructive',
        onPress: async () => {
          try {
            await apiFetch(`/api/sessions/${id}`, { method: 'DELETE' });
            removeSession(id);
            if (activeSessionId === id) {
              const remaining = sessions.filter(s => s.id !== id);
              setActiveSessionId(remaining.length > 0 ? remaining[0].id : null);
            }
          } catch (err: any) {
            Alert.alert('Error', err.message);
          }
        },
      },
    ]);
  };

  const activeSession = sessions.find((s) => s.id === activeSessionId);
  const activeSessions = sessions.filter(s => s.active);

  return (
    <View style={styles.container}>
      {/* Top bar with session info */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.sessionSelector} onPress={() => setShowSessions(!showSessions)}>
          <View style={[styles.dot, { backgroundColor: activeSession?.active ? '#4ade80' : '#555' }]} />
          <Text style={styles.sessionName} numberOfLines={1}>
            {activeSession?.title || 'Geen sessie'}
          </Text>
          <Text style={styles.sessionCount}>{activeSessions.length}</Text>
          <Ionicons name={showSessions ? 'chevron-up' : 'chevron-down'} size={16} color="#888" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowCreate(true)}>
          <Ionicons name="add" size={22} color="#4ade80" />
        </TouchableOpacity>
      </View>

      {/* Session list panel */}
      {showSessions && (
        <View style={styles.sessionPanel}>
          <FlatList
            data={sessions}
            keyExtractor={(s) => s.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.sessionRow, item.id === activeSessionId && styles.sessionRowActive]}
                onPress={() => { setActiveSessionId(item.id); setShowSessions(false); }}
              >
                <View style={[styles.dot, { backgroundColor: item.active ? '#4ade80' : '#555' }]} />
                <View style={styles.sessionInfo}>
                  <Text style={styles.sessionTitle}>{item.title}</Text>
                  <Text style={styles.sessionPath} numberOfLines={1}>{item.workdir}</Text>
                </View>
                {item.active && (
                  <TouchableOpacity onPress={() => killSession(item.id)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Ionicons name="close-circle" size={18} color="#f87171" />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text style={styles.noSessions}>Geen sessies</Text>
            }
            ListFooterComponent={
              <TouchableOpacity style={styles.newSessionBtn} onPress={() => { setShowSessions(false); setShowCreate(true); }}>
                <Ionicons name="add-circle" size={16} color="#4ade80" />
                <Text style={styles.newSessionText}>Nieuwe sessie</Text>
              </TouchableOpacity>
            }
          />
        </View>
      )}

      {/* Terminal */}
      {activeSessionId ? (
        <TerminalWebView onInput={handleInput} onResize={handleResize} />
      ) : (
        <View style={styles.empty}>
          <Ionicons name="terminal" size={48} color="#333" />
          <Text style={styles.emptyText}>Geen actieve sessie</Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={() => setShowCreate(true)}>
            <Text style={styles.emptyBtnText}>Nieuwe sessie starten</Text>
          </TouchableOpacity>
        </View>
      )}

      <CreateModal
        visible={showCreate}
        onClose={() => setShowCreate(false)}
        onSessionCreated={handleSessionCreated}
        onSendPrompt={(sessionId, prompt) => {
          sendInput(sessionId, prompt + '\r');
          setActiveSessionId(sessionId);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  topBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: '#1a1a1a',
  },
  sessionSelector: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1a1a1a', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8,
  },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  sessionName: { color: '#e0e0e0', fontSize: 14, flex: 1, marginRight: 8 },
  sessionCount: {
    color: '#4ade80', fontSize: 11, fontWeight: '700',
    backgroundColor: '#1a2a1a', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2, marginRight: 6,
  },
  addBtn: { marginLeft: 10, padding: 6 },
  sessionPanel: {
    backgroundColor: '#111', borderBottomWidth: 1, borderBottomColor: '#1a1a1a', maxHeight: 250,
  },
  sessionRow: {
    flexDirection: 'row', alignItems: 'center', padding: 12,
    borderBottomWidth: 1, borderBottomColor: '#141414',
  },
  sessionRowActive: { backgroundColor: '#0a1a0a' },
  sessionInfo: { flex: 1, marginLeft: 4 },
  sessionTitle: { color: '#e0e0e0', fontSize: 14, fontWeight: '600' },
  sessionPath: { color: '#555', fontSize: 11, fontFamily: 'monospace', marginTop: 2 },
  noSessions: { color: '#555', textAlign: 'center', padding: 16 },
  newSessionBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    padding: 12, borderTopWidth: 1, borderTopColor: '#1a1a1a',
  },
  newSessionText: { color: '#4ade80', fontSize: 13, fontWeight: '600', marginLeft: 6 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: '#555', fontSize: 16, marginTop: 12, marginBottom: 20 },
  emptyBtn: { backgroundColor: '#4ade80', borderRadius: 10, paddingHorizontal: 20, paddingVertical: 12 },
  emptyBtnText: { color: '#0a0a0a', fontWeight: '700' },
});
