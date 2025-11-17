// React hook for WebSocket real-time event streaming
// Connects to the Fluxera WebSocket endpoint and receives events in real-time

import { useState, useEffect, useCallback, useRef } from 'react';
import { EventData } from '@/lib/api';

// WebSocket connection states
export enum WebSocketStatus {
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  ERROR = 'error',
  RECONNECTING = 'reconnecting',
}

// WebSocket message types from the server
interface WebSocketMessage {
  type: 'connected' | 'lag_warning' | 'event';
  message?: string;
  timestamp?: number;
  skipped_events?: number;
}

// Hook state interface
interface UseWebSocketState {
  status: WebSocketStatus;
  events: EventData[];
  latestEvent: EventData | null;
  error: string | null;
  eventCount: number;
  reconnectAttempts: number;
}

/**
 * Hook to connect to Fluxera WebSocket for real-time event streaming
 *
 * @param url - WebSocket URL (default: ws://localhost:3001/ws)
 * @param autoConnect - Whether to automatically connect on mount (default: true)
 * @param maxReconnectAttempts - Maximum number of reconnection attempts (default: 5)
 * @param reconnectInterval - Time between reconnection attempts in ms (default: 3000)
 */
export function useWebSocket(
  url: string = 'ws://localhost:3001/ws',
  autoConnect: boolean = true,
  maxReconnectAttempts: number = 5,
  reconnectInterval: number = 3000
): UseWebSocketState & {
  connect: () => void;
  disconnect: () => void;
  clearEvents: () => void;
} {
  const [status, setStatus] = useState<WebSocketStatus>(WebSocketStatus.DISCONNECTED);
  const [events, setEvents] = useState<EventData[]>([]);
  const [latestEvent, setLatestEvent] = useState<EventData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [eventCount, setEventCount] = useState<number>(0);
  const [reconnectAttempts, setReconnectAttempts] = useState<number>(0);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isManualDisconnectRef = useRef<boolean>(false);

  /**
   * Handle incoming WebSocket messages
   */
  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data);

      // Handle connection confirmation
      if (data.type === 'connected') {
        console.log('🟢 WebSocket connected:', data.message);
        setStatus(WebSocketStatus.CONNECTED);
        setError(null);
        setReconnectAttempts(0);
        return;
      }

      // Handle lag warnings
      if (data.type === 'lag_warning') {
        console.warn('⚠️ WebSocket lag warning:', data.message);
        setError(`Connection lagged, skipped ${data.skipped_events} events`);
        return;
      }

      // Handle regular blockchain events
      // Check if it's an EventData (has event_type, block_height, etc.)
      if (data.id && data.event_type && data.block_height !== undefined) {
        const newEvent: EventData = data;

        // Add to events list (keep last 100 events)
        setEvents((prev) => {
          const updated = [newEvent, ...prev].slice(0, 100);
          return updated;
        });

        setLatestEvent(newEvent);
        setEventCount((prev) => prev + 1);

        console.log('📥 Received event:', newEvent.id, newEvent.event_type);
      }
    } catch (err) {
      console.error('Failed to parse WebSocket message:', err);
    }
  }, []);

  /**
   * Handle WebSocket connection open
   */
  const handleOpen = useCallback(() => {
    console.log('✅ WebSocket connection established');
    setStatus(WebSocketStatus.CONNECTED);
    setError(null);
    setReconnectAttempts(0);
  }, []);

  /**
   * Handle WebSocket errors
   */
  const handleError = useCallback((event: Event) => {
    console.error('❌ WebSocket error:', event);
    setStatus(WebSocketStatus.ERROR);
    setError('WebSocket connection error');
  }, []);

  /**
   * Handle WebSocket connection close
   */
  const handleClose = useCallback(() => {
    console.log('🔴 WebSocket connection closed');

    // Only attempt reconnection if not manually disconnected and under attempt limit
    if (
      !isManualDisconnectRef.current &&
      reconnectAttempts < maxReconnectAttempts
    ) {
      setStatus(WebSocketStatus.RECONNECTING);
      setReconnectAttempts((prev) => prev + 1);

      console.log(
        `🔄 Reconnecting... Attempt ${reconnectAttempts + 1}/${maxReconnectAttempts}`
      );

      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, reconnectInterval);
    } else if (reconnectAttempts >= maxReconnectAttempts) {
      setStatus(WebSocketStatus.ERROR);
      setError('Max reconnection attempts reached');
    } else {
      setStatus(WebSocketStatus.DISCONNECTED);
    }
  }, [reconnectAttempts, maxReconnectAttempts, reconnectInterval]);

  /**
   * Connect to WebSocket
   */
  const connect = useCallback(() => {
    // Close existing connection if any
    if (wsRef.current) {
      wsRef.current.close();
    }

    // Clear any pending reconnection timeouts
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    try {
      console.log('🔌 Connecting to WebSocket:', url);
      setStatus(WebSocketStatus.CONNECTING);
      isManualDisconnectRef.current = false;

      const ws = new WebSocket(url);

      ws.addEventListener('open', handleOpen);
      ws.addEventListener('message', handleMessage);
      ws.addEventListener('error', handleError);
      ws.addEventListener('close', handleClose);

      wsRef.current = ws;
    } catch (err) {
      console.error('Failed to create WebSocket connection:', err);
      setStatus(WebSocketStatus.ERROR);
      setError(err instanceof Error ? err.message : 'Failed to connect');
    }
  }, [url, handleOpen, handleMessage, handleError, handleClose]);

  /**
   * Disconnect from WebSocket
   */
  const disconnect = useCallback(() => {
    console.log('🔌 Manually disconnecting WebSocket');
    isManualDisconnectRef.current = true;

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setStatus(WebSocketStatus.DISCONNECTED);
  }, []);

  /**
   * Clear accumulated events
   */
  const clearEvents = useCallback(() => {
    setEvents([]);
    setLatestEvent(null);
    setEventCount(0);
  }, []);

  // Auto-connect on mount if enabled
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    // Cleanup on unmount
    return () => {
      isManualDisconnectRef.current = true;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [autoConnect, connect]);

  return {
    status,
    events,
    latestEvent,
    error,
    eventCount,
    reconnectAttempts,
    connect,
    disconnect,
    clearEvents,
  };
}
