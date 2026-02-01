/**
 * CHAIN ACTIVITY VIEWER
 *
 * Read-only view of actual on-chain records across all configured chains.
 * Queries each chain's events and displays them in a unified timeline.
 *
 * This shows REAL blockchain activity - records that were actually
 * created on each chain via the "Create On-Chain Record" form or
 * received via cross-chain messages.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Activity, Clock, User, Tag, ChevronDown, ChevronUp } from 'lucide-react';
import { getKnownChains, truncateChainId, ChainInfo } from '@/lib/chain-registry';
import { formatRelativeTime } from '@/hooks/useFluxera';
import { LINERA_CONFIG } from '@/lib/linera-config';

interface ChainEvent {
  eventId: string;
  eventType: string;
  owner: string;
  timestamp: string;
  data: string;
  chainId: string;
}

interface ChainActivityProps {
  /** Auto-refresh interval in ms (0 to disable) */
  refreshInterval?: number;
  /** Maximum events to show per chain */
  eventsPerChain?: number;
}

export default function ChainActivityViewer({
  refreshInterval = 10000,
  eventsPerChain = 10,
}: ChainActivityProps) {
  const [chains, setChains] = useState<ChainInfo[]>([]);
  const [eventsByChain, setEventsByChain] = useState<Record<string, ChainEvent[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedChains, setExpandedChains] = useState<Set<string>>(new Set());
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Load known chains on mount
  useEffect(() => {
    const knownChains = getKnownChains();
    setChains(knownChains);
    // Expand first chain by default
    if (knownChains.length > 0) {
      setExpandedChains(new Set([knownChains[0].chainId]));
    }
  }, []);

  // Fetch events from a specific chain
  const fetchChainEvents = useCallback(async (chainId: string): Promise<ChainEvent[]> => {
    const baseUrl = process.env.NEXT_PUBLIC_LINERA_SERVICE || 'http://localhost:8081';
    const appId = LINERA_CONFIG.APP_ID;

    if (!appId) {
      console.warn('[ChainActivity] APP_ID not configured');
      return [];
    }

    const endpoint = `${baseUrl}/chains/${chainId}/applications/${appId}`;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            query {
              recentEvents(limit: ${eventsPerChain}) {
                eventId
                eventType
                owner
                timestamp
                data
                chainId
              }
            }
          `,
        }),
      });

      if (!response.ok) {
        console.warn(`[ChainActivity] Failed to fetch from chain ${truncateChainId(chainId)}: ${response.status}`);
        return [];
      }

      const result = await response.json();
      return result.data?.recentEvents || [];
    } catch (err) {
      console.warn(`[ChainActivity] Error fetching from chain ${truncateChainId(chainId)}:`, err);
      return [];
    }
  }, [eventsPerChain]);

  // Fetch events from all chains
  const fetchAllEvents = useCallback(async () => {
    if (chains.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      const results: Record<string, ChainEvent[]> = {};

      // Fetch from all chains in parallel
      await Promise.all(
        chains.map(async (chain) => {
          const events = await fetchChainEvents(chain.chainId);
          results[chain.chainId] = events;
        })
      );

      setEventsByChain(results);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('[ChainActivity] Error fetching events:', err);
      setError('Failed to fetch chain activity');
    } finally {
      setLoading(false);
    }
  }, [chains, fetchChainEvents]);

  // Initial fetch and refresh interval
  useEffect(() => {
    fetchAllEvents();

    if (refreshInterval > 0) {
      const interval = setInterval(fetchAllEvents, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchAllEvents, refreshInterval]);

  // Toggle chain expansion
  const toggleChain = (chainId: string) => {
    setExpandedChains((prev) => {
      const next = new Set(prev);
      if (next.has(chainId)) {
        next.delete(chainId);
      } else {
        next.add(chainId);
      }
      return next;
    });
  };

  // Get total event count
  const totalEvents = Object.values(eventsByChain).reduce((sum, events) => sum + events.length, 0);

  // Parse and format event data
  const formatEventData = (data: string): string => {
    try {
      const parsed = JSON.parse(data);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return data;
    }
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Activity className="h-6 w-6 text-green-400" />
          Chain Activity
        </h2>
        <div className="flex items-center gap-3">
          <span className="text-gray-400 text-sm">
            {totalEvents} records across {chains.length} chain{chains.length !== 1 ? 's' : ''}
          </span>
          <button
            onClick={fetchAllEvents}
            disabled={loading}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Last refresh indicator */}
      <p className="text-gray-500 text-xs mb-4">
        Last updated: {lastRefresh.toLocaleTimeString()}
      </p>

      {/* Error state */}
      {error && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* No chains configured */}
      {chains.length === 0 && (
        <div className="text-center py-8">
          <Activity className="h-12 w-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">No chains configured</p>
          <p className="text-gray-500 text-sm mt-1">
            Set NEXT_PUBLIC_CHAIN_ID or NEXT_PUBLIC_ALL_CHAINS in your environment
          </p>
        </div>
      )}

      {/* Chain list */}
      <div className="space-y-3">
        {chains.map((chain) => {
          const events = eventsByChain[chain.chainId] || [];
          const isExpanded = expandedChains.has(chain.chainId);

          return (
            <div
              key={chain.chainId}
              className="border border-gray-700 rounded-lg overflow-hidden"
            >
              {/* Chain header */}
              <button
                onClick={() => toggleChain(chain.chainId)}
                className="w-full px-4 py-3 bg-gray-900/50 flex items-center justify-between hover:bg-gray-900/70 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      chain.status === 'active' ? 'bg-green-500' : 'bg-gray-500'
                    }`}
                  />
                  <div className="text-left">
                    <p className="text-white font-medium">{chain.name}</p>
                    <p className="text-gray-500 text-xs font-mono">
                      {truncateChainId(chain.chainId, 12)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-gray-400 text-sm">
                    {events.length} record{events.length !== 1 ? 's' : ''}
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  )}
                </div>
              </button>

              {/* Events list */}
              {isExpanded && (
                <div className="border-t border-gray-700">
                  {events.length === 0 ? (
                    <div className="px-4 py-6 text-center">
                      <p className="text-gray-500 text-sm">No records on this chain yet</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-700/50">
                      {events.map((event) => (
                        <div
                          key={event.eventId}
                          className="px-4 py-3 hover:bg-gray-800/30 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              {/* Event type badge */}
                              <div className="flex items-center gap-2 mb-1">
                                <Tag className="h-3 w-3 text-blue-400" />
                                <span className="text-blue-400 text-sm font-medium">
                                  {event.eventType}
                                </span>
                                {event.eventType.startsWith('cross_chain_') && (
                                  <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded">
                                    cross-chain
                                  </span>
                                )}
                              </div>

                              {/* Owner */}
                              <div className="flex items-center gap-2 text-gray-400 text-xs">
                                <User className="h-3 w-3" />
                                <span className="font-mono truncate">
                                  {event.owner.startsWith('chain:')
                                    ? `From: ${truncateChainId(event.owner.replace('chain:', ''), 8)}`
                                    : truncateChainId(event.owner, 12)}
                                </span>
                              </div>

                              {/* Data preview */}
                              {event.data && event.data !== '{}' && (
                                <div className="mt-2 p-2 bg-gray-900/50 rounded text-xs font-mono text-gray-400 overflow-x-auto">
                                  <pre className="whitespace-pre-wrap break-all">
                                    {formatEventData(event.data).substring(0, 200)}
                                    {event.data.length > 200 && '...'}
                                  </pre>
                                </div>
                              )}
                            </div>

                            {/* Timestamp */}
                            <div className="flex items-center gap-1 text-gray-500 text-xs whitespace-nowrap">
                              <Clock className="h-3 w-3" />
                              <span>{formatRelativeTime(event.timestamp)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Info box */}
      <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
        <p className="text-green-300 text-sm">
          📡 <strong>Live data:</strong> This shows actual records stored on each chain.
          Records are created via the form above or received from cross-chain messages.
          {refreshInterval > 0 && (
            <span> Auto-refreshes every {refreshInterval / 1000} seconds.</span>
          )}
        </p>
      </div>
    </div>
  );
}
