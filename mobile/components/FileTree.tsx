import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, fontSize } from '../constants/theme';

export interface FileItem {
  name: string;
  path: string;
  isDirectory: boolean;
  size: number;
  modified: string;
}

interface Props {
  items: FileItem[];
  loading?: boolean;
  onPress: (item: FileItem) => void;
  onLongPress?: (item: FileItem) => void;
  onMenuPress?: (item: FileItem) => void;
  currentPath?: string;
  onNavigateUp?: () => void;
}

const ICON_MAP: Record<string, { name: string; color: string }> = {
  '.js': { name: 'logo-javascript', color: '#f7df1e' },
  '.jsx': { name: 'logo-javascript', color: '#f7df1e' },
  '.ts': { name: 'logo-javascript', color: '#3178c6' },
  '.tsx': { name: 'logo-javascript', color: '#3178c6' },
  '.py': { name: 'logo-python', color: '#3776ab' },
  '.json': { name: 'code-slash', color: colors.yellow },
  '.md': { name: 'document-text', color: colors.blue },
  '.html': { name: 'logo-html5', color: '#e34f26' },
  '.css': { name: 'logo-css3', color: '#1572b6' },
  '.git': { name: 'git-branch', color: '#f05032' },
};

function getFileIcon(item: FileItem) {
  if (item.isDirectory) {
    return { name: 'folder' as const, color: colors.yellow };
  }
  const ext = '.' + item.name.split('.').pop()?.toLowerCase();
  return ICON_MAP[ext] || { name: 'document' as const, color: colors.textMuted };
}

function formatSize(bytes: number) {
  if (bytes === 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

export default function FileTree({ items, loading, onPress, onLongPress, onMenuPress, currentPath, onNavigateUp }: Props) {
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {currentPath && onNavigateUp && (
        <TouchableOpacity style={styles.upRow} onPress={onNavigateUp}>
          <Ionicons name="arrow-up" size={16} color={colors.blue} />
          <Text style={styles.upText}>..</Text>
          <Text style={styles.pathText} numberOfLines={1}>{currentPath}</Text>
        </TouchableOpacity>
      )}
      <FlatList
        data={items}
        keyExtractor={(item) => item.path}
        renderItem={({ item }) => {
          const icon = getFileIcon(item);
          return (
            <TouchableOpacity
              style={styles.row}
              onPress={() => onPress(item)}
              onLongPress={() => onLongPress?.(item)}
            >
              <Ionicons name={icon.name as any} size={18} color={icon.color} style={styles.icon} />
              <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
              {!item.isDirectory && (
                <Text style={styles.size}>{formatSize(item.size)}</Text>
              )}
              {onMenuPress && (
                <TouchableOpacity
                  onPress={(e) => { e.stopPropagation(); onMenuPress(item); }}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  style={styles.menuBtn}
                >
                  <Ionicons name="ellipsis-vertical" size={16} color={colors.textMuted} />
                </TouchableOpacity>
              )}
              {item.isDirectory && !onMenuPress && (
                <Ionicons name="chevron-forward" size={14} color={colors.textDim} />
              )}
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyText}>Lege map</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  upRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  upText: {
    color: colors.blue,
    fontSize: fontSize.standard,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
  pathText: {
    color: colors.textDim,
    fontSize: fontSize.micro,
    marginLeft: spacing.sm,
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  icon: { marginRight: spacing.md, width: 20, textAlign: 'center' },
  name: { color: colors.text, fontSize: fontSize.standard, flex: 1 },
  size: { color: colors.textDim, fontSize: fontSize.micro, fontFamily: 'monospace' },
  emptyText: { color: colors.textDim, fontSize: fontSize.standard },
  menuBtn: { paddingLeft: spacing.sm },
});
