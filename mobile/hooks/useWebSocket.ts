import { useEffect, useRef, useCallback } from 'react';
import { useStore } from '../store';

type MessageHandler = (msg: any) => void;

export function useWebSocket(onMessage?: MessageHandler) {
  const { serverUrl, token } = useStore();
  const wsRef = useRef<WebSocket | null>(null);
  const handlersRef = useRef(new Set<MessageHandler>());
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  if (onMessage) handlersRef.current.add(onMessage);

  const connect = useCallback(() => {
    if (!serverUrl || !token) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const wsUrl = serverUrl.replace(/^http/, 'ws') + `?token=${token}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('WebSocket connected');
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        for (const handler of handlersRef.current) {
          handler(msg);
        }
      } catch {}
    };

    ws.onclose = () => {
      wsRef.current = null;
      reconnectTimer.current = setTimeout(connect, 3000);
    };

    ws.onerror = () => {
      ws.close();
    };

    wsRef.current = ws;
  }, [serverUrl, token]);

  const send = useCallback((msg: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  const subscribe = useCallback(
    (sessionId: string) => {
      send({ type: 'subscribe', sessionId });
    },
    [send],
  );

  const sendInput = useCallback(
    (sessionId: string, data: string) => {
      send({ type: 'terminal/input', sessionId, data });
    },
    [send],
  );

  const resize = useCallback(
    (sessionId: string, cols: number, rows: number) => {
      send({ type: 'terminal/resize', sessionId, cols, rows });
    },
    [send],
  );

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [connect]);

  return { send, subscribe, sendInput, resize, ws: wsRef };
}
