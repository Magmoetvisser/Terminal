import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { showAlert } from '../utils/alert';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApi } from '../hooks/useApi';
import { useStore, TerminalSession } from '../store';
import FolderBrowser from './FolderBrowser';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSessionCreated?: (session: any) => void;
  onSendPrompt?: (sessionId: string, prompt: string) => void;
}

type Mode = 'menu' | 'session' | 'prompt' | 'project' | 'openProject';

export default function CreateModal({ visible, onClose, onSessionCreated, onSendPrompt }: Props) {
  const { apiFetch } = useApi();
  const router = useRouter();
  const { sessions } = useStore();
  const [mode, setMode] = useState<Mode>('menu');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showFolderBrowser, setShowFolderBrowser] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState('');
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [recentProjects, setRecentProjects] = useState<string[]>([]);

  useEffect(() => {
    if (!visible) {
      setMode('menu');
      setInput('');
      setLoading(false);
      setSelectedFolder('');
      setSelectedSessionId(null);
    }
  }, [visible]);

  // Laad recente projecten (werkdirectories van sessies)
  useEffect(() => {
    if (visible) {
      const dirs = [...new Set(sessions.map(s => s.workdir).filter(Boolean))];
      setRecentProjects(dirs);
    }
  }, [visible, sessions]);

  const createSession = async () => {
    setLoading(true);
    try {
      const session = await apiFetch('/api/sessions', {
        method: 'POST',
        body: JSON.stringify({ workdir: input || undefined }),
      });
      onSessionCreated?.(session);
      onClose();
    } catch (err: any) {
      showAlert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const sendPrompt = () => {
    if (!input.trim() || !selectedSessionId) return;
    onSendPrompt?.(selectedSessionId, input.trim());
    onClose();
  };

  const createProject = async () => {
    if (!input.trim() || !selectedFolder) return;
    setLoading(true);
    try {
      const result = await apiFetch('/api/project', {
        method: 'POST',
        body: JSON.stringify({ name: input, parentDir: selectedFolder }),
      });
      onClose();
      setTimeout(() => {
        router.push(`/editor/${encodeURIComponent(result.path)}` as any);
      }, 300);
    } catch (err: any) {
      showAlert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const openProjectPath = (path: string) => {
    onClose();
    setTimeout(() => {
      router.push(`/editor/${encodeURIComponent(path)}` as any);
    }, 300);
  };

  const handleOpenProject = () => {
    setMode('openProject');
    setShowFolderBrowser(true);
  };

  const handleFolderSelect = (folderPath: string) => {
    setShowFolderBrowser(false);
    if (mode === 'project') {
      setSelectedFolder(folderPath);
    } else if (mode === 'session') {
      setInput(folderPath);
    } else {
      openProjectPath(folderPath);
    }
  };

  const activeSessions = sessions.filter(s => s.active);

  const renderMenu = () => (
    <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Aanmaken</Text>

      <TouchableOpacity style={styles.option} onPress={() => setMode('session')}>
        <Ionicons name="terminal" size={22} color="#4ade80" />
        <View style={styles.optionText}>
          <Text style={styles.optionTitle}>Nieuwe terminal sessie</Text>
          <Text style={styles.optionDesc}>Start een nieuwe PowerShell sessie</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color="#333" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.option} onPress={() => setMode('prompt')}>
        <Ionicons name="send" size={22} color="#60a5fa" />
        <View style={styles.optionText}>
          <Text style={styles.optionTitle}>Prompt sturen</Text>
          <Text style={styles.optionDesc}>Stuur een commando naar een sessie</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color="#333" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.option} onPress={() => setMode('project')}>
        <Ionicons name="add-circle" size={22} color="#facc15" />
        <View style={styles.optionText}>
          <Text style={styles.optionTitle}>Nieuw project</Text>
          <Text style={styles.optionDesc}>Maak een nieuwe projectmap aan</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color="#333" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.option} onPress={handleOpenProject}>
        <Ionicons name="folder-open" size={22} color="#c084fc" />
        <View style={styles.optionText}>
          <Text style={styles.optionTitle}>Project openen</Text>
          <Text style={styles.optionDesc}>Blader door mappen op je pc</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color="#333" />
      </TouchableOpacity>

      {/* Recente projecten / open sessie werkdirectories */}
      {recentProjects.length > 0 && (
        <>
          <Text style={styles.recentTitle}>RECENTE PROJECTEN</Text>
          {recentProjects.map((dir) => {
            const name = dir.split(/[\\/]/).pop() || dir;
            return (
              <TouchableOpacity key={dir} style={styles.recentRow} onPress={() => openProjectPath(dir)}>
                <Ionicons name="folder" size={18} color="#facc15" />
                <View style={styles.recentInfo}>
                  <Text style={styles.recentName}>{name}</Text>
                  <Text style={styles.recentPath} numberOfLines={1}>{dir}</Text>
                </View>
                <Ionicons name="open-outline" size={16} color="#555" />
              </TouchableOpacity>
            );
          })}
        </>
      )}
    </ScrollView>
  );

  const renderPromptForm = () => (
    <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
      <TouchableOpacity onPress={() => setMode('menu')}>
        <Text style={styles.back}>← Terug</Text>
      </TouchableOpacity>
      <Text style={styles.sectionTitle}>Kies een sessie</Text>
      {activeSessions.length === 0 ? (
        <Text style={styles.noSessions}>Geen actieve sessies. Start eerst een sessie.</Text>
      ) : (
        activeSessions.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[styles.sessionRow, item.id === selectedSessionId && styles.sessionRowActive]}
            onPress={() => setSelectedSessionId(item.id)}
          >
            <View style={[styles.dot, { backgroundColor: '#4ade80' }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.sessionTitle}>{item.title}</Text>
              <Text style={styles.sessionPath} numberOfLines={1}>{item.workdir}</Text>
            </View>
            {item.id === selectedSessionId && (
              <Ionicons name="checkmark-circle" size={20} color="#4ade80" />
            )}
          </TouchableOpacity>
        ))
      )}
      <TextInput
        style={[styles.input, { marginTop: 12 }]}
        placeholder="Commando..."
        placeholderTextColor="#666"
        value={input}
        onChangeText={setInput}
        autoCapitalize="none"
        autoFocus={false}
        returnKeyType="go"
        onSubmitEditing={sendPrompt}
      />
      <TouchableOpacity
        style={[styles.submit, (!input.trim() || !selectedSessionId) && styles.submitDisabled]}
        onPress={sendPrompt}
        disabled={!input.trim() || !selectedSessionId}
      >
        <Text style={styles.submitText}>Verstuur naar sessie</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderProjectForm = () => (
    <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
      <TouchableOpacity onPress={() => setMode('menu')}>
        <Text style={styles.back}>← Terug</Text>
      </TouchableOpacity>
      <Text style={styles.formLabel}>Projectnaam</Text>
      <TextInput
        style={styles.input}
        placeholder="mijn-project"
        placeholderTextColor="#666"
        value={input}
        onChangeText={setInput}
        autoFocus={false}
        autoCapitalize="none"
      />
      <Text style={styles.formLabel}>Locatie</Text>
      <TouchableOpacity style={styles.folderSelect} onPress={() => setShowFolderBrowser(true)}>
        <Ionicons name="folder" size={18} color="#facc15" />
        <Text style={styles.folderPath} numberOfLines={1}>
          {selectedFolder || 'Kies een map...'}
        </Text>
        <Ionicons name="chevron-forward" size={14} color="#444" />
      </TouchableOpacity>
      {selectedFolder && input.trim() ? (
        <Text style={styles.previewPath}>{selectedFolder}\{input.trim()}</Text>
      ) : null}
      <TouchableOpacity
        style={[styles.submit, (!input.trim() || !selectedFolder) && styles.submitDisabled]}
        onPress={createProject}
        disabled={loading || !input.trim() || !selectedFolder}
      >
        {loading ? <ActivityIndicator color="#0a0a0a" /> : <Text style={styles.submitText}>Aanmaken & openen</Text>}
      </TouchableOpacity>
    </ScrollView>
  );

  const renderSessionForm = () => (
    <View>
      <TouchableOpacity onPress={() => setMode('menu')}>
        <Text style={styles.back}>← Terug</Text>
      </TouchableOpacity>
      <Text style={styles.formLabel}>Startlocatie (optioneel)</Text>
      <TouchableOpacity style={styles.folderSelect} onPress={() => setShowFolderBrowser(true)}>
        <Ionicons name="folder-open" size={18} color="#facc15" />
        <Text style={[styles.folderPath, input ? { color: '#e0e0e0' } : {}]} numberOfLines={1}>
          {input || 'Standaard: thuismap'}
        </Text>
        <Ionicons name="chevron-forward" size={14} color="#444" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.submit} onPress={createSession} disabled={loading}>
        {loading ? <ActivityIndicator color="#0a0a0a" /> : <Text style={styles.submitText}>Start sessie</Text>}
      </TouchableOpacity>
    </View>
  );

  const mainModalVisible = visible && !showFolderBrowser;

  return (
    <>
      <Modal visible={mainModalVisible} transparent animationType="slide" onRequestClose={onClose}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}>
            <View style={styles.sheet} onStartShouldSetResponder={() => true}>
              <View style={styles.handle} />
              {mode === 'menu' && renderMenu()}
              {mode === 'session' && renderSessionForm()}
              {mode === 'prompt' && renderPromptForm()}
              {mode === 'project' && renderProjectForm()}
            </View>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>

      <FolderBrowser
        visible={showFolderBrowser}
        onClose={() => setShowFolderBrowser(false)}
        onSelect={handleFolderSelect}
        title={mode === 'project' ? 'Kies locatie voor project' : mode === 'session' ? 'Kies startlocatie' : 'Kies project map'}
      />
    </>
  );
}

