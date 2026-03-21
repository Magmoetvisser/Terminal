# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Hussle Terminal is a two-part system: a Node.js server running on Windows, and a React Native (Expo) mobile app for iPhone. The app controls Claude Code terminal sessions remotely, views Pixel Agent Desk agent data, terminal logs, and usage statistics. It also includes a VS Code-like file editor and a full GitHub management interface.

## Architecture

```
iPhone (Expo app) → Cloudflare Tunnel → Windows PC: Node.js Server
  Server connects to:
  - node-pty (PowerShell terminal sessions via WebSocket)
  - Pixel Agent Desk API (localhost:3000, proxied)
  - systeminformation (CPU/RAM)
  - File system (read/write/browse/rename/delete for editor)
  GitHub tab connects directly to:
  - GitHub REST API (fine-grained PAT, stored in Zustand + SecureStore)
```

The server exposes REST endpoints and a WebSocket on the same port. Auth is JWT-based with a single password from `.env` (no database, 30-day JWT expiry). The server runs HTTP by default for local dev; set `USE_HTTPS=true` in `.env` for production with auto-generated self-signed certs.

## Commands

### Server (`server/`)
```bash
cd server && npm install          # Install deps (node-pty needs Windows build tools)
npm start                         # Start server (port from .env, default 3443)
npm run dev                       # Start with --watch for auto-reload
```

### Mobile (`mobile/`)
```bash
cd mobile && npm install          # Install deps
npx expo start                    # Start Expo dev server (scan QR with Expo Go)
npx expo start -c                 # Start with cache cleared
npx tsc --noEmit                  # Type check (no tests configured)
eas build --platform ios          # Build for TestFlight
```

## Key Conventions

- **Server**: Plain JavaScript (CommonJS), Express + ws + node-pty. All source in `server/src/`. Each module exports named functions (no classes).
- **Mobile**: TypeScript, Expo SDK 54, Expo Router v6 (file-based routing in `app/`), Zustand for global state, TanStack Query for server data fetching.
- **Auth**: All REST endpoints except `POST /auth` and `GET /` require `Authorization: Bearer <jwt>`. WebSocket connects with `?token=<jwt>` query param.
- **Terminal rendering**: xterm.js v5 runs inside a `react-native-webview` WebView with CDN-loaded scripts. Communication via `postMessage`. The `TerminalWebView` component has static `write()` and `clear()` methods.
- **Terminal input**: A hidden `TextInput` (opacity 0, zIndex -1) captures keyboard input. `onChangeText` computes only the diff vs. the previous value (tracked in `prevInputText` ref) to avoid double-sending due to the iOS race condition between `setNativeProps({ text: '' })` and the next keystroke. `onKeyPress` handles backspace (`\x7f`). `onSubmitEditing` sends `\r` (Enter). Tap on the terminal overlay focuses this input to show the keyboard.
- **Terminal scrolling**: A native `View` overlay with `PanResponder` handles touch scrolling (no xterm.js touch handling). Momentum/glide is computed in React Native and injected via `window.scrollLines()`. The xterm helper textarea is hidden (`display: none !important`) so xterm never receives direct keyboard input. A "scroll to bottom" button appears when scrolled up.
- **EditorTerminal**: Same input/scroll architecture as `TerminalWebView`, but self-contained (manages its own session via `useWebSocket`) and rendered as a resizable bottom panel with snap points inside the editor screen.
- **UI language**: All user-facing text in the mobile app is in Dutch.
- **Dark theme**: `#0a0a0a` background, `#e0e0e0` text, `#4ade80` accent (green). Accent color is user-configurable and persisted via `expo-secure-store`.

## Server Modules (`server/src/`)

- **index.js** — Entry point: Express app + WebSocket server setup, all route definitions
- **auth.js** — JWT authentication (password validation, token verification, middleware)
- **terminal.js** — Terminal session management via `Map<id, session>`. Sessions buffer up to 10,000 lines; new subscribers get full replay. 30-second ping/pong heartbeat detects dead connections.
- **files.js** — File system operations. Skips hidden files (except `.gitignore`), `node_modules`, `__pycache__`. 2MB size limit; blocks binary extensions (`.exe`, `.zip`, `.png`, etc.). Maps file extensions to syntax highlighting language IDs.
- **pixelAgents.js** — Proxy client for Pixel Agent Desk API (axios). Returns `{ ok, data, error }` pattern.
- **sysinfo.js** — CPU/RAM metrics via `systeminformation`
- **certgen.js** — Self-signed SSL certificate generation via `node-forge`

