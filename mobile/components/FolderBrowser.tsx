import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { showAlert } from '../utils/alert';
import { useApi } from '../hooks/useApi';

interface DirEntry {
  name: string;
  path: string;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelect: (path: string) => void;
  title?: string;
}

export default function FolderBrowser({ visible, onClose, onSelect, title = 'Kies een map' }: Props) {
  const { apiFetch } = useApi();
  const [currentPath, setCurrentPath] = useState('');
  const [parentPath, setParentPath] = useState<string | null>(null);
  const [dirs, setDirs] = useState<DirEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const browse = useCallback(
    async (dirPath?: string) => {
      setLoading(true);
      try {
        const query = dirPath ? `?path=${encodeURIComponent(dirPath)}` : '';
        const data = await apiFetch(`/api/files/browse${query}`);
        setCurrentPath(data.current);
        setParentPath(data.parent);
        setDirs(data.dirs);
      } catch (err: any) {
        showAlert('Error', err.message);
      } finally {
        setLoading(false);
      }
    },
    [apiFetch],
  );

  useEffect(() => {
    if (visible) browse();
  }, [visible, browse]);

  const createFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      const fullPath = currentPath + '\\' + newFolderName.trim();
      await apiFetch('/api/files/create', {
        method: 'POST',
        body: JSON.stringify({ path: fullPath, isDirectory: true }),
      });
      setShowNewFolder(false);
      setNewFolderName('');
      browse(currentPath);
    } catch (err: any) {
      showAlert('Error', err.message);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={18} color="#888" />
            </TouchableOpacity>
            <Text style={styles.title}>{title}</Text>
          </View>

          <Text style={styles.currentPath} numberOfLines={1}>{currentPath}</Text>

          {/* Navigation */}
          {parentPath && (
            <TouchableOpacity style={styles.upRow} onPress={() => browse(parentPath)}>
              <Ionicons name="arrow-up" size={16} color="#60a5fa" />
              <Text style={styles.upText}>Bovenliggende map</Text>
            </TouchableOpacity>
          )}

          {loading ? (
            <ActivityIndicator color="#4ade80" style={{ padding: 40 }} />
          ) : (
            <FlatList
              data={dirs}
              keyExtractor={(d) => d.path}
              style={styles.list}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.dirRow} onPress={() => browse(item.path)}>
                  <Ionicons name="folder" size={18} color="#facc15" />
                  <Text style={styles.dirName}>{item.name}</Text>
                  <Ionicons name="chevron-forward" size={14} color="#444" />
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyText}>Geen submappen</Text>
              }
            />
          )}

          {/* New folder */}
          {showNewFolder ? (
            <View style={styles.newFolderRow}>
              <TextInput
                style={styles.newFolderInput}
                placeholder="Mapnaam..."
                placeholderTextColor="#555"
                value={newFolderName}
                onChangeText={setNewFolderName}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={createFolder}
              />
              <TouchableOpacity style={styles.newFolderBtn} onPress={createFolder}>
                <Ionicons name="checkmark" size={20} color="#0a0a0a" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setShowNewFolder(false); setNewFolderName(''); }}>
                <Ionicons name="close" size={20} color="#888" style={{ marginLeft: 8 }} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.newFolderLink} onPress={() => setShowNewFolder(true)}>
              <Ionicons name="add" size={16} color="#60a5fa" />
              <Text style={styles.newFolderLinkText}>Nieuwe map aanmaken</Text>
            </TouchableOpacity>
          )}

          {/* Select button */}
          <TouchableOpacity style={styles.selectBtn} onPress={() => onSelect(currentPath)}>
            <Text style={styles.selectBtnText}>Selecteer deze map</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#111',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    paddingBottom: 30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  title: { color: '#e0e0e0', fontSize: 17, fontWeight: '700' },
  currentPath: { color: '#555', fontSize: 11, fontFamily: 'monospace', paddingHorizontal: 16, paddingVertical: 6 },
  upRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  upText: { color: '#60a5fa', fontSize: 14, marginLeft: 8 },
  list: { maxHeight: 300 },
  dirRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#141414',
  },
  dirName: { color: '#e0e0e0', fontSize: 14, flex: 1, marginLeft: 10 },
  emptyText: { color: '#555', textAlign: 'center', padding: 20 },
  newFolderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  newFolderInput: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    color: '#e0e0e0',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  newFolderBtn: {
    backgroundColor: '#4ade80',
    borderRadius: 8,
    padding: 10,
    marginLeft: 8,
  },
  newFolderLink: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  newFolderLinkText: { color: '#60a5fa', fontSize: 13, marginLeft: 6 },
  selectBtn: {
    backgroundColor: '#4ade80',
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 16,
    marginTop: 8,
    alignItems: 'center',
  },
  selectBtnText: { color: '#0a0a0a', fontWeight: '700', fontSize: 15 },
});
