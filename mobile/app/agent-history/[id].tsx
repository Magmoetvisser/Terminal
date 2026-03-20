import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useApi } from '../../hooks/useApi';

interface HistoryMessage {
  role: 'user' | 'assistant';
  text: string;
  tools?: string[];
  model?: string;
  ts?: string;
}

const TOOL_ICONS: Record<string, string> = {
  Bash: 'terminal',
  Read: 'document-text',
  Write: 'create',
  Edit: 'pencil',
  Grep: 'search',
  Glob: 'folder-open',
  Agent: 'people',
  WebFetch: 'globe',
  WebSearch: 'search-circle',
};

export default function AgentHistoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { apiFetch } = useApi();
  const listRef = useRef<FlatList>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['agent-history', id],
    queryFn: () => apiFetch(`/api/agents/${id}/history`),
    enabled: !!id,
  });

  const messages: HistoryMessage[] = data?.messages || [];
  const agent = data?.agent;
  const agentName = agent?.displayName || agent?.name || id?.slice(0, 12);

  // Auto-scroll to bottom on load
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        listRef.current?.scrollToEnd({ animated: false });
      }, 200);
    }
  }, [messages.length]);

  const renderMessage = ({ item, index }: { item: HistoryMessage; index: number }) => {
    const isUser = item.role === 'user';

    return (
      <View style={[styles.msgRow, isUser ? styles.userRow : styles.assistantRow]}>
        {/* Avatar */}
        <View style={[styles.avatar, isUser ? styles.userAvatar : styles.assistantAvatar]}>
          <Ionicons
            name={isUser ? 'person' : 'sparkles'}
            size={14}
            color={isUser ? '#0a0a0a' : '#0a0a0a'}
          />
        </View>

        <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
          {/* Tool badges */}
          {item.tools && item.tools.length > 0 && (
            <View style={styles.toolRow}>
              {item.tools.map((tool, i) => (
                <View key={i} style={styles.toolBadge}>
                  <Ionicons
                    name={(TOOL_ICONS[tool] || 'code-slash') as any}
                    size={10}
                    color="#60a5fa"
                  />
                  <Text style={styles.toolName}>{tool}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Message text */}
          <Text style={[styles.msgText, isUser && styles.userText]} selectable>
            {item.text || (item.tools?.length ? `Used ${item.tools.join(', ')}` : '...')}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: agentName || 'Geschiedenis',
          headerStyle: { backgroundColor: '#0a0a0a' },
          headerTintColor: '#e0e0e0',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 10 }}>
              <Ionicons name="arrow-back" size={22} color="#e0e0e0" />
            </TouchableOpacity>
          ),
          animation: 'slide_from_right',
        }}
      />

      <View style={styles.container}>
        {/* Agent info header */}
        {agent && (
          <View style={styles.agentHeader}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor(agent.state || agent.status) }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.agentName}>{agentName}</Text>
              <Text style={styles.agentMeta}>
                {agent.model} · {data?.totalMessages || 0} berichten
              </Text>
            </View>
            <View style={styles.costBadge}>
              <Text style={styles.costText}>
                ${(agent.tokenUsage?.estimatedCost || agent.sessionStats?.estimatedCost || 0).toFixed(2)}
              </Text>
            </View>
          </View>
        )}

        {/* Messages */}
        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator color="#4ade80" size="large" />
            <Text style={styles.loadingText}>Geschiedenis laden...</Text>
          </View>
        ) : error ? (
          <View style={styles.center}>
            <Ionicons name="alert-circle" size={48} color="#f87171" />
            <Text style={styles.errorText}>Kon geschiedenis niet laden</Text>
          </View>
        ) : messages.length === 0 ? (
          <View style={styles.center}>
            <Ionicons name="chatbubbles-outline" size={48} color="#333" />
            <Text style={styles.emptyText}>Geen berichten gevonden</Text>
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(_, i) => String(i)}
            renderItem={renderMessage}
            contentContainerStyle={styles.list}
            initialNumToRender={30}
            maxToRenderPerBatch={20}
          />
        )}
      </View>
    </>
  );
}

function getStatusColor(status: string) {
  const s = (status || 'idle').toLowerCase();
  const map: Record<string, string> = {
    working: '#4ade80', thinking: '#facc15', waiting: '#60a5fa',
    idle: '#6b7280', done: '#6b7280', error: '#f87171', help: '#c084fc',
  };
  return map[s] || '#6b7280';
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  agentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#111',
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  agentName: { color: '#e0e0e0', fontSize: 15, fontWeight: '700' },
  agentMeta: { color: '#666', fontSize: 11, marginTop: 2 },
  costBadge: {
    backgroundColor: '#1a1a0a',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  costText: { color: '#facc15', fontSize: 13, fontWeight: '700', fontFamily: 'monospace' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  loadingText: { color: '#666', marginTop: 12 },
  errorText: { color: '#f87171', marginTop: 12 },
  emptyText: { color: '#555', marginTop: 12 },
  list: { padding: 12, paddingBottom: 40 },
  msgRow: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  userRow: { flexDirection: 'row-reverse' },
  assistantRow: {},
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 6,
    marginTop: 2,
  },
  userAvatar: { backgroundColor: '#60a5fa' },
  assistantAvatar: { backgroundColor: '#4ade80' },
  bubble: {
    maxWidth: '80%',
    borderRadius: 14,
    padding: 12,
  },
  userBubble: {
    backgroundColor: '#1a2a3a',
    borderTopRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  toolRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 6,
    gap: 4,
  },
  toolBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0a1a2a',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 3,
  },
  toolName: { color: '#60a5fa', fontSize: 9, fontWeight: '600' },
  msgText: {
    color: '#ccc',
    fontSize: 13,
    lineHeight: 19,
  },
  userText: {
    color: '#e0e0e0',
  },
});
