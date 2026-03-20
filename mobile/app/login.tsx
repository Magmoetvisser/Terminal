import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../hooks/useAuth';

export default function LoginScreen() {
  const { login } = useAuth();
  const [serverUrl, setServerUrl] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!serverUrl.trim() || !password.trim()) {
      Alert.alert('Vul beide velden in');
      return;
    }
    setLoading(true);
    try {
      await login(serverUrl.trim(), password);
      router.replace('/(tabs)/terminal' as any);
    } catch (err: any) {
      Alert.alert('Login mislukt', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.inner}>
        <Text style={styles.title}>Hussle Terminal</Text>
        <Text style={styles.subtitle}>Verbind met je server</Text>

        <TextInput
          style={styles.input}
          placeholder="Server URL (bijv. https://192.168.1.10:3443)"
          placeholderTextColor="#555"
          value={serverUrl}
          onChangeText={setServerUrl}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
        />

        <TextInput
          style={styles.input}
          placeholder="Wachtwoord"
          placeholderTextColor="#555"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          returnKeyType="go"
          onSubmitEditing={handleLogin}
        />

        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#0a0a0a" />
          ) : (
            <Text style={styles.buttonText}>Verbinden</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    color: '#e0e0e0',
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 32,
  },
  input: {
    backgroundColor: '#1a1a1a',
    color: '#e0e0e0',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  button: {
    backgroundColor: '#4ade80',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#0a0a0a',
    fontWeight: '700',
    fontSize: 16,
  },
});
