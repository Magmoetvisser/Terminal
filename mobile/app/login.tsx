import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { showAlert } from '../utils/alert';
import { router } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { colors, spacing, radius, fontSize } from '../constants/theme';

export default function LoginScreen() {
  const { login } = useAuth();
  const [serverUrl, setServerUrl] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!serverUrl.trim() || !password.trim()) {
      showAlert('Vul beide velden in');
      return;
    }
    setLoading(true);
    try {
      await login(serverUrl.trim(), password);
      router.replace('/(tabs)/terminal' as any);
    } catch (err: any) {
      showAlert('Login mislukt', err.message);
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
          placeholder="Server URL (bijv. http://192.168.1.10:3443)"
          placeholderTextColor={colors.textDim}
          value={serverUrl}
          onChangeText={setServerUrl}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
        />

        <TextInput
          style={styles.input}
          placeholder="Wachtwoord"
          placeholderTextColor={colors.textDim}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          returnKeyType="go"
          onSubmitEditing={handleLogin}
        />

        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
          {loading ? (
            <ActivityIndicator color={colors.bg} />
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
    backgroundColor: colors.bg,
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    color: colors.text,
    fontSize: fontSize.title,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: fontSize.standard,
    textAlign: 'center',
    marginBottom: 32,
  },
  input: {
    backgroundColor: colors.elevated,
    color: colors.text,
    borderRadius: radius.md,
    padding: 14,
    fontSize: fontSize.body,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  button: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    padding: 14,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  buttonText: {
    color: colors.bg,
    fontWeight: '700',
    fontSize: fontSize.body,
  },
});
