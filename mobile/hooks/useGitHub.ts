import { useCallback } from 'react';
import { useStore } from '../store';
import { deleteItem } from '../utils/storage';

const GITHUB_API = 'https://api.github.com';
const GITHUB_TOKEN_KEY = 'hussle_github_token';

export function useGitHub() {
  const { githubToken, setGithubToken } = useStore();

  const handleUnauthorized = useCallback(async () => {
    setGithubToken(null);
    await deleteItem(GITHUB_TOKEN_KEY);
  }, [setGithubToken]);

  const ghFetch = useCallback(
    async <T = any>(path: string, options?: RequestInit): Promise<T> => {
      if (!githubToken) throw new Error('Niet ingelogd');

      const res = await fetch(`${GITHUB_API}${path}`, {
        ...options,
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: 'application/vnd.github+json',
          ...(options?.headers || {}),
        },
      });

      if (res.status === 401) {
        await handleUnauthorized();
        throw new Error('Token verlopen');
      }
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || `GitHub API ${res.status}`);
      }
      return res.json();
    },
    [githubToken, handleUnauthorized],
  );

  const ghFetchRaw = useCallback(
    async (path: string): Promise<string> => {
      if (!githubToken) throw new Error('Niet ingelogd');

      const res = await fetch(`${GITHUB_API}${path}`, {
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: 'application/vnd.github.raw+json',
        },
      });

      if (res.status === 401) {
        await handleUnauthorized();
        throw new Error('Token verlopen');
      }
      if (!res.ok) throw new Error(`GitHub API ${res.status}`);
      return res.text();
    },
    [githubToken, handleUnauthorized],
  );

  const ghPost = useCallback(
    async <T = any>(path: string, body: object): Promise<T> => {
      return ghFetch<T>(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    },
    [ghFetch],
  );

  const ghPatch = useCallback(
    async <T = any>(path: string, body: object): Promise<T> => {
      return ghFetch<T>(path, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    },
    [ghFetch],
  );

  const ghPut = useCallback(
    async <T = any>(path: string, body?: object): Promise<T> => {
      return ghFetch<T>(path, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      });
    },
    [ghFetch],
  );

  const ghDelete = useCallback(
    async (path: string): Promise<void> => {
      await ghFetch(path, { method: 'DELETE' });
    },
    [ghFetch],
  );

  const ghFetchPages = useCallback(
    async <T = any>(path: string): Promise<T[]> => {
      if (!githubToken) throw new Error('Niet ingelogd');

      const all: T[] = [];
      let page = 1;
      const separator = path.includes('?') ? '&' : '?';

      while (true) {
        const res = await fetch(`${GITHUB_API}${path}${separator}per_page=100&page=${page}`, {
          headers: {
            Authorization: `Bearer ${githubToken}`,
            Accept: 'application/vnd.github+json',
          },
        });

        if (res.status === 401) {
          await handleUnauthorized();
          throw new Error('Token verlopen');
        }
        if (!res.ok) break;

        const data: T[] = await res.json();
        all.push(...data);
        if (data.length < 100) break;
        page++;
      }
      return all;
    },
    [githubToken, handleUnauthorized],
  );

  return {
    ghFetch,
    ghFetchRaw,
    ghPost,
    ghPatch,
    ghPut,
    ghDelete,
    ghFetchPages,
    isAuthenticated: !!githubToken,
  };
}

export { GITHUB_API, GITHUB_TOKEN_KEY };
