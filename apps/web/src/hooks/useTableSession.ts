import { useState, useEffect, useCallback, useRef } from 'react';
import { io, type Socket } from 'socket.io-client';
import type { SessionState } from '@bill/shared';

const SERVER_URL = import.meta.env.VITE_API_BASE_URL ?? '';

export function useTableSession(tableId: string, adminToken: string | null, name?: string, shouldConnect: boolean = true) {
  const [sessionState, setSessionState] = useState<SessionState | null>(null);
  const [myDinerId, setMyDinerId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!shouldConnect) return;

    const socket = io(SERVER_URL, {
      autoConnect: false,
      transports: ['websocket'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      setConnectionError(null);
      socket.emit('join-table', { tableId, ...(adminToken ? { adminToken } : {}) });
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('connect_error', () => {
      setConnectionError('לא ניתן להתחבר לשרת');
    });

    socket.on('joined', ({ dinerId }: { dinerId: string }) => {
      setMyDinerId(dinerId);
    });

    socket.on('session-state', (state: SessionState) => {
      setSessionState(state);
    });

    socket.on('error', ({ message }: { message: string }) => {
      setConnectionError(message);
    });

    socket.connect();

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [tableId, adminToken, shouldConnect]);

  // Send name as a separate event after joining — avoids all closure timing issues
  useEffect(() => {
    if (name && myDinerId && socketRef.current) {
      socketRef.current.emit('set-name', { name });
    }
  }, [name, myDinerId]);

  const toggleItem = useCallback((itemId: string) => {
    socketRef.current?.emit('toggle-item', { itemId });
  }, []);

  const setDone = useCallback(() => {
    socketRef.current?.emit('set-done');
  }, []);

  const reduceItem = useCallback((itemId: string, amount: number) => {
    socketRef.current?.emit('reduce-item', { itemId, amount });
  }, []);

  const calculate = useCallback(() => {
    socketRef.current?.emit('calculate');
  }, []);

  return {
    sessionState,
    myDinerId,
    isConnected,
    connectionError,
    toggleItem,
    setDone,
    reduceItem,
    calculate,
  };
}