## Server REST API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Health check (no auth) |
| POST | `/auth` | Login, returns JWT (no auth) |
| GET | `/api/sessions` | List terminal sessions |
| POST | `/api/sessions` | Create terminal session |
| DELETE | `/api/sessions/:id` | Kill terminal session |
| GET | `/api/sessions/:id/logs` | Get session log output |
| GET | `/api/agents` | Pixel Agent Desk agents (proxy) |
| GET | `/api/agents/stats` | Agent statistics (proxy) |
| GET | `/api/agents/sessions` | Agent sessions (proxy) |
| GET | `/api/agents/heatmap` | Agent heatmap (proxy) |
| GET | `/api/agents/health` | Pixel Agent Desk health check |
| GET | `/api/system` | CPU/RAM info |
| POST | `/api/project` | Create project directory |
| GET | `/api/files/list?path=` | List directory contents (files + dirs) |
| GET | `/api/files/browse?path=` | List subdirectories only |
| GET | `/api/files/read?path=` | Read file content |
| POST | `/api/files/write` | Write file content |
| POST | `/api/files/create` | Create file or directory |
| DELETE | `/api/files?path=` | Delete file or directory |
| POST | `/api/files/rename` | Rename/move file |

## WebSocket Protocol

All messages are JSON with a `type` field:
- Client sends: `subscribe`, `terminal/input`, `terminal/resize`
- Server sends: `terminal/output`, `session/list`, `error`

## Mobile App Routing

- `/login` — Login screen (serverUrl + password)
- `/(tabs)/terminal` — Terminal with session selector + xterm.js WebView
- `/(tabs)/agents` — Pixel Agent Desk agents with detail modal + editor
- `/(tabs)/github` — Full GitHub management (repos, issues, PRs, branches, actions, releases)
- `/(tabs)/editor` — VS Code-like code editor with file tree, shortcut toolbar, terminal panel
- `/(tabs)/logs` — Log viewer with session filter + search
- `/(tabs)/usage` — Usage dashboard (tokens, costs, CPU/RAM)
- `/(tabs)/costs` — Cost tracking
- `/(tabs)/settings` — Settings (accent color, server info, GitHub token)

Auth redirect logic is in `app/_layout.tsx` via `AuthRedirect` component — unauthenticated users go to `/login`, authenticated users go to `/(tabs)/terminal`.

## Drawer Navigation

Custom drawer layout in `app/(tabs)/_layout.tsx` with animated slide-in panel (`Animated.View` + `translateX`). Menu sections:
- **Hoofd**: Terminal, Agents, GitHub, Editor
- **Monitor**: Logs, Usage, Kosten
- **Overig**: Instellingen

## GitHub Tab (`github.tsx`)

Full GitHub management interface using the GitHub REST API with a fine-grained Personal Access Token (stored via SecureStore).

### Features
- **Repository browser**: Lists user repos with search/filter, shows stars/forks/language/visibility
- **Repository detail**: Slide-up modal panel with `translateY` animation (not height resize), PanResponder drag with snap points
- **Tabs**: Bestanden (files), Commits, Branches, Issues, PRs, Actions, Releases
- **File browser**: Navigate repo file tree, view file content with syntax highlighting
- **Commits**: Commit list with diff view per commit (expandable changed files with colored diff lines)
- **Branches**: List, create, delete branches
- **Issues**: Full CRUD — create, view detail, comment, close/reopen, labels
- **Pull Requests**: Create (with head/base branch selectors), view detail, comment, merge (merge/squash/rebase selector), close/reopen, view changed files with diff
- **Actions**: View workflow runs with status
- **Releases**: List releases with assets
- **Git operations**: Clone, Pull, Push buttons that send commands to terminal sessions

### Technical Details
- `useGitHub` hook (`hooks/useGitHub.ts`) provides `ghFetch`, `ghPost`, `ghPatch`, `ghDelete`, `ghPut`, `ghFetchPages`, `ghFetchRaw`
- TanStack Query for all data fetching with conditional `enabled`
- Modal uses absolute-positioned overlay + panel (not React Native `Modal` component) with `translateY` animation for smooth extend/collapse
- Three-level navigation: list → detail → diff view

