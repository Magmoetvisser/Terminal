import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useStore } from '../../store';
import { useApi } from '../../hooks/useApi';
import { colors, spacing, radius, fontSize as fs } from '../../constants/theme';

interface GitFile {
  status: string;
  file: string;
  type: 'modified' | 'added' | 'deleted' | 'untracked' | 'renamed';
}

interface GitCommit {
  hash: string;
  author: string;
  message: string;
  time: string;
}

const STATUS_CONFIG: Record<string, { color: string; icon: string; label: string }> = {
  modified:  { color: '#facc15', icon: 'create-outline',   label: 'Gewijzigd' },
  added:     { color: '#4ade80', icon: 'add-circle-outline', label: 'Nieuw' },
  deleted:   { color: '#f87171', icon: 'remove-circle-outline', label: 'Verwijderd' },
  untracked: { color: '#60a5fa', icon: 'help-circle-outline', label: 'Untracked' },
  renamed:   { color: '#c084fc', icon: 'swap-horizontal-outline', label: 'Hernoemd' },
};

function parseDiffLines(diff: string) {
  return diff.split('\n').map((line, i) => {
    let type: 'add' | 'del' | 'hunk' | 'normal' = 'normal';
    if (line.startsWith('+') && !line.startsWith('+++')) type = 'add';
    else if (line.startsWith('-') && !line.startsWith('---')) type = 'del';
    else if (line.startsWith('@@')) type = 'hunk';
    return { text: line, type, key: i };
  });
}

