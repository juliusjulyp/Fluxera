'use client';

/**
 * FLUXERA WEBSOCKET HOOK
 *
 * Real-time event streaming from the Fluxera indexer.
 * Replaces polling with live WebSocket updates.
 *
 * Features:
 * - Auto-reconnect on disconnect
 * - Connection status tracking
 * - Event buffering during reconnection
 * - Heartbeat/ping-pong support
 *
 * @example
 * function LiveEvents() {
 *   const { events, isConnected, error } = useWebSocketEvents();
 *   return (
 *     <div>
 *       <Status connected={isConnected} />
 *       {events.map(e => <EventCard key={e.id} event={e} />)}
 *     </div>
 *   );
 * }
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { LINERA_CONFIG } from '@/lib/linera-config';

// ============================================
// TYPES
// ============================================

export interface IndexerEvent {
  id: string;
  event_type: string;
  block_height: number;
  microchain_id: string;
  timestamp: number;
  transaction_data?: unknown;
  contract_event_data?: unknown;
  state_change_data?: unknown;
}

export interface WebSocketMessage {
  type: 'connected' | 'event' | 'lag_warning' | 'error';
  message?: string;
  timestamp?: number;
  skipped_events?: number;
}

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

interface UseWebSocketOptions {
  /** Max events to keep in buffer (default: 100) */
  maxEvents?: number;
  /** Auto-reconnect on disconnect (default: true) */
  autoReconnect?: boolean;
  /** Reconnect delay in ms (default: 3000) */
  reconnectDelay?: number;
  /** Max reconnect attempts (default: 10) */
  maxReconnectAttempts?: number;
}

// ============================================
// WEBSOCKET HOOK
// ============================================

export function useWebSocketEvents(options: UseWebSocketOptions = {}) {
  const {
    maxEvents = 100,
    autoReconnect = true,
    reconnectDelay = 3000,
    maxReconnectAttempts = 10,
  } = options;

  const [events, setEvents] = useState<IndexerEvent[]>([]);
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [error, setError] = useState<Error | null>(null);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clear reconnect timeout
  const clearReconnectTimeout = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  // Connect to WebSocket
  const connect = useCallback(() => {
    // Don't connect if already connected or connecting
    if (wsRef.current?.readyState === WebSocket.OPEN ||
        wsRef.current?.readyState === WebSocket.CONNECTING) {
      return;
    }

    setStatus('connecting');
    setError(null);

    try {
      const ws = new WebSocket(LINERA_CONFIG.INDEXER_WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[WebSocket] Connected to Fluxera indexer');
        setStatus('connected');
        setError(null);
        reconnectAttemptsRef.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          // Handle different message types
          if (data.type === 'connected') {
            console.log('[WebSocket] Welcome message received:', data.message);
            setLastMessage(data);
          } else if (data.type === 'lag_warning') {
            console.warn('[WebSocket] Lag warning - skipped events:', data.skipped_events);
            setLastMessage(data);
          } else if (data.id && data.event_type) {
            // This is an event
            const indexerEvent: IndexerEvent = data;
            console.log('[WebSocket] Event received:', indexerEvent.id);

            setEvents(prev => {
              const newEvents = [indexerEvent, ...prev];
              // Keep only maxEvents
              return newEvents.slice(0, maxEvents);
            });

            setLastMessage({ type: 'event', timestamp: Date.now() });
          }
        } catch (err) {
          console.error('[WebSocket] Failed to parse message:', err);
        }
      };

      ws.onerror = (event) => {
        console.error('[WebSocket] Error:', event);
        setError(new Error('WebSocket connection error'));
        setStatus('error');
      };

      ws.onclose = (event) => {
        console.log('[WebSocket] Disconnected:', event.code, event.reason);
        setStatus('disconnected');
        wsRef.current = null;

        // Auto-reconnect if enabled and not max attempts
        if (autoReconnect && reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current += 1;
          console.log(`[WebSocket] Reconnecting in ${reconnectDelay}ms (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})`);

          clearReconnectTimeout();
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectDelay);
        } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          setError(new Error('Max reconnection attempts reached'));
        }
      };
    } catch (err) {
      console.error('[WebSocket] Failed to create connection:', err);
      setError(err instanceof Error ? err : new Error('Failed to connect'));
      setStatus('error');
    }
  }, [maxEvents, autoReconnect, reconnectDelay, maxReconnectAttempts, clearReconnectTimeout]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    clearReconnectTimeout();
    reconnectAttemptsRef.current = maxReconnectAttempts; // Prevent auto-reconnect

    if (wsRef.current) {
      wsRef.current.close(1000, 'Client disconnecting');
      wsRef.current = null;
    }

    setStatus('disconnected');
  }, [clearReconnectTimeout, maxReconnectAttempts]);

  // Clear events buffer
  const clearEvents = useCallback(() => {
    setEvents([]);
  }, []);

  // Connect on mount, disconnect on unmount
  useEffect(() => {
    connect();

    return () => {
      clearReconnectTimeout();
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmounting');
        wsRef.current = null;
      }
    };
  }, [connect, clearReconnectTimeout]);

  return {
    /** Real-time events (newest first) */
    events,
    /** Connection status */
    status,
    /** Whether connected */
    isConnected: status === 'connected',
    /** Connection error if any */
    error,
    /** Last message received */
    lastMessage,
    /** Manually connect */
    connect,
    /** Manually disconnect */
    disconnect,
    /** Clear events buffer */
    clearEvents,
  };
}

// ============================================
// COMBINED HOOK (WebSocket + Fallback to Polling)
// ============================================

/**
 * Smart hook that uses WebSocket when available, falls back to polling.
 * Use this in components for seamless real-time updates.
 */
export function useRealTimeEvents(options: UseWebSocketOptions & { pollingInterval?: number } = {}) {
  const { pollingInterval = 5000, ...wsOptions } = options;

  const ws = useWebSocketEvents(wsOptions);
  const [polledEvents, setPolledEvents] = useState<IndexerEvent[]>([]);
  const [isPolling, setIsPolling] = useState(false);

  // Fall back to polling if WebSocket is not connected
  useEffect(() => {
    if (ws.isConnected) {
      setIsPolling(false);
      return;
    }

    // Start polling as fallback
    setIsPolling(true);

    const poll = async () => {
      try {
        const response = await fetch(`${LINERA_CONFIG.INDEXER_URL}/events/recent`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setPolledEvents(data.data);
          }
        }
      } catch (err) {
        console.error('[Polling] Failed to fetch events:', err);
      }
    };

    poll(); // Initial fetch
    const interval = setInterval(poll, pollingInterval);

    return () => clearInterval(interval);
  }, [ws.isConnected, pollingInterval]);

  return {
    /** Events (from WebSocket if connected, otherwise from polling) */
    events: ws.isConnected ? ws.events : polledEvents,
    /** Whether using WebSocket */
    isWebSocket: ws.isConnected,
    /** Whether using polling fallback */
    isPolling,
    /** Connection status */
    status: ws.status,
    /** Error if any */
    error: ws.error,
    /** Manually reconnect WebSocket */
    reconnect: ws.connect,
  };
}

export default useWebSocketEvents;
