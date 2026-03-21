# Hussle Terminal

Remote terminal voor je Windows PC, recht vanaf je iPhone. Bedien Claude Code sessies, beheer GitHub repos, bewerk bestanden en monitor systeemgebruik — overal, niet alleen op je thuis-WiFi.

![Platform](https://img.shields.io/badge/platform-iOS-000?logo=apple&logoColor=white)
![Expo](https://img.shields.io/badge/Expo_SDK_54-000?logo=expo&logoColor=white)
![Node](https://img.shields.io/badge/Node.js-000?logo=node.js&logoColor=white)

## Architectuur

```
iPhone (Expo app)
      │  HTTPS + WebSocket
      ▼
Cloudflare Tunnel (publiek adres)
      │
      ▼
Windows PC ─── Node.js Server (Express + ws)
                  ├── node-pty → PowerShell sessies
                  ├── Pixel Agent Desk proxy (localhost:3000)
                  ├── File system API (lezen/schrijven/browsen/hernoemen/verwijderen)
                  └── systeminformation → CPU/RAM

iPhone ──── GitHub REST API (directe connectie met fine-grained PAT)
```

## Features

### Terminal
- Volledige xterm.js terminal in een WebView
- Meerdere gelijktijdige sessies met sessie-selector
- Touch scrolling met momentum/inertia
- Sneltoets-toolbar: `ESC`, `Ctrl+C`, `TAB`, `↑`, `↓`, `Ctrl+D`, `Ctrl+Z`, plakken
- Scroll-to-bottom knop

### GitHub Management
- Repository browser met zoeken en filteren (sterren, forks, taal, zichtbaarheid)
- **Bestanden** — navigeer door repo bestandsboom, bekijk bestanden met syntax highlighting
- **Commits** — commit geschiedenis met uitklapbare diff view (gekleurde add/remove regels)
- **Branches** — lijst, aanmaken, verwijderen
- **Issues** — volledige CRUD: aanmaken, bekijken, reageren, sluiten/heropenen, labels
- **Pull Requests** — aanmaken (met head/base branch kiezers), bekijken, reageren, mergen (merge/squash/rebase selector), sluiten/heropenen, diff per gewijzigd bestand
- **Actions** — workflow runs bekijken met status
- **Releases** — releases met downloadbare assets
- **Git operaties** — Clone, Pull, Push knoppen verbonden met terminal sessies
- Slide-up detail modal met drag-to-resize (translateY animatie, snap points)

### Code Editor
- VS Code-achtige bestandsboom met type-iconen (JS, TS, Python, HTML, CSS, JSON, etc.)
- Project browser — selecteer een map op de server
- Bestanden lezen, bewerken, opslaan met onopgeslagen-wijzigingen indicator
- Sneltoets-toolbar boven de editor: Enter, TAB, Undo, Redo, Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
- Context menu (3-puntjes) op bestanden/mappen: hernoemen, verwijderen
- Nieuwe bestanden en mappen aanmaken via toolbar
- Zwevend terminal paneel (versleepbaar met snap points) via FAB knop
- WebView-gebaseerde editor met regelnummers en tab-ondersteuning

### Agents (Pixel Agent Desk)
- Live overzicht van alle Claude Code agents
- Status, model, tokens, kosten per agent
- Conversatiegeschiedenis bekijken (chat-stijl)
- Direct een terminal openen in het project van een agent
- Ingebouwde code editor per agent

### Monitoring
- **Logs** — terminal logs per sessie doorzoeken met filter
- **Usage** — token usage dashboard met kosten
- **Kosten** — gedetailleerd kosten-overzicht
- CPU/RAM real-time monitoring

### Instellingen
- Accent kleur aanpasbaar (persistent via SecureStore)
- Server connectie info
- GitHub Personal Access Token beheer

## Navigatie

Custom drawer navigatie met geanimeerd slide-in paneel:

| Sectie | Tab | Beschrijving |
|--------|-----|-------------|
| Hoofd | Terminal | Remote PowerShell sessies |
| Hoofd | Agents | Pixel Agent Desk monitoring |
| Hoofd | GitHub | Volledige GitHub management |
| Hoofd | Editor | VS Code-achtige code editor |
| Monitor | Logs | Terminal log viewer |
| Monitor | Usage | Token/kosten dashboard |
| Monitor | Kosten | Kosten tracking |
| Overig | Instellingen | App instellingen |

## Vereisten

- **Windows PC** met Node.js 18+ en [Windows Build Tools](https://github.com/nicedoc/windows-build-tools) (voor node-pty)
- **iPhone** met [Expo Go](https://expo.dev/go) (development) of TestFlight (productie)
- Optioneel: [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/) voor toegang buiten je netwerk
- Optioneel: [GitHub fine-grained PAT](https://github.com/settings/tokens?type=beta) voor GitHub features

## Installatie

### Server

```bash
cd server
cp .env.example .env     # Vul PASSWORD, JWT_SECRET in
npm install
npm start                 # Start op poort 3443 (HTTP)
```

Omgevingsvariabelen (`.env`):

| Variabele | Beschrijving |
|-----------|-------------|
| `PASSWORD` | Wachtwoord voor authenticatie |
| `JWT_SECRET` | Geheime sleutel voor JWT tokens |
| `PORT` | Server poort (default: 3443) |
| `PIXEL_AGENT_DESK_URL` | URL van Pixel Agent Desk (default: http://localhost:3000) |
| `USE_HTTPS` | `true` voor HTTPS met self-signed certs |

### Mobile

```bash
cd mobile
npm install
npx expo start            # Scan QR code met Expo Go
```

## Project Structuur

```
terminal/
├── server/
│   └── src/
│       ├── index.js          # Express + WebSocket server
│       ├── auth.js           # JWT authenticatie
│       ├── terminal.js       # node-pty sessie management
│       ├── pixelAgents.js    # Pixel Agent Desk proxy
│       ├── files.js          # File system operaties
│       ├── sysinfo.js        # CPU/RAM info
│       └── certgen.js        # Self-signed SSL generatie
│
└── mobile/
    ├── app/
    │   ├── _layout.tsx       # Auth redirect
    │   ├── login.tsx         # Login scherm
    │   └── (tabs)/
    │       ├── _layout.tsx   # Drawer navigatie
    │       ├── terminal.tsx  # Terminal met sessie-selector
    │       ├── agents.tsx    # Agent overzicht + detail modal
    │       ├── github.tsx    # GitHub management (repos, issues, PRs, etc.)
    │       ├── editor.tsx    # Code editor met bestandsboom
    │       ├── logs.tsx      # Terminal log viewer
    │       ├── usage.tsx     # Usage dashboard
    │       ├── costs.tsx     # Kosten overzicht
    │       └── settings.tsx  # Instellingen
    ├── components/
    │   ├── TerminalWebView.tsx   # xterm.js WebView + scroll + toolbar
    │   ├── EditorTerminal.tsx    # Zwevend terminal paneel
    │   ├── CodeEditor.tsx        # WebView code editor met ref (execCommand/insertText)
    │   ├── FileTree.tsx          # Bestandsboom met 3-puntjes menu
    │   ├── AgentCard.tsx         # Agent kaart component
    │   ├── FolderBrowser.tsx     # Map-kiezer modal
    │   ├── CreateModal.tsx       # Aanmaak-opties modal
    │   ├── UsageStats.tsx        # Token/kosten visualisatie
    │   └── WebViewCompat.tsx     # Cross-platform WebView wrapper
    ├── hooks/
    │   ├── useAuth.ts        # JWT opslag + login/logout
    │   ├── useApi.ts         # Authenticated fetch wrapper
    │   ├── useWebSocket.ts   # WebSocket + auto-reconnect
    │   └── useGitHub.ts      # GitHub REST API helpers (ghFetch/ghPost/ghPatch/etc.)
    ├── utils/
    │   ├── alert.ts          # Cross-platform alert (web fallback)
    │   └── storage.ts        # SecureStore wrapper
    └── store/
        └── index.ts          # Zustand global state
```

## Cloudflare Tunnel (optioneel)

Voor toegang buiten je thuisnetwerk:

```bash
cloudflared tunnel login
cloudflared tunnel create hussle
cloudflared tunnel route dns hussle hussle.jouw-domein.com
cloudflared tunnel run hussle
```

Configureer `~/.cloudflared/config.yml`:

```yaml
tunnel: hussle
ingress:
  - hostname: hussle.jouw-domein.com
    service: http://localhost:3443
  - service: http_status:404
```

## Stack

| Onderdeel | Technologie |
|-----------|------------|
| Mobile | React Native, Expo SDK 54, Expo Router v6, TypeScript |
| State | Zustand, TanStack Query |
| Terminal | xterm.js v5 (via WebView), node-pty |
| Server | Express, ws, Node.js |
| Auth | JWT (jsonwebtoken), expo-secure-store |
| GitHub | GitHub REST API, fine-grained PAT |
| Editor | WebView textarea, forwardRef + injectJavaScript |
| Tunnel | Cloudflare Tunnel |