export default function ChangesScreen() {
  const { accentColor, editorProjectPath } = useStore();
  const { apiFetch } = useApi();
  const [expandedFile, setExpandedFile] = useState<string | null>(null);
  const [fileDiff, setFileDiff] = useState<string | null>(null);
  const [loadingDiff, setLoadingDiff] = useState(false);

  const projectPath = editorProjectPath || '';

  const { data: statusData, isLoading: statusLoading, refetch: refetchStatus } = useQuery<{ files: GitFile[]; cwd: string }>({
    queryKey: ['git-status', projectPath],
    queryFn: () => apiFetch(`/api/git/status?path=${encodeURIComponent(projectPath)}`),
    enabled: !!projectPath,
    refetchInterval: 10000,
  });

  const { data: logData } = useQuery<{ commits: GitCommit[] }>({
    queryKey: ['git-log', projectPath],
    queryFn: () => apiFetch(`/api/git/log?path=${encodeURIComponent(projectPath)}&n=1`),
    enabled: !!projectPath,
  });

  const files = statusData?.files || [];
  const lastCommit = logData?.commits?.[0];

  const grouped = {
    modified: files.filter(f => f.type === 'modified'),
    added: files.filter(f => f.type === 'added'),
    deleted: files.filter(f => f.type === 'deleted'),
    untracked: files.filter(f => f.type === 'untracked'),
    renamed: files.filter(f => f.type === 'renamed'),
  };

  const toggleFile = useCallback(async (file: string) => {
    if (expandedFile === file) {
      setExpandedFile(null);
      setFileDiff(null);
      return;
    }
    setExpandedFile(file);
    setFileDiff(null);
    setLoadingDiff(true);
    try {
      const data = await apiFetch(
        `/api/git/diff?path=${encodeURIComponent(projectPath)}&file=${encodeURIComponent(file)}`
      );
      if (!data.diff) {
        // Try staged diff
        const staged = await apiFetch(
          `/api/git/diff-staged?path=${encodeURIComponent(projectPath)}&file=${encodeURIComponent(file)}`
        );
        setFileDiff(staged.diff || '(geen diff beschikbaar)');
      } else {
        setFileDiff(data.diff);
      }
    } catch {
      setFileDiff('(fout bij laden diff)');
    } finally {
      setLoadingDiff(false);
    }
  }, [expandedFile, projectPath, apiFetch]);

  const onRefresh = useCallback(() => {
    refetchStatus();
  }, [refetchStatus]);

  // No project selected
  if (!projectPath) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="folder-open-outline" size={48} color={colors.textDim} />
        <Text style={styles.emptyTitle}>Geen project geopend</Text>
        <Text style={styles.emptySubtitle}>
          Open een project in de Editor tab om hier de git changes te zien
        </Text>
      </View>
    );
  }

  const totalChanges = files.length;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={statusLoading}
          onRefresh={onRefresh}
          tintColor={accentColor}
        />
      }
    >
      {/* Last commit card */}
      {lastCommit && (
        <View style={styles.commitCard}>
          <View style={styles.commitHeader}>
            <Ionicons name="git-commit-outline" size={16} color={accentColor} />
            <Text style={styles.commitLabel}>Laatste commit</Text>
            <Text style={styles.commitTime}>{lastCommit.time}</Text>
          </View>
          <Text style={styles.commitMessage} numberOfLines={2}>{lastCommit.message}</Text>
          <View style={styles.commitMeta}>
            <Ionicons name="person-outline" size={12} color={colors.textMuted} />
            <Text style={styles.commitAuthor}>{lastCommit.author}</Text>
            <Text style={styles.commitHash}>{lastCommit.hash.substring(0, 7)}</Text>
          </View>
        </View>
      )}

      {/* Summary bar */}
      <View style={styles.summaryBar}>
        <Text style={styles.summaryTitle}>
          {totalChanges === 0 ? 'Geen wijzigingen' : `${totalChanges} ${totalChanges === 1 ? 'wijziging' : 'wijzigingen'}`}
        </Text>
        {totalChanges > 0 && (
          <View style={styles.summaryBadges}>
            {grouped.modified.length > 0 && (
              <View style={[styles.badge, { backgroundColor: '#facc1520' }]}>
                <Text style={[styles.badgeText, { color: '#facc15' }]}>~{grouped.modified.length}</Text>
              </View>
            )}
            {grouped.added.length > 0 && (
              <View style={[styles.badge, { backgroundColor: '#4ade8020' }]}>
                <Text style={[styles.badgeText, { color: '#4ade80' }]}>+{grouped.added.length}</Text>
              </View>
            )}
            {grouped.deleted.length > 0 && (
              <View style={[styles.badge, { backgroundColor: '#f8717120' }]}>
                <Text style={[styles.badgeText, { color: '#f87171' }]}>-{grouped.deleted.length}</Text>
              </View>
            )}
            {grouped.untracked.length > 0 && (
              <View style={[styles.badge, { backgroundColor: '#60a5fa20' }]}>
                <Text style={[styles.badgeText, { color: '#60a5fa' }]}>?{grouped.untracked.length}</Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Clean state */}
      {totalChanges === 0 && !statusLoading && (
        <View style={styles.cleanState}>
          <Ionicons name="checkmark-circle" size={40} color={accentColor} />
          <Text style={styles.cleanText}>Working tree is clean</Text>
          <Text style={styles.cleanSubtext}>Alles is gecommit</Text>
        </View>
      )}

      {/* File groups */}
      {Object.entries(grouped).map(([type, groupFiles]) => {
        if (groupFiles.length === 0) return null;
        const config = STATUS_CONFIG[type];
        return (
          <View key={type} style={styles.group}>
            <View style={styles.groupHeader}>
              <Ionicons name={config.icon as any} size={14} color={config.color} />
              <Text style={[styles.groupTitle, { color: config.color }]}>{config.label}</Text>
              <View style={[styles.groupCount, { backgroundColor: config.color + '20' }]}>
                <Text style={[styles.groupCountText, { color: config.color }]}>{groupFiles.length}</Text>
              </View>
            </View>

            {groupFiles.map((f) => {
              const isExpanded = expandedFile === f.file;
              const fileName = f.file.split('/').pop() || f.file;
              const dirPath = f.file.includes('/') ? f.file.substring(0, f.file.lastIndexOf('/')) : '';

              return (
                <View key={f.file}>
                  <TouchableOpacity
                    style={[styles.fileRow, isExpanded && styles.fileRowExpanded]}
                    onPress={() => toggleFile(f.file)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.statusDot, { backgroundColor: config.color }]} />
                    <View style={styles.fileInfo}>
                      <Text style={styles.fileName} numberOfLines={1}>{fileName}</Text>
                      {dirPath ? <Text style={styles.filePath} numberOfLines={1}>{dirPath}/</Text> : null}
                    </View>
                    <View style={[styles.statusBadge, { borderColor: config.color + '40' }]}>
                      <Text style={[styles.statusBadgeText, { color: config.color }]}>{f.status}</Text>
                    </View>
                    <Ionicons
                      name={isExpanded ? 'chevron-up' : 'chevron-down'}
                      size={16}
                      color={colors.textDim}
                    />
                  </TouchableOpacity>

                  {isExpanded && (
                    <View style={styles.diffContainer}>
                      {loadingDiff ? (
                        <ActivityIndicator color={accentColor} style={{ padding: 16 }} />
                      ) : fileDiff ? (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                          <View style={styles.diffInner}>
                            {parseDiffLines(fileDiff).map((line) => (
                              <View
                                key={line.key}
                                style={[
                                  styles.diffLine,
                                  line.type === 'add' && styles.diffLineAdd,
                                  line.type === 'del' && styles.diffLineDel,
                                  line.type === 'hunk' && styles.diffLineHunk,
                                ]}
                              >
                                <Text style={styles.diffLineText}>{line.text}</Text>
                              </View>
                            ))}
                          </View>
                        </ScrollView>
                      ) : (
                        <Text style={styles.diffEmpty}>Geen diff beschikbaar (nieuw bestand?)</Text>
                      )}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        );
      })}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    paddingBottom: 20,
  },
  // Empty state
  emptyContainer: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: fs.header,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtitle: {
    color: colors.textMuted,
    fontSize: fs.standard,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  // Last commit
  commitCard: {
    margin: spacing.lg,
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  commitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  commitLabel: {
    color: colors.textMuted,
    fontSize: fs.caption,
    fontWeight: '600',
    flex: 1,
  },
  commitTime: {
    color: colors.textDim,
    fontSize: fs.caption,
  },
  commitMessage: {
    color: colors.text,
    fontSize: fs.standard,
    fontWeight: '500',
    lineHeight: 20,
    marginBottom: 6,
  },
  commitMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  commitAuthor: {
    color: colors.textMuted,
    fontSize: fs.caption,
    flex: 1,
  },
  commitHash: {
    color: colors.textDim,
    fontSize: fs.caption,
    fontFamily: 'monospace',
  },
  // Summary
  summaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  summaryTitle: {
    color: colors.text,
    fontSize: fs.body,
    fontWeight: '600',
  },
  summaryBadges: {
    flexDirection: 'row',
    gap: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: fs.caption,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  // Clean state
  cleanState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  cleanText: {
    color: colors.text,
    fontSize: fs.body,
    fontWeight: '600',
    marginTop: 12,
  },
  cleanSubtext: {
    color: colors.textMuted,
    fontSize: fs.caption,
    marginTop: 4,
  },
  // Groups
  group: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  groupTitle: {
    fontSize: fs.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    flex: 1,
  },
  groupCount: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  groupCountText: {
    fontSize: fs.micro,
    fontWeight: '700',
  },
  // File rows
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radius.sm,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  fileRowExpanded: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    marginBottom: 0,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    color: colors.text,
    fontSize: fs.standard,
    fontWeight: '500',
  },
  filePath: {
    color: colors.textDim,
    fontSize: fs.micro,
    marginTop: 1,
  },
  statusBadge: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  statusBadgeText: {
    fontSize: fs.micro,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  // Diff
  diffContainer: {
    backgroundColor: '#0d0d0d',
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: colors.border,
    borderBottomLeftRadius: radius.sm,
    borderBottomRightRadius: radius.sm,
    marginBottom: 4,
    maxHeight: 300,
    overflow: 'hidden',
  },
  diffInner: {
    padding: 4,
  },
  diffLine: {
    paddingHorizontal: 8,
    paddingVertical: 1,
  },
  diffLineAdd: {
    backgroundColor: '#4ade8012',
  },
  diffLineDel: {
    backgroundColor: '#f8717112',
  },
  diffLineHunk: {
    backgroundColor: '#a78bfa10',
  },
  diffLineText: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: '#ccc',
    lineHeight: 16,
  },
  diffEmpty: {
    color: colors.textMuted,
    fontSize: fs.caption,
    padding: 16,
    textAlign: 'center',
  },
});
