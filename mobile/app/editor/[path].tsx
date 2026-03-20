import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import FileTree, { FileItem } from '../../components/FileTree';
import CodeEditor from '../../components/CodeEditor';
import EditorTerminal from '../../components/EditorTerminal';
import { useApi } from '../../hooks/useApi';

type ViewMode = 'tree' | 'editor';

export default function EditorScreen() {
  const { path: encodedPath } = useLocalSearchParams<{ path: string }>();
  const projectPath = decodeURIComponent(encodedPath || '');
  const router = useRouter();
  const { apiFetch } = useApi();

  const [mode, setMode] = useState<ViewMode>('tree');
  const [currentDir, setCurrentDir] = useState(projectPath);
  const [items, setItems] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Editor state
  const [openFile, setOpenFile] = useState<{ path: string; name: string; language: string } | null>(null);
  const [fileContent, setFileContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [saving, setSaving] = useState(false);

  // Terminal panel
  const [showTerminal, setShowTerminal] = useState(false);

  // Create dialog
  const [showCreate, setShowCreate] = useState(false);
  const [createType, setCreateType] = useState<'file' | 'folder'>('file');
  const [createName, setCreateName] = useState('');

  const loadDir = useCallback(
    async (dirPath: string) => {
      setLoading(true);
      try {
        const data = await apiFetch(`/api/files/list?path=${encodeURIComponent(dirPath)}`);
        setItems(data.items || []);
        setCurrentDir(data.path);
      } catch (err: any) {
        Alert.alert('Error', err.message);
      } finally {
        setLoading(false);
      }
    },
    [apiFetch],
  );

  useEffect(() => {
    if (projectPath) loadDir(projectPath);
  }, [projectPath]);

  const openFileForEdit = async (item: FileItem) => {
    try {
      const data = await apiFetch(`/api/files/read?path=${encodeURIComponent(item.path)}`);
      if (data.binary) {
        Alert.alert('Binair bestand', 'Dit bestand kan niet bewerkt worden.');
        return;
      }
      setOpenFile({ path: item.path, name: data.name, language: data.language });
      setFileContent(data.content);
      setOriginalContent(data.content);
      setMode('editor');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  const handlePress = (item: FileItem) => {
    if (item.isDirectory) {
      loadDir(item.path);
    } else {
      openFileForEdit(item);
    }
  };

  const handleLongPress = (item: FileItem) => {
    Alert.alert(
      item.name,
      item.path,
      [
        {
          text: 'Verwijderen',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Weet je het zeker?', `${item.name} verwijderen?`, [
              { text: 'Annuleer', style: 'cancel' },
              {
                text: 'Verwijder',
                style: 'destructive',
                onPress: async () => {
                  try {
                    await apiFetch(`/api/files?path=${encodeURIComponent(item.path)}`, { method: 'DELETE' });
                    loadDir(currentDir);
                  } catch (err: any) {
                    Alert.alert('Error', err.message);
                  }
                },
              },
            ]);
          },
        },
        { text: 'Annuleer', style: 'cancel' },
      ],
    );
  };

  const navigateUp = () => {
    const parent = currentDir.replace(/[\\/][^\\/]+$/, '');
    if (parent && parent !== currentDir) {
      loadDir(parent);
    }
  };

  const saveFile = async () => {
    if (!openFile) return;
    setSaving(true);
    try {
      await apiFetch('/api/files/write', {
        method: 'POST',
        body: JSON.stringify({ path: openFile.path, content: fileContent }),
      });
      setOriginalContent(fileContent);
      Alert.alert('Opgeslagen');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  const closeEditor = () => {
    if (fileContent !== originalContent) {
      Alert.alert('Niet-opgeslagen wijzigingen', 'Wil je opslaan?', [
        { text: 'Verwerp', style: 'destructive', onPress: () => { setMode('tree'); setOpenFile(null); } },
        { text: 'Opslaan', onPress: async () => { await saveFile(); setMode('tree'); setOpenFile(null); } },
        { text: 'Annuleer', style: 'cancel' },
      ]);
    } else {
      setMode('tree');
      setOpenFile(null);
    }
  };

  const handleCreate = async () => {
    if (!createName.trim()) return;
    const fullPath = currentDir + '\\' + createName.trim();
    try {
      await apiFetch('/api/files/create', {
        method: 'POST',
        body: JSON.stringify({ path: fullPath, isDirectory: createType === 'folder' }),
      });
      setShowCreate(false);
      setCreateName('');
      loadDir(currentDir);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  const hasChanges = fileContent !== originalContent;
  const projectName = projectPath.split(/[\\/]/).pop() || 'Project';

  return (
    <>
      <Stack.Screen
        options={{
          title: mode === 'editor' ? (openFile?.name || 'Editor') : projectName,
          headerStyle: { backgroundColor: '#0a0a0a' },
          headerTintColor: '#e0e0e0',
          headerLeft: () => (
            <TouchableOpacity onPress={mode === 'editor' ? closeEditor : () => router.back()} style={{ marginRight: 10 }}>
              <Ionicons name={mode === 'editor' ? 'arrow-back' : 'close'} size={22} color="#e0e0e0" />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <View style={{ flexDirection: 'row', gap: 12 }}>
              {mode === 'editor' && (
                <TouchableOpacity onPress={saveFile} disabled={saving || !hasChanges}>
                  <Ionicons
                    name="save"
                    size={22}
                    color={hasChanges ? '#4ade80' : '#444'}
                  />
                </TouchableOpacity>
              )}
              {mode === 'tree' && (
                <>
                  <TouchableOpacity onPress={() => { setCreateType('file'); setShowCreate(true); }}>
                    <Ionicons name="add-circle-outline" size={22} color="#60a5fa" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => { setCreateType('folder'); setShowCreate(true); }}>
                    <Ionicons name="folder-open-outline" size={22} color="#facc15" />
                  </TouchableOpacity>
                </>
              )}
            </View>
          ),
        }}
      />

      <View style={styles.container}>
        {mode === 'tree' ? (
          <FileTree
            items={items}
            loading={loading}
            onPress={handlePress}
            onLongPress={handleLongPress}
            currentPath={currentDir !== projectPath ? currentDir : undefined}
            onNavigateUp={currentDir !== projectPath ? navigateUp : undefined}
          />
        ) : (
          <>
            {openFile && (
              <View style={styles.editorHeader}>
                <View style={[styles.dot, { backgroundColor: hasChanges ? '#facc15' : '#4ade80' }]} />
                <Text style={styles.fileName}>{openFile.name}</Text>
                <Text style={styles.fileLang}>{openFile.language}</Text>
              </View>
            )}
            <CodeEditor
              content={fileContent}
              language={openFile?.language || 'plaintext'}
              onChange={setFileContent}
            />
          </>
        )}
      </View>

      {/* Floating terminal panel */}
      <EditorTerminal
        projectPath={projectPath}
        visible={showTerminal}
        onClose={() => setShowTerminal(false)}
      />

      {/* Terminal FAB */}
      {!showTerminal && (
        <TouchableOpacity
          style={styles.terminalFab}
          onPress={() => setShowTerminal(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="terminal" size={24} color="#0a0a0a" />
        </TouchableOpacity>
      )}

      {/* Create dialog */}
      <Modal visible={showCreate} transparent animationType="fade" onRequestClose={() => setShowCreate(false)}>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setShowCreate(false)}>
          <View style={styles.dialog} onStartShouldSetResponder={() => true}>
            <Text style={styles.dialogTitle}>
              {createType === 'file' ? 'Nieuw bestand' : 'Nieuwe map'}
            </Text>
            <TextInput
              style={styles.dialogInput}
              placeholder={createType === 'file' ? 'bestandsnaam.txt' : 'mapnaam'}
              placeholderTextColor="#555"
              value={createName}
              onChangeText={setCreateName}
              autoFocus
              autoCapitalize="none"
              returnKeyType="done"
              onSubmitEditing={handleCreate}
            />
            <View style={styles.dialogButtons}>
              <TouchableOpacity style={styles.dialogCancel} onPress={() => { setShowCreate(false); setCreateName(''); }}>
                <Text style={styles.dialogCancelText}>Annuleer</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.dialogConfirm} onPress={handleCreate}>
                <Text style={styles.dialogConfirmText}>Aanmaken</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  editorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#111',
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  fileName: { color: '#e0e0e0', fontSize: 13, fontWeight: '600', flex: 1 },
  fileLang: { color: '#555', fontSize: 11 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialog: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    width: '85%',
  },
  dialogTitle: { color: '#e0e0e0', fontSize: 16, fontWeight: '700', marginBottom: 14 },
  dialogInput: {
    backgroundColor: '#0a0a0a',
    color: '#e0e0e0',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    marginBottom: 14,
  },
  dialogButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  dialogCancel: { padding: 10 },
  dialogCancelText: { color: '#888', fontSize: 14 },
  dialogConfirm: { backgroundColor: '#4ade80', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10 },
  dialogConfirmText: { color: '#0a0a0a', fontWeight: '700', fontSize: 14 },
  terminalFab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#4ade80',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4ade80',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
});
