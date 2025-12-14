'use client';

/**
 * FLUXERA HOOKS
 *
 * React hooks for fetching Fluxera blockchain data.
 *
 * DUAL-MODE ARCHITECTURE:
 * - PUBLIC HOOKS: Work without wallet - anyone can view data
 * - AUTHENTICATED HOOKS: Require wallet - for mutations (tracking events, sending messages)
 *
 * When wallet is connected, hooks automatically use the authenticated query
 * (via WASM client) to read from the user's chain. This ensures data written
 * by the user is immediately visible.
 *
 * PUBLIC HOOKS (this file):
 * - useDashboard() - All dashboard data
 * - useAnalyticsSummary() - Stats overview
 * - useRecentEvents() - Live event feed
 * - useRecentMessages() - Cross-chain messages
 * - useChainMetrics() - Per-chain stats
 *
 * AUTHENTICATED HOOKS (from LineraProvider):
 * - useTrackEvent() - Track new event
 * - useSendMessage() - Send cross-chain message
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuthenticatedQuery } from '@/components/providers/LineraProvider';

// HTTP client that queries via linera service
// For production: deploy linera service on a server
// For local dev: run `linera service --port 8080`
import {
  fetchAnalyticsSummary,
  fetchRecentEvents,
  fetchEvents,
  fetchRecentMessages,
  fetchAllChainMetrics,
  fetchDashboardData,
} from '@/lib/public-client';

// ============================================
// TYPES
// ============================================

export interface AnalyticsSummary {
  totalEvents: number;
  totalMessages: number;
  uniqueUsers: number;
  chainId: string;
}

export interface AnalyticsEvent {
  eventId: string;
  eventType: string;
  owner: string;
  timestamp: string;
  data: string;
  chainId: string;
}

export interface CrossChainMessage {
  messageId: string;
  sourceChain: string;
  targetChain: string;
  messageType: string;
  sentAt: string;
  payload: string;
}

export interface ChainMetricsData {
  chainId: string;
  metrics: {
    totalEvents: number;
    uniqueUsers: number;
    lastActivity: string;
    eventTypes: string;
  };
}

// ============================================
// ANALYTICS SUMMARY HOOK
// ============================================

/**
 * Fetch high-level statistics
 *
 * @param refreshInterval - Auto-refresh interval in ms (default: 5000)
 *
 * @example
 * function StatsBar() {
 *   const { summary, loading, error } = useAnalyticsSummary();
 *   if (loading) return <Spinner />;
 *   return <div>{summary?.totalEvents} events tracked</div>;
 * }
 */
export function useAnalyticsSummary(refreshInterval: number = 5000) {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    try {
      const data = await fetchAnalyticsSummary();
      setSummary(data.analyticsSummary);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch summary'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();

    if (refreshInterval > 0) {
      const interval = setInterval(refresh, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refresh, refreshInterval]);

  return { summary, loading, error, refresh };
}

// ============================================
// RECENT EVENTS HOOK
// ============================================

/**
 * Fetch most recent events (live feed)
 *
 * @param limit - Number of events to fetch (default: 10)
 * @param refreshInterval - Auto-refresh interval in ms (default: 3000)
 *
 * @example
 * function EventFeed() {
 *   const { events, loading } = useRecentEvents(10);
 *   return events.map(e => <EventCard key={e.eventId} event={e} />);
 * }
 */
export function useRecentEvents(limit: number = 10, refreshInterval: number = 3000) {
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    try {
      const data = await fetchRecentEvents(limit);
      setEvents(data.recentEvents);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch events'));
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    refresh();

    if (refreshInterval > 0) {
      const interval = setInterval(refresh, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refresh, refreshInterval]);

  return { events, loading, error, refresh };
}

// ============================================
// PAGINATED EVENTS HOOK
// ============================================

/**
 * Fetch events with pagination (for explorer)
 * Uses authenticated query when wallet is connected (reads from user's chain)
 * Falls back to public HTTP query otherwise
 *
 * @param pageSize - Events per page (default: 20)
 *
 * @example
 * function EventExplorer() {
 *   const { events, loading, hasMore, loadMore } = useEvents(20);
 *   return (
 *     <>
 *       {events.map(e => <EventRow key={e.eventId} event={e} />)}
 *       {hasMore && <button onClick={loadMore}>Load More</button>}
 *     </>
 *   );
 * }
 */
export function useEvents(pageSize: number = 20) {
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // Get authenticated query if available
  const { query: authQuery, isConnected } = useAuthenticatedQuery();

  const loadEvents = useCallback(async (newOffset: number = 0, append: boolean = false) => {
    setLoading(true);
    try {
      let data;

      if (isConnected && authQuery) {
        // Use authenticated query (reads from user's chain via WASM client)
        console.log('[useEvents] Using authenticated query');
        const graphqlQuery = `query { events(offset: ${newOffset}, limit: ${pageSize}) { eventId eventType owner timestamp data chainId } }`;
        const result = await authQuery(graphqlQuery);
        data = { events: result?.events || [] };
      } else {
        // Fall back to public HTTP query
        console.log('[useEvents] Using public query');
        data = await fetchEvents(newOffset, pageSize);
      }

      if (append) {
        setEvents(prev => [...prev, ...(data.events || [])]);
      } else {
        setEvents(data.events || []);
      }
      setHasMore((data.events || []).length === pageSize);
      setOffset(newOffset);
      setError(null);
    } catch (err) {
      console.error('[useEvents] Error:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch events'));
    } finally {
      setLoading(false);
    }
  }, [pageSize, isConnected, authQuery]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      loadEvents(offset + pageSize, true);
    }
  }, [loading, hasMore, offset, pageSize, loadEvents]);

  const refresh = useCallback(() => {
    setOffset(0);
    loadEvents(0, false);
  }, [loadEvents]);

  useEffect(() => {
    loadEvents(0);
  }, [loadEvents]);

  return { events, loading, error, hasMore, loadMore, refresh };
}

