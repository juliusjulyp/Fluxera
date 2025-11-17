"use client";

import { Activity, Database, Globe, Zap, AlertCircle, Loader } from "lucide-react";
import { useApiConnection, useStats, useRecentEvents, useHealth } from "@/hooks/useFluxeraData";
import { useWebSocket, WebSocketStatus } from "@/hooks/useWebSocket";

export default function Dashboard() {
  // Fetch real data from Fluxera API
  const { isConnected, isChecking } = useApiConnection();
  const { data: healthData, loading: healthLoading, error: healthError } = useHealth();
  const { data: statsData, loading: statsLoading, error: statsError } = useStats();
  const { data: recentEvents, loading: eventsLoading, error: eventsError } = useRecentEvents();

  // WebSocket connection for real-time event streaming
  const {
    status: wsStatus,
    events: wsEvents,
    latestEvent,
    eventCount: wsEventCount,
    reconnectAttempts,
  } = useWebSocket('ws://localhost:3001/ws', true);

  // Connection status indicator
  const connectionStatus = isChecking ? (
    <>
      <Loader className="h-2 w-2 animate-spin" />
      <span className="text-sm text-gray-400">Connecting...</span>
    </>
  ) : isConnected ? (
    <>
      <div className="h-2 w-2 rounded-full bg-green-500"></div>
      <span className="text-sm text-gray-400">Connected</span>
    </>
  ) : (
    <>
      <div className="h-2 w-2 rounded-full bg-red-500"></div>
      <span className="text-sm text-gray-400">Disconnected</span>
    </>
  );

  // Format timestamp for display
  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = Math.floor((now - timestamp) / 1000); // seconds ago
    
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <Zap className="h-8 w-8 text-blue-500" />
              <span className="ml-2 text-xl font-bold">Fluxera</span>
              <span className="ml-2 text-sm text-gray-400">Dashboard</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                {connectionStatus}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Linera Microchain Monitor</h1>
          <p className="text-gray-400">Real-time indexing and analytics for your microchain ecosystem</p>
          {!isConnected && !isChecking && (
            <div className="mt-2 flex items-center space-x-2 text-red-400">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">Unable to connect to Fluxera indexer. Make sure it's running on port 3001.</span>
            </div>
          )}
        </div>

        <div className="mb-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* Total Events Card */}
          <div className="rounded-lg bg-gray-800 p-6">
            <div className="flex items-center">
              <Database className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Total Events</p>
                {statsLoading ? (
                  <div className="flex items-center space-x-2">
                    <Loader className="h-4 w-4 animate-spin" />
                    <span className="text-lg text-gray-400">Loading...</span>
                  </div>
                ) : statsError ? (
                  <p className="text-lg text-red-400">Error</p>
                ) : (
                  <p className="text-2xl font-bold">{statsData?.total_events?.toLocaleString() || '0'}</p>
                )}
              </div>
            </div>
          </div>

          {/* Active Microchains Card */}
          <div className="rounded-lg bg-gray-800 p-6">
            <div className="flex items-center">
              <Globe className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Active Microchains</p>
                {statsLoading ? (
                  <div className="flex items-center space-x-2">
                    <Loader className="h-4 w-4 animate-spin" />
                    <span className="text-lg text-gray-400">Loading...</span>
                  </div>
                ) : statsError ? (
                  <p className="text-lg text-red-400">Error</p>
                ) : (
                  <p className="text-2xl font-bold">{statsData?.unique_microchains || '0'}</p>
                )}
              </div>
            </div>
          </div>

          {/* Database Status Card */}
          <div className="rounded-lg bg-gray-800 p-6">
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-yellow-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Database</p>
                {healthLoading ? (
                  <div className="flex items-center space-x-2">
                    <Loader className="h-4 w-4 animate-spin" />
                    <span className="text-lg text-gray-400">Checking...</span>
                  </div>
                ) : healthError ? (
                  <p className="text-lg text-red-400">Error</p>
                ) : (
                  <p className="text-2xl font-bold capitalize">{healthData?.database || 'Unknown'}</p>
                )}
              </div>
            </div>
          </div>

          {/* Latest Block Card */}
          <div className="rounded-lg bg-gray-800 p-6">
            <div className="flex items-center">
              <Zap className="h-8 w-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Latest Block</p>
                {statsLoading ? (
                  <div className="flex items-center space-x-2">
                    <Loader className="h-4 w-4 animate-spin" />
                    <span className="text-lg text-gray-400">Loading...</span>
                  </div>
                ) : statsError ? (
                  <p className="text-lg text-red-400">Error</p>
                ) : (
                  <p className="text-2xl font-bold">
                    {statsData?.latest_block_height ? `#${statsData.latest_block_height}` : 'None'}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-lg bg-gray-800 p-6">
            <h3 className="mb-4 text-lg font-semibold">Recent Events</h3>
            <div className="space-y-3">
              {eventsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader className="h-6 w-6 animate-spin" />
                  <span className="ml-2 text-gray-400">Loading events...</span>
                </div>
              ) : eventsError ? (
                <div className="flex items-center justify-center py-8 text-red-400">
                  <AlertCircle className="h-6 w-6" />
                  <span className="ml-2">Failed to load events</span>
                </div>
              ) : !recentEvents || recentEvents.length === 0 ? (
                <div className="flex items-center justify-center py-8 text-gray-400">
                  <Database className="h-6 w-6" />
                  <span className="ml-2">No events yet - indexer is waiting for blockchain activity</span>
                </div>
              ) : (
                recentEvents.slice(0, 4).map((event) => (
                  <div key={event.id} className="flex items-center justify-between rounded-lg bg-gray-700/50 p-3">
                    <div className="flex items-center space-x-3">
                      <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                      <div>
                        <p className="text-sm font-medium">{event.event_type}</p>
                        <p className="text-xs text-gray-400 font-mono">
                          Chain: {event.microchain_id.substring(0, 8)}...{event.microchain_id.substring(event.microchain_id.length - 4)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">{formatTimeAgo(event.timestamp)}</p>
                      <p className="text-xs text-gray-500">#{event.block_height}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-lg bg-gray-800 p-6">
            <h3 className="mb-4 text-lg font-semibold">System Status</h3>
            <div className="space-y-3">
              {/* Connection Status */}
              <div className="flex items-center justify-between rounded-lg bg-gray-700/50 p-3">
                <div className="flex items-center space-x-3">
                  <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <div>
                    <p className="text-sm font-medium">Fluxera Indexer</p>
                    <p className="text-xs text-gray-400">REST API Connection</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">{isConnected ? 'Connected' : 'Disconnected'}</p>
                  <p className="text-xs text-gray-500">Port 3001</p>
                </div>
              </div>

              {/* Database Status */}
              <div className="flex items-center justify-between rounded-lg bg-gray-700/50 p-3">
                <div className="flex items-center space-x-3">
                  <div className={`h-2 w-2 rounded-full ${healthData?.database === 'connected' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                  <div>
                    <p className="text-sm font-medium">Database</p>
                    <p className="text-xs text-gray-400">SQLite Storage</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400 capitalize">{healthData?.database || 'Unknown'}</p>
                  <p className="text-xs text-gray-500">Local</p>
                </div>
              </div>

              {/* Linera Service Status */}
              <div className="flex items-center justify-between rounded-lg bg-gray-700/50 p-3">
                <div className="flex items-center space-x-3">
                  <div className={`h-2 w-2 rounded-full ${healthData?.status === 'healthy' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                  <div>
                    <p className="text-sm font-medium">Linera GraphQL</p>
                    <p className="text-xs text-gray-400">Blockchain Service</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400 capitalize">{healthData?.status || 'Unknown'}</p>
                  <p className="text-xs text-gray-500">Port 8080</p>
                </div>
              </div>

              {/* Event Processing Status */}
              <div className="flex items-center justify-between rounded-lg bg-gray-700/50 p-3">
                <div className="flex items-center space-x-3">
                  <div className={`h-2 w-2 rounded-full ${(statsData?.total_events || 0) > 0 ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                  <div>
                    <p className="text-sm font-medium">Event Processing</p>
                    <p className="text-xs text-gray-400">Blockchain Indexing</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">
                    {(statsData?.total_events || 0) > 0 ? 'Active' : 'Waiting for events'}
                  </p>
                  <p className="text-xs text-gray-500">{statsData?.total_events || 0} total</p>
                </div>
              </div>

              {/* WebSocket Real-Time Stream Status */}
              <div className="flex items-center justify-between rounded-lg bg-gray-700/50 p-3 border border-blue-500/20">
                <div className="flex items-center space-x-3">
                  <div className={`h-2 w-2 rounded-full ${
                    wsStatus === WebSocketStatus.CONNECTED ? 'bg-green-500 animate-pulse' :
                    wsStatus === WebSocketStatus.CONNECTING || wsStatus === WebSocketStatus.RECONNECTING ? 'bg-yellow-500 animate-pulse' :
                    wsStatus === WebSocketStatus.ERROR ? 'bg-red-500' :
                    'bg-gray-500'
                  }`}></div>
                  <div>
                    <p className="text-sm font-medium">WebSocket Stream</p>
                    <p className="text-xs text-gray-400">Real-Time Events</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400 capitalize">
                    {wsStatus === WebSocketStatus.RECONNECTING ? `Reconnecting (${reconnectAttempts})` : wsStatus}
                  </p>
                  <p className="text-xs text-gray-500">{wsEventCount} received</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Real-Time Events Section - Only shown if WebSocket has events */}
        {wsEvents.length > 0 && (
          <div className="mt-6 rounded-lg bg-gradient-to-r from-blue-900/20 to-purple-900/20 p-6 border border-blue-500/30">
            <h3 className="mb-4 text-lg font-semibold flex items-center">
              <Zap className="h-5 w-5 mr-2 text-blue-400 animate-pulse" />
              Live Event Stream
              <span className="ml-2 text-xs px-2 py-1 rounded bg-blue-500/20 text-blue-300">REAL-TIME</span>
            </h3>
            <div className="space-y-3">
              {wsEvents.slice(0, 5).map((event) => (
                <div key={event.id} className="flex items-center justify-between rounded-lg bg-gray-800/50 p-3 border-l-2 border-blue-500">
                  <div className="flex items-center space-x-3">
                    <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></div>
                    <div>
                      <p className="text-sm font-medium text-blue-300">{event.event_type}</p>
                      <p className="text-xs text-gray-400 font-mono">
                        Chain: {event.microchain_id.substring(0, 8)}...{event.microchain_id.substring(event.microchain_id.length - 4)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">{formatTimeAgo(event.timestamp)}</p>
                    <p className="text-xs text-gray-500">#{event.block_height}</p>
                  </div>
                </div>
              ))}
            </div>
            {latestEvent && (
              <div className="mt-4 pt-4 border-t border-gray-700">
                <p className="text-xs text-gray-400">
                  Latest: <span className="text-blue-400 font-mono">{latestEvent.id.substring(0, 16)}...</span>
                  <span className="ml-2">received {formatTimeAgo(latestEvent.timestamp)}</span>
                </p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
