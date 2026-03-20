import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Agent } from '../store';

const STATUS_COLORS: Record<string, string> = {
  working: '#4ade80',
  thinking: '#facc15',
  waiting: '#60a5fa',
  idle: '#6b7280',
  done: '#6b7280',
  error: '#f87171',
  help: '#c084fc',
};

const STATUS_ICONS: Record<string, string> = {
  working: 'build',
  thinking: 'bulb',
  waiting: 'hourglass',
  idle: 'ellipse',
  done: 'checkmark-circle',
  error: 'alert-circle',
  help: 'help-circle',
};

const MODEL_COLORS: Record<string, string> = {
  opus: '#c084fc',
  sonnet: '#60a5fa',
  haiku: '#4ade80',
};

interface Props {
  agent: Agent;
}

function formatDuration(ms: number) {
  if (!ms) return '0s';
  const secs = Math.floor(ms / 1000);
  if (secs < 60) return `${secs}s`;
  const mins = Math.floor(secs / 60);
  const remainSecs = secs % 60;
  if (mins < 60) return `${mins}m ${remainSecs}s`;
  const hours = Math.floor(mins / 60);
  return `${hours}h ${mins % 60}m`;
}

function formatTokens(n: number) {
  if (!n) return '0';
  if (n < 1000) return String(n);
  if (n < 1000000) return `${(n / 1000).toFixed(1)}K`;
  return `${(n / 1000000).toFixed(2)}M`;
}

function getModelShort(model: string | undefined) {
  if (!model) return null;
  if (model.includes('opus')) return 'opus';
  if (model.includes('sonnet')) return 'sonnet';
  if (model.includes('haiku')) return 'haiku';
  return null;
}

export default function AgentCard({ agent }: Props) {
  const status = (agent.status || 'idle').toLowerCase();
  const statusColor = STATUS_COLORS[status] || '#6b7280';
  const statusIcon = STATUS_ICONS[status] || 'ellipse';
  const isActive = agent.timing?.active === true;
  const totalTokens = (agent.tokenUsage?.inputTokens || 0) + (agent.tokenUsage?.outputTokens || 0);
  const cost = agent.tokenUsage?.estimatedCost || 0;
  const projectPath = agent.metadata?.projectPath || agent.project || '';
  const projectName = projectPath.split(/[\\/]/).pop() || agent.name || 'Unknown';
  const modelShort = getModelShort(agent.model);
  const modelColor = modelShort ? MODEL_COLORS[modelShort] : '#888';

  return (
    <View style={[styles.card, { borderLeftColor: statusColor, borderLeftWidth: 3 }]}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name={statusIcon as any} size={16} color={statusColor} />
        <Text style={[styles.status, { color: statusColor }]}>
          {agent.status || 'idle'}
        </Text>
        {isActive && (
          <View style={styles.activeBadge}>
            <View style={styles.activePulse} />
            <Text style={styles.activeText}>LIVE</Text>
          </View>
        )}
        <View style={styles.typeBadge}>
          <Text style={styles.typeText}>{agent.type || 'main'}</Text>
        </View>
        <Text style={styles.duration}>{formatDuration(agent.timing?.elapsed || 0)}</Text>
      </View>

      {/* Agent name + model */}
      <View style={styles.nameRow}>
        <Text style={styles.name} numberOfLines={1}>{agent.name || agent.id}</Text>
        {agent.model && (
          <View style={[styles.modelBadge, { backgroundColor: modelColor + '20', borderColor: modelColor + '40' }]}>
            <Text style={[styles.modelText, { color: modelColor }]}>{modelShort || agent.model}</Text>
          </View>
        )}
      </View>

      {/* Project */}
      <View style={styles.projectRow}>
        <Ionicons name="folder" size={13} color="#facc15" />
        <Text style={styles.projectName} numberOfLines={1}>{projectName}</Text>
        <Text style={styles.projectPath} numberOfLines={1}>{projectPath}</Text>
      </View>

      {/* Current tool */}
      {agent.currentTool && (
        <View style={styles.toolRow}>
          <Ionicons name="construct" size={12} color="#60a5fa" />
          <Text style={styles.toolText}>Tool: {agent.currentTool}</Text>
        </View>
      )}

      {/* Last message preview */}
      {agent.lastMessage && (
        <Text style={styles.lastMessage} numberOfLines={2}>
          {agent.lastMessage}
        </Text>
      )}

      {/* Token stats */}
      <View style={styles.tokenGrid}>
        <View style={styles.tokenCell}>
          <Text style={styles.tokenLabel}>Input</Text>
          <Text style={styles.tokenValue}>{formatTokens(agent.tokenUsage?.inputTokens || 0)}</Text>
        </View>
        <View style={styles.tokenCell}>
          <Text style={styles.tokenLabel}>Output</Text>
          <Text style={styles.tokenValue}>{formatTokens(agent.tokenUsage?.outputTokens || 0)}</Text>
        </View>
        <View style={styles.tokenCell}>
          <Text style={styles.tokenLabel}>Totaal</Text>
          <Text style={styles.tokenValue}>{formatTokens(totalTokens)}</Text>
        </View>
        <View style={styles.tokenCell}>
          <Text style={styles.tokenLabel}>Kosten</Text>
          <Text style={[styles.tokenValue, { color: '#facc15' }]}>${cost.toFixed(2)}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  status: {
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 6,
    textTransform: 'capitalize',
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0a2a0a',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  activePulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4ade80',
    marginRight: 4,
  },
  activeText: {
    color: '#4ade80',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  typeBadge: {
    backgroundColor: '#2a2a2a',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 'auto',
    marginRight: 8,
  },
  typeText: { color: '#888', fontSize: 10, fontWeight: '600' },
  duration: { color: '#666', fontSize: 11, fontFamily: 'monospace' },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  name: {
    color: '#e0e0e0',
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  modelBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
  },
  modelText: {
    fontSize: 10,
    fontWeight: '700',
  },
  projectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: '#151515',
    borderRadius: 6,
    padding: 8,
  },
  projectName: {
    color: '#e0e0e0',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
  projectPath: {
    color: '#555',
    fontSize: 10,
    fontFamily: 'monospace',
    marginLeft: 6,
    flex: 1,
  },
  toolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  toolText: {
    color: '#60a5fa',
    fontSize: 11,
    marginLeft: 6,
    fontFamily: 'monospace',
  },
  lastMessage: {
    color: '#777',
    fontSize: 11,
    marginBottom: 8,
    lineHeight: 16,
  },
  tokenGrid: {
    flexDirection: 'row',
    marginBottom: 0,
  },
  tokenCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    backgroundColor: '#111',
    borderRadius: 6,
    marginHorizontal: 2,
  },
  tokenLabel: {
    color: '#555',
    fontSize: 9,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tokenValue: {
    color: '#e0e0e0',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'monospace',
    marginTop: 2,
  },
});
