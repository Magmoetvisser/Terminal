# Hussle Terminal

Remote terminal voor je Windows PC, recht vanaf je iPhone. Bedien Claude Code sessies, bekijk Pixel Agent Desk agents, bewerk bestanden en monitor systeemgebruik — overal, niet alleen op je thuis-WiFi.

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
                  ├── File system API (lezen/schrijven/browsen)
                  └── systeminformation → CPU/RAM
```

## Features

### Terminal
- Volledige xterm.js terminal in een WebView
- Meerdere gelijktijdige sessies
- Touch scrolling met momentum/inertia
- Sneltoets-toolbar: `ESC`, `Ctrl+C`, `TAB`, `↑`, `↓`, `Ctrl+D`, `Ctrl+Z`, plakken
- Scroll-to-bottom knop

### Agents (Pixel Agent Desk)
- Live overzicht van alle Claude Code agents
- Status, model, tokens, kosten per agent
- Conversatiegeschiedenis bekijken (chat-stijl)
- Direct een terminal openen in het project van een agent

### Code Editor
- VS Code-achtige bestandsboom met syntax highlighting
- Bestanden lezen, bewerken, aanmaken, verwijderen, hernoemen
- Zwevend terminal paneel (versleepbaar) voor Claude Code in de editor
- Map-browser voor navigatie

### Overig
- Usage dashboard: tokens, kosten, CPU/RAM van de PC
- Terminal logs per sessie doorzoeken
- Kosten-overzicht
- Accent kleur aanpasbaar via instellingen

## Vereisten

- **Windows PC** met Node.js 18+ en [Windows Build Tools](https://github.com/nicedoc/windows-build-tools) (voor node-pty)
- **iPhone** met [Expo Go](https://expo.dev/go) (development) of TestFlight (productie)
- Optioneel: [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/) voor toegang buiten je netwerk

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
    │   ├── login.tsx         # Login scherm
    │   ├── (tabs)/
    │   │   ├── terminal.tsx  # Terminal met sessie-selector
    │   │   ├── agents.tsx    # Agent overzicht + detail modal
    │   │   ├── logs.tsx      # Terminal log viewer
    │   │   ├── usage.tsx     # Usage dashboard
    │   │   ├── costs.tsx     # Kosten overzicht
    │   │   └── settings.tsx  # Instellingen
    │   ├── editor/[path].tsx # Code editor
    │   └── agent-history/[id].tsx # Agent chat geschiedenis
    ├── components/
    │   ├── TerminalWebView.tsx   # xterm.js WebView + scroll + toolbar
    │   ├── EditorTerminal.tsx    # Zwevend terminal paneel
    │   ├── AgentCard.tsx         # Agent kaart component
    │   ├── CodeEditor.tsx        # Monaco-achtige editor
    │   ├── FileTree.tsx          # Bestandsboom
    │   ├── FolderBrowser.tsx     # Map-kiezer modal
    │   ├── CreateModal.tsx       # Aanmaak-opties modal
    │   └── UsageStats.tsx        # Token/kosten visualisatie
    ├── hooks/
    │   ├── useAuth.ts        # JWT opslag + login
    │   ├── useApi.ts         # Authenticated fetch wrapper
    │   └── useWebSocket.ts   # WebSocket + auto-reconnect
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
| Terminal | xterm.js (via WebView), node-pty |
| Server | Express, ws, Node.js |
| Auth | JWT (jsonwebtoken), expo-secure-store |
| Tunnel | Cloudflare Tunnel |
