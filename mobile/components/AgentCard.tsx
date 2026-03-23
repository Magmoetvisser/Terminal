import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Agent } from '../store';
import { colors, spacing, radius, fontSize } from '../constants/theme';
import { formatDuration, formatTokens } from '../utils/formatters';

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

function getModelShort(model: string | undefined) {
  if (!model) return null;
  if (model.includes('opus')) return 'opus';
  if (model.includes('sonnet')) return 'sonnet';
  if (model.includes('haiku')) return 'haiku';
  return null;
}

export default function AgentCard({ agent }: Props) {
  const status = (agent.status || 'idle').toLowerCase();
  const statusColor = colors.status[status] || colors.gray;
  const statusIcon = STATUS_ICONS[status] || 'ellipse';
  const isActive = agent.timing?.active === true;
  const totalTokens = (agent.tokenUsage?.inputTokens || 0) + (agent.tokenUsage?.outputTokens || 0);
  const cost = agent.tokenUsage?.estimatedCost || 0;
  const projectPath = agent.metadata?.projectPath || agent.project || '';
  const projectName = projectPath.split(/[\\/]/).pop() || agent.name || 'Unknown';
  const modelShort = getModelShort(agent.model);
  const modelColor = modelShort ? MODEL_COLORS[modelShort] : colors.textMuted;

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
        <Ionicons name="folder" size={13} color={colors.yellow} />
        <Text style={styles.projectName} numberOfLines={1}>{projectName}</Text>
        <Text style={styles.projectPath} numberOfLines={1}>{projectPath}</Text>
      </View>

      {/* Current tool */}
      {agent.currentTool && (
        <View style={styles.toolRow}>
          <Ionicons name="construct" size={12} color={colors.blue} />
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
          <Text style={[styles.tokenValue, { color: colors.yellow }]}>${cost.toFixed(2)}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.elevated,
    borderRadius: radius.md,
    padding: 14,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  status: {
    fontSize: fontSize.standard,
    fontWeight: '700',
    marginLeft: 6,
    textTransform: 'capitalize',
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0a2a0a',
    borderRadius: radius.xs,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: spacing.sm,
  },
  activePulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent,
    marginRight: spacing.xs,
  },
  activeText: {
    color: colors.accent,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  typeBadge: {
    backgroundColor: colors.borderStrong,
    borderRadius: radius.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    marginLeft: 'auto',
    marginRight: spacing.sm,
  },
  typeText: { color: colors.textMuted, fontSize: fontSize.micro, fontWeight: '600' },
  duration: { color: colors.textMuted, fontSize: fontSize.micro, fontFamily: 'monospace' },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  name: {
    color: colors.text,
    fontSize: fontSize.body,
    fontWeight: '700',
    flex: 1,
  },
  modelBadge: {
    borderRadius: radius.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderWidth: 1,
  },
  modelText: {
    fontSize: fontSize.micro,
    fontWeight: '700',
  },
  projectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    padding: spacing.sm,
  },
  projectName: {
    color: colors.text,
    fontSize: fontSize.standard,
    fontWeight: '600',
    marginLeft: 6,
  },
  projectPath: {
    color: colors.textDim,
    fontSize: fontSize.micro,
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
    color: colors.blue,
    fontSize: fontSize.micro,
    marginLeft: 6,
    fontFamily: 'monospace',
  },
  lastMessage: {
    color: colors.textMuted,
    fontSize: fontSize.micro,
    marginBottom: spacing.sm,
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
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    marginHorizontal: 2,
  },
  tokenLabel: {
    color: colors.textDim,
    fontSize: 9,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tokenValue: {
    color: colors.text,
    fontSize: fontSize.standard,
    fontWeight: '700',
    fontFamily: 'monospace',
    marginTop: 2,
  },
});