## Code Editor Tab (`editor.tsx`)

VS Code-like file editor for remote file editing on the server.

### Features
- **Project browser**: Browse server directories, select a project to open
- **File tree**: Navigable file/folder tree with icons per file type
- **Context menu**: 3-dots menu on each file/folder item with Hernoemen (rename) and Verwijderen (delete)
- **Create**: Toolbar buttons for creating new files and folders
- **Code editor**: WebView-based textarea with line numbers, tab support, monospace font
- **Shortcut toolbar**: Positioned above the editor — Enter (green), TAB, Undo, Redo, Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X, keyboard dismiss
- **Unsaved changes**: Yellow/green dot indicator, save prompt on close
- **Integrated terminal**: Floating EditorTerminal panel (toggle via FAB button), resizable with snap points

### Technical Details
- `CodeEditor` component (`components/CodeEditor.tsx`) uses `forwardRef` + `useImperativeHandle` to expose `execCommand` and `insertText` via WebView `injectJavaScript`
- `FileTree` component (`components/FileTree.tsx`) renders file list with type-based icons, supports `onPress`, `onLongPress`, `onMenuPress` (3-dots)
- Editor HTML is embedded inline with a `<textarea>` for editing, `postMessage` for communication
- Platform-aware: uses `<iframe>` on web, `react-native-webview` on native

## Components (`mobile/components/`)

- **TerminalWebView.tsx** — xterm.js terminal in WebView with static `write()`/`clear()` methods
- **EditorTerminal.tsx** — Self-contained terminal panel with own WebSocket session, resizable via PanResponder
- **CodeEditor.tsx** — WebView-based code editor with line numbers; exposes `execCommand`/`insertText` via ref
- **FileTree.tsx** — File/folder list with type icons, 3-dots context menu support
- **FolderBrowser.tsx** — Directory browser for project selection
- **AgentCard.tsx** — Agent info card for agents tab
- **CreateModal.tsx** — Modal for creating new items
- **UsageStats.tsx** — Usage statistics display
- **WebViewCompat.tsx** — Cross-platform WebView compatibility wrapper

## Hooks (`mobile/hooks/`)

- **useAuth.ts** — Login/logout + JWT persistence via `expo-secure-store` (keys: `hussle_jwt`, `hussle_server_url`)
- **useApi.ts** — Authenticated `fetch` wrapper (adds Bearer token, logs calls to console)
- **useWebSocket.ts** — WebSocket with auto-reconnect (3s), handler registry pattern (multiple listeners), subscribe/sendInput/resize
- **useGitHub.ts** — GitHub REST API wrapper using fine-grained PAT, provides typed fetch helpers

## Utils (`mobile/utils/`)

- **alert.ts** — Cross-platform alert with web fallback (`window.alert`)
- **storage.ts** — SecureStore wrapper for persistent key-value storage

## State Architecture

Global state lives in `store/index.ts` (Zustand): `serverUrl`, `token`, `sessions`, `activeSessionId`, `agents`, `systemInfo`, `accentColor`, `githubToken`, `pendingTerminalInput`. Hooks wrap all server communication:
- `useAuth` — login/logout + JWT persistence via `expo-secure-store` (keys: `hussle_jwt`, `hussle_server_url`)
- `useApi` — authenticated `fetch` wrapper (adds Bearer token, logs calls to console)
- `useWebSocket` — WebSocket with auto-reconnect (3s), handler registry pattern (multiple listeners), subscribe/sendInput/resize
- `useGitHub` — GitHub API authenticated fetch helpers

## Environment Configuration

Copy `server/.env.example` to `server/.env`. Required vars: `PASSWORD`, `JWT_SECRET`, `PORT`, `PIXEL_AGENT_DESK_URL`. Optional: `USE_HTTPS=true` for HTTPS mode.

## Platform Notes

- Runs on Windows 11. `node-pty` requires Windows build tools (Visual Studio C++ workload).
- Self-signed SSL certs auto-generated into `server/certs/` (git-ignored) when `USE_HTTPS=true`.
- iOS Expo Go blocks self-signed HTTPS — use HTTP mode for local dev.
- Server binds to `0.0.0.0` so it's reachable from the phone on local network.
- For remote access, Cloudflare Tunnel provides a public HTTPS URL pointing to the local server.
