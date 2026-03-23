import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Modal,
  Alert,
  TextInput,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import AgentCard from '../../components/AgentCard';
import FolderBrowser from '../../components/FolderBrowser';
import { useApi } from '../../hooks/useApi';
import { useStore, Agent } from '../../store';
import { getStatusColor } from '../../constants/theme';
import { formatDuration } from '../../utils/formatters';

export default function AgentsScreen() {
  const { apiFetch } = useApi();
  const { sessions, setAgents, addSession, setActiveSessionId, agentSessionMap, setAgentSession } = useStore();
  const router = useRouter();
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [showNewAgent, setShowNewAgent] = useState(false);
  const [agentProject, setAgentProject] = useState('');
  const [agentStartDir, setAgentStartDir] = useState('');
  const [agentPrompt, setAgentPrompt] = useState('');
  const [browseTarget, setBrowseTarget] = useState<'project' | 'startDir' | null>(null);

  const { data: agents = [], isLoading, refetch } = useQuery<Agent[]>({
    queryKey: ['agents'],
    queryFn: async () => {
      const data = await apiFetch('/api/agents');
      const agentList = Array.isArray(data) ? data : [];
      setAgents(agentList);
      return agentList;
    },
    refetchInterval: 5000,
  });

  const { data: stats } = useQuery({
    queryKey: ['agent-stats'],
    queryFn: () => apiFetch('/api/agents/stats'),
    refetchInterval: 10000,
  });

  const { data: health } = useQuery({
    queryKey: ['agent-health'],
    queryFn: () => apiFetch('/api/agents/health'),
    refetchInterval: 30000,
  });

  const pixelDeskRunning = health?.running === true;

  const launchAgent = async () => {
    if (!agentProject.trim()) {
      Alert.alert('Vul een project pad in');
      return;
    }
    try {
      const session = await apiFetch('/api/sessions', {
        method: 'POST',
        body: JSON.stringify({ workdir: agentStartDir.trim() || agentProject.trim() }),
      });
      setShowNewAgent(false);
      setAgentProject('');
      setAgentStartDir('');
      setAgentPrompt('');
      Alert.alert('Agent gestart', `Sessie ${session.title} geopend in ${agentProject}`);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  const openAgentProject = (agent: Agent) => {
    const projectPath = agent.metadata?.projectPath || agent.project;
    if (projectPath) {
      router.push(`/editor/${encodeURIComponent(projectPath)}` as any);
    }
  };

  const openAgentTerminal = async (agent: Agent) => {
    const projectPath = agent.metadata?.projectPath || agent.project;
    if (!projectPath) {
      Alert.alert('Geen project pad gevonden');
      return;
    }

    // Check if agent already has an active session
    const existingSessionId = agentSessionMap[agent.id];
    if (existingSessionId) {
      const existingSession = sessions.find(s => s.id === existingSessionId && s.active);
      if (existingSession) {
        setActiveSessionId(existingSessionId);
        setSelectedAgent(null);
        setTimeout(() => {
          router.push('/(tabs)/terminal' as any);
        }, 300);
        return;
      }
    }

    try {
      const session = await apiFetch('/api/sessions', {
        method: 'POST',
        body: JSON.stringify({ workdir: projectPath }),
      });
      addSession(session);
      setActiveSessionId(session.id);
      setAgentSession(agent.id, session.id);
      setSelectedAgent(null);
      setTimeout(() => {
        router.push('/(tabs)/terminal' as any);
      }, 300);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  const inactiveStatuses = ['done', 'error', 'offline'];
  const activeAgents = agents.filter(a => !inactiveStatuses.includes((a.status || '').toLowerCase()));
  const totalTokens = agents.reduce((sum, a) => sum + (a.tokenUsage?.inputTokens || 0) + (a.tokenUsage?.outputTokens || 0), 0);
  const totalCost = agents.reduce((sum, a) => sum + (a.tokenUsage?.estimatedCost || 0), 0);

  return (
    <View style={styles.container}>
      {/* Status bar */}
      <View style={styles.statusBar}>
        <View style={[styles.statusDot, { backgroundColor: pixelDeskRunning ? '#4ade80' : '#f87171' }]} />
        <Text style={styles.statusText}>
          Pixel Agent Desk: {pixelDeskRunning ? 'Online' : 'Offline'}
        </Text>
        <TouchableOpacity style={styles.newBtn} onPress={() => setShowNewAgent(true)}>
          <Ionicons name="add" size={18} color="#4ade80" />
          <Text style={styles.newBtnText}>Nieuw</Text>
        </TouchableOpacity>
      </View>

      {/* Summary */}
      <View style={styles.summary}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{agents.length}</Text>
          <Text style={styles.summaryLabel}>Agents</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: activeAgents.length > 0 ? '#4ade80' : '#e0e0e0' }]}>
            {activeAgents.length}
          </Text>
          <Text style={styles.summaryLabel}>Actief</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{totalTokens > 1000000 ? `${(totalTokens / 1000000).toFixed(1)}M` : totalTokens > 1000 ? `${(totalTokens / 1000).toFixed(0)}K` : totalTokens}</Text>
          <Text style={styles.summaryLabel}>Tokens</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: '#facc15' }]}>${totalCost.toFixed(2)}</Text>
          <Text style={styles.summaryLabel}>Kosten</Text>
        </View>
      </View>

      {/* Agent list */}
      <FlatList
        data={agents}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => setSelectedAgent(item)}>
            <AgentCard agent={item} />
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor="#4ade80" />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={48} color="#333" />
            <Text style={styles.emptyText}>
              {pixelDeskRunning ? 'Geen actieve agents' : 'Pixel Agent Desk is niet actief'}
            </Text>
          </View>
        }
      />

      {/* Agent detail modal */}
      <Modal visible={!!selectedAgent} transparent animationType="slide" onRequestClose={() => setSelectedAgent(null)}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setSelectedAgent(null)}>
          <View style={styles.detailSheet} onStartShouldSetResponder={() => true}>
            <View style={styles.handle} />
            {selectedAgent && (
              <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
                <View style={styles.detailHeader}>
                  <View style={[styles.bigDot, { backgroundColor: getStatusColor(selectedAgent.status) }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.detailName}>{selectedAgent.name || selectedAgent.id}</Text>
                    <View style={styles.detailStatusRow}>
                      <Text style={[styles.detailStatus, { color: getStatusColor(selectedAgent.status) }]}>
                        {selectedAgent.status || 'idle'}
                      </Text>
                      {selectedAgent.timing?.active && (
                        <View style={styles.liveBadge}>
                          <Text style={styles.liveText}>LIVE</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Model</Text>
                  <Text style={styles.detailValue}>{selectedAgent.model || 'unknown'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Type</Text>
                  <Text style={styles.detailValue}>{selectedAgent.type || 'main'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Project</Text>
                  <Text style={styles.detailValue} numberOfLines={2}>
                    {selectedAgent.metadata?.projectPath || selectedAgent.project || 'Onbekend'}
                  </Text>
                </View>
                {selectedAgent.currentTool && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Huidige tool</Text>
                    <Text style={[styles.detailValue, { color: '#60a5fa' }]}>{selectedAgent.currentTool}</Text>
                  </View>
                )}
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Duur</Text>
                  <Text style={styles.detailValue}>{formatDuration(selectedAgent.timing?.elapsed || 0)}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Permission mode</Text>
                  <Text style={styles.detailValue}>{selectedAgent.metadata?.permissionMode || '-'}</Text>
                </View>

                {/* Token breakdown */}
                <Text style={styles.detailSectionTitle}>TOKEN GEBRUIK</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Input tokens</Text>
                  <Text style={styles.detailValue}>{(selectedAgent.tokenUsage?.inputTokens || 0).toLocaleString()}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Output tokens</Text>
                  <Text style={styles.detailValue}>{(selectedAgent.tokenUsage?.outputTokens || 0).toLocaleString()}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Geschatte kosten</Text>
                  <Text style={[styles.detailValue, { color: '#facc15' }]}>
                    ${(selectedAgent.tokenUsage?.estimatedCost || 0).toFixed(4)}
                  </Text>
                </View>

                {/* Last message — tap to view full history */}
                {selectedAgent.lastMessage && (
                  <TouchableOpacity
                    onPress={() => {
                      const agentId = selectedAgent.id;
                      setSelectedAgent(null);
                      setTimeout(() => {
                        router.push(`/agent-history/${encodeURIComponent(agentId)}` as any);
                      }, 300);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.detailSectionTitle}>LAATSTE BERICHT</Text>
                    <View style={styles.lastMessageContainer}>
                      <Text style={styles.lastMessageText} numberOfLines={4}>
                        {selectedAgent.lastMessage}
                      </Text>
                      <View style={styles.viewHistoryHint}>
                        <Ionicons name="chatbubbles-outline" size={14} color="#60a5fa" />
                        <Text style={styles.viewHistoryHintText}>Tik voor volledige geschiedenis</Text>
                        <Ionicons name="chevron-forward" size={14} color="#60a5fa" />
                      </View>
                    </View>
                  </TouchableOpacity>
                )}

                {/* Action buttons */}
                <View style={styles.actionButtons}>
                  {/* Open terminal button */}
                  {(selectedAgent.metadata?.projectPath || selectedAgent.project) && (
                    <TouchableOpacity
                      style={styles.terminalBtn}
                      onPress={() => openAgentTerminal(selectedAgent)}
                    >
                      <Ionicons name="terminal" size={18} color="#0a0a0a" />
                      <Text style={styles.terminalBtnText}>Terminal</Text>
                    </TouchableOpacity>
                  )}

                  {/* View history button */}
                  <TouchableOpacity
                    style={styles.historyBtn}
                    onPress={() => {
                      const agentId = selectedAgent.id;
                      setSelectedAgent(null);
                      setTimeout(() => {
                        router.push(`/agent-history/${encodeURIComponent(agentId)}` as any);
                      }, 300);
                    }}
                  >
                    <Ionicons name="chatbubbles" size={18} color="#60a5fa" />
                    <Text style={styles.historyBtnText}>Chat</Text>
                  </TouchableOpacity>

                  {/* Open project button */}
                  {(selectedAgent.metadata?.projectPath || selectedAgent.project) && (
                    <TouchableOpacity style={styles.openProjectBtn} onPress={() => { setSelectedAgent(null); openAgentProject(selectedAgent); }}>
                      <Ionicons name="code-slash" size={18} color="#0a0a0a" />
                      <Text style={styles.openProjectBtnText}>Editor</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </ScrollView>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      <FolderBrowser
        visible={browseTarget !== null}
        onClose={() => setBrowseTarget(null)}
        onSelect={(selectedPath) => {
          if (browseTarget === 'project') setAgentProject(selectedPath);
          else if (browseTarget === 'startDir') setAgentStartDir(selectedPath);
          setBrowseTarget(null);
        }}
        title={browseTarget === 'project' ? 'Kies project map' : 'Kies start locatie'}
      />

      {/* New agent modal — hidden while folder browser is open */}
      <Modal visible={showNewAgent && browseTarget === null} transparent animationType="slide" onRequestClose={() => setShowNewAgent(false)}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setShowNewAgent(false)}>
          <View style={styles.detailSheet} onStartShouldSetResponder={() => true}>
            <View style={styles.handle} />
            <Text style={styles.modalTitle}>Nieuwe Agent Starten</Text>
            <Text style={styles.formLabel}>Project pad</Text>
            <TouchableOpacity style={styles.browseInput} onPress={() => setBrowseTarget('project')}>
              <Ionicons name="folder-open" size={16} color="#facc15" />
              <Text style={agentProject ? styles.browseInputText : styles.browseInputPlaceholder} numberOfLines={1}>
                {agentProject || 'Kies een map...'}
              </Text>
              <Ionicons name="chevron-forward" size={14} color="#444" />
            </TouchableOpacity>
            <Text style={styles.formLabel}>Start locatie (optioneel)</Text>
            <TouchableOpacity style={styles.browseInput} onPress={() => setBrowseTarget('startDir')}>
              <Ionicons name="folder-open" size={16} color="#60a5fa" />
              <Text style={agentStartDir ? styles.browseInputText : styles.browseInputPlaceholder} numberOfLines={1}>
                {agentStartDir || 'Standaard: zelfde als project pad'}
              </Text>
              <Ionicons name="chevron-forward" size={14} color="#444" />
            </TouchableOpacity>
            <Text style={styles.formLabel}>Prompt (optioneel)</Text>
            <TextInput
              style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
              placeholder="Wat moet de agent doen?"
              placeholderTextColor="#555"
              value={agentPrompt}
              onChangeText={setAgentPrompt}
              multiline
              autoFocus={false}
            />
            <TouchableOpacity style={styles.launchBtn} onPress={launchAgent}>
              <Ionicons name="rocket" size={18} color="#0a0a0a" />
              <Text style={styles.launchBtnText}>Start agent sessie</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  statusBar: {
    flexDirection: 'row', alignItems: 'center', padding: 12,
    borderBottomWidth: 1, borderBottomColor: '#1a1a1a',
  },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  statusText: { color: '#aaa', fontSize: 13, flex: 1 },
  newBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a2a1a', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  newBtnText: { color: '#4ade80', fontSize: 12, fontWeight: '600', marginLeft: 4 },
  summary: {
    flexDirection: 'row', padding: 12, borderBottomWidth: 1, borderBottomColor: '#1a1a1a',
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryValue: { color: '#e0e0e0', fontSize: 18, fontWeight: '700', fontFamily: 'monospace' },
  summaryLabel: { color: '#666', fontSize: 10, marginTop: 2 },
  list: { padding: 12 },
  empty: { alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyText: { color: '#555', fontSize: 15, marginTop: 12 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  detailSheet: {
    backgroundColor: '#111', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 20, paddingBottom: 40, maxHeight: '80%',
  },
  handle: { width: 40, height: 4, backgroundColor: '#333', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  detailHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  bigDot: { width: 14, height: 14, borderRadius: 7, marginRight: 12 },
  detailName: { color: '#e0e0e0', fontSize: 16, fontWeight: '700' },
  detailStatusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  detailStatus: { fontSize: 13, fontWeight: '600', textTransform: 'capitalize' },
  liveBadge: {
    backgroundColor: '#0a2a0a', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 1, marginLeft: 8,
  },
  liveText: { color: '#4ade80', fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  detailSectionTitle: {
    color: '#555', fontSize: 10, fontWeight: '700', letterSpacing: 1.5,
    marginTop: 16, marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#1a1a1a',
  },
  detailLabel: { color: '#888', fontSize: 13 },
  detailValue: { color: '#e0e0e0', fontSize: 13, fontFamily: 'monospace', flex: 1, textAlign: 'right', marginLeft: 12 },
  lastMessageContainer: {
    backgroundColor: '#0a0a0a', borderRadius: 10, padding: 12,
    borderWidth: 1, borderColor: '#1a1a1a',
  },
  lastMessageText: {
    color: '#999', fontSize: 12, lineHeight: 18,
  },
  viewHistoryHint: {
    flexDirection: 'row', alignItems: 'center', marginTop: 10,
    paddingTop: 8, borderTopWidth: 1, borderTopColor: '#1a1a1a', gap: 6,
  },
  viewHistoryHintText: { color: '#60a5fa', fontSize: 12, flex: 1 },
  actionButtons: {
    flexDirection: 'row', gap: 8, marginTop: 16,
  },
  terminalBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#4ade80', borderRadius: 10, padding: 14,
  },
  terminalBtnText: { color: '#0a0a0a', fontWeight: '700', fontSize: 13, marginLeft: 6 },
  historyBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#0a1a2a', borderRadius: 10, padding: 14,
    borderWidth: 1, borderColor: '#1a3a5a',
  },
  historyBtnText: { color: '#60a5fa', fontWeight: '700', fontSize: 13, marginLeft: 6 },
  openProjectBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#1a1a1a', borderRadius: 10, padding: 14,
    borderWidth: 1, borderColor: '#2a2a2a',
  },
  openProjectBtnText: { color: '#e0e0e0', fontWeight: '700', fontSize: 13, marginLeft: 6 },
  modalTitle: { color: '#e0e0e0', fontSize: 18, fontWeight: '700', marginBottom: 16 },
  formLabel: { color: '#888', fontSize: 12, fontWeight: '600', marginBottom: 6, marginTop: 10 },
  input: {
    backgroundColor: '#1a1a1a', color: '#e0e0e0', borderRadius: 10, padding: 14,
    fontSize: 15, borderWidth: 1, borderColor: '#2a2a2a', marginBottom: 8,
  },
  browseInput: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a1a',
    borderRadius: 10, padding: 14, borderWidth: 1, borderColor: '#2a2a2a', marginBottom: 8, gap: 10,
  },
  browseInputText: { color: '#e0e0e0', fontSize: 14, flex: 1 },
  browseInputPlaceholder: { color: '#555', fontSize: 14, flex: 1 },
  launchBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#4ade80', borderRadius: 10, padding: 14, marginTop: 12,
  },
  launchBtnText: { color: '#0a0a0a', fontWeight: '700', fontSize: 15, marginLeft: 8 },
});
