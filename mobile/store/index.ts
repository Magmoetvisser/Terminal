import { create } from 'zustand';

export interface TerminalSession {
  id: string;
  title: string;
  workdir: string;
  active: boolean;
  createdAt: string;
}

export interface Agent {
  id: string;
  sessionId: string;
  name: string;
  project: string;
  status: string;
  type: string;
  model: string;
  avatarIndex: number;
  currentTool: string | null;
  lastMessage: string | null;
  tokenUsage: {
    inputTokens: number;
    outputTokens: number;
    estimatedCost: number;
  };
  metadata: {
    isSubagent: boolean;
    isTeammate: boolean;
    projectPath: string | null;
    parentId: string | null;
    permissionMode: string;
  };
  timing: {
    elapsed: number;
    active: boolean;
  };
}

export interface SystemInfo {
  cpu: { model: string; cores: number; loadPercent: number };
  memory: { totalGB: number; usedGB: number; usedPercent: number };
}

interface AppState {
  serverUrl: string;
  token: string | null;
  sessions: TerminalSession[];
  activeSessionId: string | null;
  agents: Agent[];
  systemInfo: SystemInfo | null;
  accentColor: string;

  setServerUrl: (url: string) => void;
  setToken: (token: string | null) => void;
  setSessions: (sessions: TerminalSession[]) => void;
  setActiveSessionId: (id: string | null) => void;
  addSession: (session: TerminalSession) => void;
  removeSession: (id: string) => void;
  setAgents: (agents: Agent[]) => void;
  setSystemInfo: (info: SystemInfo) => void;
  setAccentColor: (color: string) => void;
}

export const useStore = create<AppState>((set) => ({
  serverUrl: '',
  token: null,
  sessions: [],
  activeSessionId: null,
  agents: [],
  systemInfo: null,
  accentColor: '#4ade80',

  setServerUrl: (url) => set({ serverUrl: url }),
  setToken: (token) => set({ token }),
  setSessions: (sessions) => set({ sessions }),
  setActiveSessionId: (id) => set({ activeSessionId: id }),
  addSession: (session) =>
    set((state) => ({ sessions: [...state.sessions, session] })),
  removeSession: (id) =>
    set((state) => ({
      sessions: state.sessions.filter((s) => s.id !== id),
      activeSessionId: state.activeSessionId === id ? null : state.activeSessionId,
    })),
  setAgents: (agents) => set({ agents }),
  setSystemInfo: (info) => set({ systemInfo: info }),
  setAccentColor: (color) => set({ accentColor: color }),
}));