const styles = StyleSheet.create({
  keyboardView: { flex: 1 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#111', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 20, paddingBottom: 40, maxHeight: '85%',
  },
  handle: { width: 40, height: 4, backgroundColor: '#333', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  title: { color: '#e0e0e0', fontSize: 18, fontWeight: '700', marginBottom: 12 },
  option: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#1a1a1a',
  },
  optionText: { marginLeft: 14, flex: 1 },
  optionTitle: { color: '#e0e0e0', fontSize: 15, fontWeight: '600' },
  optionDesc: { color: '#666', fontSize: 12, marginTop: 2 },
  recentTitle: {
    color: '#555', fontSize: 10, fontWeight: '700', letterSpacing: 1.5,
    marginTop: 18, marginBottom: 8,
  },
  recentRow: {
    flexDirection: 'row', alignItems: 'center', padding: 12,
    backgroundColor: '#1a1a1a', borderRadius: 10, marginBottom: 6,
  },
  recentInfo: { flex: 1, marginLeft: 10 },
  recentName: { color: '#e0e0e0', fontSize: 14, fontWeight: '600' },
  recentPath: { color: '#555', fontSize: 10, fontFamily: 'monospace', marginTop: 2 },
  back: { color: '#60a5fa', fontSize: 14, marginBottom: 12 },
  formHint: { color: '#666', fontSize: 12, marginBottom: 10 },
  sectionTitle: { color: '#888', fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  noSessions: { color: '#555', fontSize: 13, padding: 12, textAlign: 'center' },
  sessionRow: {
    flexDirection: 'row', alignItems: 'center', padding: 12,
    backgroundColor: '#1a1a1a', borderRadius: 10, marginBottom: 6,
  },
  sessionRowActive: { backgroundColor: '#0a1a0a', borderWidth: 1, borderColor: '#4ade80' },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 10 },
  sessionTitle: { color: '#e0e0e0', fontSize: 14, fontWeight: '600' },
  sessionPath: { color: '#555', fontSize: 11, fontFamily: 'monospace', marginTop: 2 },
  formLabel: { color: '#888', fontSize: 12, fontWeight: '600', marginBottom: 6, marginTop: 10 },
  input: {
    backgroundColor: '#1a1a1a', color: '#e0e0e0', borderRadius: 10, padding: 14,
    fontSize: 15, borderWidth: 1, borderColor: '#2a2a2a', marginBottom: 8,
  },
  folderSelect: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a1a',
    borderRadius: 10, padding: 14, borderWidth: 1, borderColor: '#2a2a2a', marginBottom: 6,
  },
  folderPath: { color: '#aaa', fontSize: 13, flex: 1, marginLeft: 10 },
  previewPath: { color: '#555', fontSize: 11, fontFamily: 'monospace', marginBottom: 12, marginLeft: 4 },
  submit: { backgroundColor: '#4ade80', borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 8 },
  submitDisabled: { opacity: 0.4 },
  submitText: { color: '#0a0a0a', fontWeight: '700', fontSize: 15 },
});
