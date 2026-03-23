import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import TerminalWebView from '../../components/TerminalWebView';
import CreateModal from '../../components/CreateModal';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useApi } from '../../hooks/useApi';
import { useStore, TerminalSession } from '../../store';
import { colors, spacing, radius, fontSize } from '../../constants/theme';

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
        const currentActive = useStore.getState().activeSessionId;
        if (data.length > 0 && !currentActive) {
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
          removeSession(id);
          if (activeSessionId === id) {
            const remaining = sessions.filter(s => s.id !== id);
            setActiveSessionId(remaining.length > 0 ? remaining[0].id : null);
          }
          apiFetch(`/api/sessions/${id}`, { method: 'DELETE' }).catch(() => {});
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
          <View style={[styles.dot, { backgroundColor: activeSession?.active ? colors.accent : colors.textDim }]} />
          <Text style={styles.sessionName} numberOfLines={1}>
            {activeSession?.title || 'Geen sessie'}
          </Text>
          <Text style={styles.sessionCount}>{activeSessions.length}</Text>
          <Ionicons name={showSessions ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textMuted} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowCreate(true)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="add" size={22} color={colors.accent} />
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
                <View style={[styles.dot, { backgroundColor: item.active ? colors.accent : colors.textDim }]} />
                <View style={styles.sessionInfo}>
                  <Text style={styles.sessionTitle}>{item.title}</Text>
                  <Text style={styles.sessionPath} numberOfLines={1}>{item.workdir}</Text>
                </View>
                {item.active && (
                  <TouchableOpacity onPress={() => killSession(item.id)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Ionicons name="close-circle" size={18} color={colors.red} />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text style={styles.noSessions}>Geen sessies</Text>
            }
            ListFooterComponent={
              <TouchableOpacity style={styles.newSessionBtn} onPress={() => { setShowSessions(false); setShowCreate(true); }}>
                <Ionicons name="add-circle" size={16} color={colors.accent} />
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
          <Ionicons name="terminal" size={48} color={colors.textDim} />
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
  container: { flex: 1, backgroundColor: colors.bg },
  topBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  sessionSelector: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.elevated, borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
  },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: spacing.sm },
  sessionName: { color: colors.text, fontSize: fontSize.standard, flex: 1, marginRight: spacing.sm },
  sessionCount: {
    color: colors.accent, fontSize: fontSize.micro, fontWeight: '700',
    backgroundColor: '#1a2a1a', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2, marginRight: 6,
  },
  addBtn: { marginLeft: spacing.md, padding: spacing.sm },
  sessionPanel: {
    backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border, maxHeight: 250,
  },
  sessionRow: {
    flexDirection: 'row', alignItems: 'center', padding: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  sessionRowActive: { backgroundColor: '#0a1a0a' },
  sessionInfo: { flex: 1, marginLeft: spacing.xs },
  sessionTitle: { color: colors.text, fontSize: fontSize.standard, fontWeight: '600' },
  sessionPath: { color: colors.textDim, fontSize: fontSize.micro, fontFamily: 'monospace', marginTop: 2 },
  noSessions: { color: colors.textDim, textAlign: 'center', padding: spacing.lg },
  newSessionBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.border,
  },
  newSessionText: { color: colors.accent, fontSize: fontSize.standard, fontWeight: '600', marginLeft: 6 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: colors.textDim, fontSize: fontSize.body, marginTop: spacing.md, marginBottom: spacing.xl },
  emptyBtn: { backgroundColor: colors.accent, borderRadius: radius.md, paddingHorizontal: spacing.xl, paddingVertical: spacing.md },
  emptyBtnText: { color: colors.bg, fontWeight: '700', fontSize: fontSize.body },
});
