import { useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import { useStore } from '../store';

const TOKEN_KEY = 'hussle_jwt';
const URL_KEY = 'hussle_server_url';

export function useAuth() {
  const { serverUrl, token, setToken, setServerUrl } = useStore();

  const loadStored = useCallback(async () => {
    const [storedToken, storedUrl] = await Promise.all([
      SecureStore.getItemAsync(TOKEN_KEY),
      SecureStore.getItemAsync(URL_KEY),
    ]);
    if (storedToken) setToken(storedToken);
    if (storedUrl) setServerUrl(storedUrl);
    return { token: storedToken, url: storedUrl };
  }, [setToken, setServerUrl]);

  const login = useCallback(
    async (url: string, password: string) => {
      const cleanUrl = url.replace(/\/+$/, '');
      const res = await fetch(`${cleanUrl}/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Login failed');
      }

      const { token: jwt } = await res.json();
      await Promise.all([
        SecureStore.setItemAsync(TOKEN_KEY, jwt),
        SecureStore.setItemAsync(URL_KEY, cleanUrl),
      ]);
      setToken(jwt);
      setServerUrl(cleanUrl);
      return jwt;
    },
    [setToken, setServerUrl],
  );

  const logout = useCallback(async () => {
    await Promise.all([
      SecureStore.deleteItemAsync(TOKEN_KEY),
      SecureStore.deleteItemAsync(URL_KEY),
    ]);
    setToken(null);
  }, [setToken]);

  return { serverUrl, token, loadStored, login, logout, isAuthenticated: !!token };
}