// ============================================
// RECENT MESSAGES HOOK
// ============================================

/**
 * Fetch recent cross-chain messages
 * Uses authenticated query when wallet is connected (reads from user's chain)
 * Falls back to public HTTP query otherwise
 *
 * @param limit - Number of messages (default: 10)
 * @param refreshInterval - Auto-refresh interval (default: 5000)
 *
 * @example
 * function MessageFeed() {
 *   const { messages, loading } = useRecentMessages(5);
 *   return messages.map(m => <MessageCard key={m.messageId} message={m} />);
 * }
 */
export function useRecentMessages(limit: number = 10, refreshInterval: number = 5000) {
  const [messages, setMessages] = useState<CrossChainMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Get authenticated query if available
  const { query: authQuery, isConnected } = useAuthenticatedQuery();

  const refresh = useCallback(async () => {
    try {
      let data;

      if (isConnected && authQuery) {
        // Use authenticated query (reads from user's chain via WASM client)
        console.log('[useRecentMessages] Using authenticated query');
        const graphqlQuery = `query { recentMessages(limit: ${limit}) { messageId sourceChain targetChain messageType sentAt payload } }`;
        const result = await authQuery(graphqlQuery);
        data = { recentMessages: result?.recentMessages || [] };
      } else {
        // Fall back to public HTTP query
        console.log('[useRecentMessages] Using public query');
        data = await fetchRecentMessages(limit);
      }

      setMessages(data.recentMessages || []);
      setError(null);
    } catch (err) {
      console.error('[useRecentMessages] Error:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch messages'));
    } finally {
      setLoading(false);
    }
  }, [limit, isConnected, authQuery]);

  useEffect(() => {
    refresh();

    if (refreshInterval > 0) {
      const interval = setInterval(refresh, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refresh, refreshInterval]);

  return { messages, loading, error, refresh };
}

// ============================================
// CHAIN METRICS HOOK
// ============================================

/**
 * Fetch metrics for all tracked chains
 *
 * @param refreshInterval - Auto-refresh interval (default: 10000)
 *
 * @example
 * function ChainList() {
 *   const { chains, loading } = useChainMetrics();
 *   return chains.map(c => <ChainCard key={c.chainId} chain={c} />);
 * }
 */
export function useChainMetrics(refreshInterval: number = 10000) {
  const [chains, setChains] = useState<ChainMetricsData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    try {
      const data = await fetchAllChainMetrics();
      setChains(data.allChainMetrics);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch chain metrics'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();

    if (refreshInterval > 0) {
      const interval = setInterval(refresh, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refresh, refreshInterval]);

  return { chains, loading, error, refresh };
}

// ============================================
// DASHBOARD HOOK (ALL DATA IN ONE)
// ============================================

interface DashboardData {
  summary: AnalyticsSummary | null;
  events: AnalyticsEvent[];
  messages: CrossChainMessage[];
  chains: ChainMetricsData[];
}

/**
 * Fetch all dashboard data in a single query
 * More efficient than multiple separate queries
 *
 * @param refreshInterval - Auto-refresh interval (default: 5000)
 *
 * @example
 * function Dashboard() {
 *   const { summary, events, messages, chains, loading } = useDashboard();
 *
 *   if (loading) return <Loader />;
 *
 *   return (
 *     <>
 *       <StatsCards summary={summary} />
 *       <EventFeed events={events} />
 *       <MessageFlow messages={messages} />
 *       <ChainList chains={chains} />
 *     </>
 *   );
 * }
 */
export function useDashboard(refreshInterval: number = 5000) {
  const [data, setData] = useState<DashboardData>({
    summary: null,
    events: [],
    messages: [],
    chains: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    try {
      const result = await fetchDashboardData(10, 5);
      setData({
        summary: result.analyticsSummary,
        events: result.recentEvents,
        messages: result.recentMessages,
        chains: result.allChainMetrics,
      });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch dashboard data'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();

    if (refreshInterval > 0) {
      const interval = setInterval(refresh, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refresh, refreshInterval]);

  return { ...data, loading, error, refresh };
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Truncate address for display
 * "0x1234567890abcdef" → "0x1234...cdef"
 */
export function truncateAddress(address: string, chars: number = 6): string {
  if (!address) return '';
  if (address.length <= chars * 2 + 3) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

/**
 * Format timestamp to relative time
 * "2024-01-01T00:00:00Z" → "5s ago"
 */
export function formatRelativeTime(timestamp: string): string {
  const now = Date.now();
  const time = new Date(timestamp).getTime();
  const diff = Math.floor((now - time) / 1000);

  if (diff < 0) return 'just now';
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

/**
 * Parse event type to display name
 * "token_transfer" → "Token Transfer"
 */
export function formatEventType(eventType: string): string {
  return eventType
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Get color for event type (for badges/tags)
 */
export function getEventTypeColor(eventType: string): string {
  const colors: Record<string, string> = {
    token_transfer: 'bg-blue-500',
    swap_executed: 'bg-green-500',
    nft_mint: 'bg-purple-500',
    cross_chain_send: 'bg-yellow-500',
    cross_chain_receive: 'bg-orange-500',
    user_signup: 'bg-pink-500',
    transaction: 'bg-indigo-500',
  };
  return colors[eventType] || 'bg-gray-500';
}
