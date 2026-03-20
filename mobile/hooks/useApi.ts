import { useCallback } from 'react';
import { useStore } from '../store';

export function useApi() {
  const { serverUrl, token } = useStore();

  const apiFetch = useCallback(
    async (path: string, options?: RequestInit) => {
      if (!serverUrl || !token) {
        throw new Error('Not connected');
      }
      const url = `${serverUrl}${path}`;
      console.log(`[API] ${options?.method || 'GET'} ${url}`);

      const res = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          ...(options?.headers || {}),
        },
      });

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }

      if (!res.ok) {
        console.log(`[API] Error ${res.status}:`, data);
        throw new Error(data?.error || `HTTP ${res.status}`);
      }

      console.log(`[API] OK:`, typeof data === 'object' ? JSON.stringify(data).slice(0, 100) : data);
      return data;
    },
    [serverUrl, token],
  );

  return { apiFetch };
}
