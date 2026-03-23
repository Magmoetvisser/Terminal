const pty = require('node-pty');
const crypto = require('crypto');

const MAX_LOG_LINES = 10000;
const sessions = new Map();
let sessionCounter = 0;

function createSession(workdir) {
  const id = crypto.randomUUID();
  const shell = process.platform === 'win32' ? 'powershell.exe' : 'bash';
  const cwd = workdir || process.env.USERPROFILE || process.env.HOME;

  const ptyProcess = pty.spawn(shell, [], {
    name: 'xterm-256color',
    cols: 80,
    rows: 24,
    cwd,
    env: process.env,
  });

  const session = {
    id,
    pty: ptyProcess,
    logs: [],
    workdir: cwd,
    title: `Session ${++sessionCounter}`,
    active: true,
    subscribers: new Set(),
    createdAt: new Date().toISOString(),
  };

  ptyProcess.onData((data) => {
    session.logs.push(data);
    if (session.logs.length > MAX_LOG_LINES) {
      session.logs.splice(0, session.logs.length - MAX_LOG_LINES);
    }
    for (const ws of session.subscribers) {
      if (ws.readyState === 1) {
        ws.send(JSON.stringify({ type: 'terminal/output', sessionId: id, data }));
      }
    }
  });

  ptyProcess.onExit(({ exitCode }) => {
    session.active = false;
    for (const ws of session.subscribers) {
      if (ws.readyState === 1) {
        ws.send(JSON.stringify({ type: 'session/ended', sessionId: id, exitCode }));
      }
    }
  });

  sessions.set(id, session);
  return { id, title: session.title, workdir: session.workdir, active: true };
}

function writeToSession(sessionId, data) {
  const session = sessions.get(sessionId);
  if (!session || !session.active) return false;
  session.pty.write(data);
  return true;
}

function resizeSession(sessionId, cols, rows) {
  const session = sessions.get(sessionId);
  if (!session || !session.active) return false;
  session.pty.resize(cols, rows);
  return true;
}

function killSession(sessionId) {
  const session = sessions.get(sessionId);
  if (!session) return false;
  session.active = false;
  sessions.delete(sessionId);
  try {
    session.pty.kill();
  } catch (e) {
    // pty may already be dead
  }
  return true;
}

function subscribe(sessionId, ws) {
  const session = sessions.get(sessionId);
  if (!session) return false;
  session.subscribers.add(ws);
  // Send existing logs as replay
  if (session.logs.length > 0) {
    ws.send(JSON.stringify({
      type: 'terminal/output',
      sessionId,
      data: session.logs.join(''),
    }));
  }
  return true;
}

function unsubscribeAll(ws) {
  for (const session of sessions.values()) {
    session.subscribers.delete(ws);
  }
}

function listSessions() {
  return Array.from(sessions.values()).map((s) => ({
    id: s.id,
    title: s.title,
    workdir: s.workdir,
    active: s.active,
    createdAt: s.createdAt,
  }));
}

function getSessionLogs(sessionId) {
  const session = sessions.get(sessionId);
  if (!session) return null;
  return session.logs.join('');
}

module.exports = {
  createSession,
  writeToSession,
  resizeSession,
  killSession,
  subscribe,
  unsubscribeAll,
  listSessions,
  getSessionLogs,
};
