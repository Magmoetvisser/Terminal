import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
  currentPath?: string;
  onNavigateUp?: () => void;
}

const ICON_MAP: Record<string, { name: string; color: string }> = {
  '.js': { name: 'logo-javascript', color: '#f7df1e' },
  '.jsx': { name: 'logo-javascript', color: '#f7df1e' },
  '.ts': { name: 'logo-javascript', color: '#3178c6' },
  '.tsx': { name: 'logo-javascript', color: '#3178c6' },
  '.py': { name: 'logo-python', color: '#3776ab' },
  '.json': { name: 'code-slash', color: '#facc15' },
  '.md': { name: 'document-text', color: '#60a5fa' },
  '.html': { name: 'logo-html5', color: '#e34f26' },
  '.css': { name: 'logo-css3', color: '#1572b6' },
  '.git': { name: 'git-branch', color: '#f05032' },
};

function getFileIcon(item: FileItem) {
  if (item.isDirectory) {
    return { name: 'folder' as const, color: '#facc15' };
  }
  const ext = '.' + item.name.split('.').pop()?.toLowerCase();
  return ICON_MAP[ext] || { name: 'document' as const, color: '#888' };
}

function formatSize(bytes: number) {
  if (bytes === 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

export default function FileTree({ items, loading, onPress, onLongPress, currentPath, onNavigateUp }: Props) {
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#4ade80" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {currentPath && onNavigateUp && (
        <TouchableOpacity style={styles.upRow} onPress={onNavigateUp}>
          <Ionicons name="arrow-up" size={16} color="#60a5fa" />
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
              {item.isDirectory && (
                <Ionicons name="chevron-forward" size={14} color="#444" />
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
    padding: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
    backgroundColor: '#0f0f0f',
  },
  upText: {
    color: '#60a5fa',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  pathText: {
    color: '#555',
    fontSize: 11,
    marginLeft: 8,
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#141414',
  },
  icon: { marginRight: 10, width: 20, textAlign: 'center' },
  name: { color: '#e0e0e0', fontSize: 14, flex: 1 },
  size: { color: '#555', fontSize: 11, fontFamily: 'monospace' },
  emptyText: { color: '#555', fontSize: 14 },
});
