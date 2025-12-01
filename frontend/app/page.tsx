/**
 * FLUXERA DASHBOARD - MAIN PAGE
 *
 * This is the main dashboard that displays real-time analytics from the Fluxera WebAssembly application
 *
 * WHAT THIS PAGE DOES:
 * 1. Connects to Fluxera GraphQL API (deployed Linera WASM app)
 * 2. Fetches analytics summary, recent events, and chain metrics
 * 3. Displays data in real-time (auto-refreshes every 5 seconds)
 * 4. Shows loading states and error handling
 *
 * DATA FLOW:
 * useAnalyticsSummary() hook
 *   ↓
 * Apollo Client fetches from http://localhost:8080/.../fluxera_app
 *   ↓
 * Fluxera service.rs analytics_summary() function
 *   ↓
 * Reads blockchain state (total_event_count, unique_users, etc.)
 *   ↓
 * Returns data to component
 *   ↓
 * Component renders with live blockchain data!
 */

"use client";

import { Activity, Database, Globe, Zap, AlertCircle, Loader, TrendingUp } from "lucide-react";
import { useAnalyticsSummary, useRecentEvents, useAllChainMetrics } from "@/hooks/useFluxera";
import { FLUXERA_CONFIG } from "@/lib/constants";
import EventTrackingForm from "@/components/EventTrackingForm";
import CrossChainMessageForm from "@/components/CrossChainMessageForm";
import EventsTable from "@/components/EventsTable";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";

export default function Dashboard() {
  /**
   * FETCH DATA FROM FLUXERA WASM APP
   *
   * These hooks automatically:
   * - Fetch data from GraphQL
   * - Poll every 5 seconds for updates
   * - Handle loading and error states
   * - Cache results for performance
   */
  const { summary, loading: summaryLoading, error: summaryError } = useAnalyticsSummary();
  const { events, loading: eventsLoading, error: eventsError } = useRecentEvents({ limit: 5 });
  const { chains, loading: chainsLoading } = useAllChainMetrics();

  /**
   * FORMAT TIMESTAMP
   *
   * Converts Fluxera timestamp string to "X seconds/minutes/hours ago"
   * Timestamp format from Fluxera: "2025-11-29 07:43:39.273921"
   */
  const formatTimeAgo = (timestamp: string) => {
    try {
      const eventTime = new Date(timestamp).getTime();
      const now = Date.now();
      const diff = Math.floor((now - eventTime) / 1000); // seconds ago

      if (diff < 60) return `${diff}s ago`;
      if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
      if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
      return `${Math.floor(diff / 86400)}d ago`;
    } catch (e) {
      return timestamp; // Return original if parsing fails
    }
  };

  /**
   * TRUNCATE ADDRESS
   *
   * Shortens long addresses/chain IDs for display
   * Example: "04022f7a91f28...4c1ecaa99"
   */
  const truncateAddress = (address: string, start = 8, end = 8) => {
    if (address.length <= start + end) return address;
    return `${address.substring(0, start)}...${address.substring(address.length - end)}`;
  };

  return (
    <>
      {/* TOP NAVBAR */}
      <Navbar />

      {/* SIDEBAR */}
      <Sidebar currentPage="dashboard" />

      {/* MAIN CONTENT - FULL WIDTH */}
      <main className="ml-64 mt-16 min-h-screen bg-gray-900 text-gray-100 p-6">
        {/* ERROR MESSAGE */}
        {summaryError && (
          <div className="mb-6 flex items-center space-x-2 rounded-lg bg-red-900/20 border border-red-500/30 p-4 text-red-400">
            <AlertCircle className="h-5 w-5" />
            <div>
              <p className="font-semibold">Unable to connect to Fluxera</p>
              <p className="text-sm">Make sure Linera service is running: <code className="text-xs bg-gray-800 px-1 py-0.5 rounded">linera service --port 8080</code></p>
            </div>
          </div>
        )}

        {/* STATS CARDS */}
        <div className="mb-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* Total Events Card */}
          <div className="rounded-lg bg-gradient-to-br from-blue-900/40 to-blue-900/20 border border-blue-500/30 p-6 hover:scale-105 transition-transform">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-300">Total Events</p>
                {summaryLoading ? (
                  <div className="flex items-center space-x-2 mt-2">
                    <Loader className="h-4 w-4 animate-spin text-blue-400" />
                    <span className="text-lg text-gray-400">Loading...</span>
                  </div>
                ) : (
                  <p className="text-3xl font-bold mt-1">{summary?.totalEvents?.toLocaleString() || '0'}</p>
                )}
                <div className="flex items-center space-x-1 mt-1">
                  <TrendingUp className="h-3 w-3 text-green-400" />
                  <span className="text-xs text-green-400">On-chain verified</span>
                </div>
              </div>
              <Database className="h-12 w-12 text-blue-500/50" />
            </div>
          </div>

          {/* Unique Users Card */}
          <div className="rounded-lg bg-gradient-to-br from-green-900/40 to-green-900/20 border border-green-500/30 p-6 hover:scale-105 transition-transform">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-300">Unique Users</p>
                {summaryLoading ? (
                  <div className="flex items-center space-x-2 mt-2">
                    <Loader className="h-4 w-4 animate-spin text-green-400" />
                    <span className="text-lg text-gray-400">Loading...</span>
                  </div>
                ) : (
                  <p className="text-3xl font-bold mt-1">{summary?.uniqueUsers?.toLocaleString() || '0'}</p>
                )}
                <div className="flex items-center space-x-1 mt-1">
                  <Activity className="h-3 w-3 text-green-400" />
                  <span className="text-xs text-green-400">Active addresses</span>
                </div>
              </div>
              <Globe className="h-12 w-12 text-green-500/50" />
            </div>
          </div>

          {/* Cross-Chain Messages Card */}
          <div className="rounded-lg bg-gradient-to-br from-purple-900/40 to-purple-900/20 border border-purple-500/30 p-6 hover:scale-105 transition-transform">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-300">Cross-Chain Messages</p>
                {summaryLoading ? (
                  <div className="flex items-center space-x-2 mt-2">
                    <Loader className="h-4 w-4 animate-spin text-purple-400" />
                    <span className="text-lg text-gray-400">Loading...</span>
                  </div>
                ) : (
                  <p className="text-3xl font-bold mt-1">{summary?.totalMessages?.toLocaleString() || '0'}</p>
                )}
                <div className="flex items-center space-x-1 mt-1">
                  <Zap className="h-3 w-3 text-purple-400" />
                  <span className="text-xs text-purple-400">Linera messaging</span>
                </div>
              </div>
              <Activity className="h-12 w-12 text-purple-500/50" />
            </div>
          </div>

          {/* Active Chains Card */}
          <div className="rounded-lg bg-gradient-to-br from-yellow-900/40 to-yellow-900/20 border border-yellow-500/30 p-6 hover:scale-105 transition-transform">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-300">Active Chains</p>
                {chainsLoading ? (
                  <div className="flex items-center space-x-2 mt-2">
                    <Loader className="h-4 w-4 animate-spin text-yellow-400" />
                    <span className="text-lg text-gray-400">Loading...</span>
                  </div>
                ) : (
                  <p className="text-3xl font-bold mt-1">{chains?.length || '1'}</p>
                )}
                <div className="flex items-center space-x-1 mt-1">
                  <Globe className="h-3 w-3 text-yellow-400" />
                  <span className="text-xs text-yellow-400">Microchains</span>
                </div>
              </div>
              <Zap className="h-12 w-12 text-yellow-500/50" />
            </div>
          </div>
        </div>

        {/* INTERACTIVE FORMS SECTION */}
        <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Event Tracking Form */}
          <EventTrackingForm />

          {/* Cross-Chain Message Form */}
          <CrossChainMessageForm />
        </div>

        {/* EVENTS TABLE WITH FILTERING */}
        <div className="mb-6">
          <EventsTable />
        </div>

        {/* RECENT EVENTS SECTION */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-lg bg-gray-800 border border-gray-700 p-6">
            <h3 className="mb-4 text-lg font-semibold flex items-center">
              <Activity className="h-5 w-5 mr-2 text-blue-400" />
              Recent Events
            </h3>
            <div className="space-y-3">
              {eventsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader className="h-6 w-6 animate-spin text-blue-400" />
                  <span className="ml-2 text-gray-400">Loading events from blockchain...</span>
                </div>
              ) : eventsError ? (
                <div className="flex items-center justify-center py-8 text-red-400">
                  <AlertCircle className="h-6 w-6" />
                  <span className="ml-2">Failed to load events</span>
                </div>
              ) : !events || events.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                  <Database className="h-12 w-12 mb-2 opacity-50" />
                  <p className="text-sm">No events tracked yet</p>
                  <p className="text-xs mt-1">Track your first event to see it here!</p>
                </div>
              ) : (
                events.map((event) => {
                  if (!event) return null;
                  return (
                    <div
                      key={event.eventId}
                      className="flex items-center justify-between rounded-lg bg-gray-700/50 border border-gray-600/50 p-4 hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></div>
                        <div>
                          <p className="text-sm font-medium text-blue-300">{event.eventType}</p>
                          <p className="text-xs text-gray-400 font-mono">
                            Owner: {truncateAddress(event.owner || '', 6, 4)}
                          </p>
                          {event.data && event.data !== '{}' && (
                            <p className="text-xs text-gray-500 mt-1">
                              Data: {event.data.length > 50 ? event.data.substring(0, 50) + '...' : event.data}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400">{formatTimeAgo(event.timestamp || '')}</p>
                        <p className="text-xs text-gray-500 font-mono">ID: {event.eventId?.split('-')[1]}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* SYSTEM INFO SECTION */}
          <div className="rounded-lg bg-gray-800 border border-gray-700 p-6">
            <h3 className="mb-4 text-lg font-semibold flex items-center">
              <Zap className="h-5 w-5 mr-2 text-yellow-400" />
              System Information
            </h3>
            <div className="space-y-3">
              {/* Fluxera Application */}
              <div className="flex items-center justify-between rounded-lg bg-gray-700/50 border border-gray-600/50 p-3">
                <div className="flex items-center space-x-3">
                  <div className={`h-2 w-2 rounded-full ${summaryError ? 'bg-red-500' : 'bg-green-500 animate-pulse'}`}></div>
                  <div>
                    <p className="text-sm font-medium">Fluxera WASM App</p>
                    <p className="text-xs text-gray-400">Linera WebAssembly</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">{summaryError ? 'Error' : 'Connected'}</p>
                  <p className="text-xs text-gray-500">GraphQL</p>
                </div>
              </div>

              {/* Chain Information */}
              <div className="flex items-center justify-between rounded-lg bg-gray-700/50 border border-gray-600/50 p-3">
                <div className="flex items-center space-x-3">
                  <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                  <div>
                    <p className="text-sm font-medium">Chain ID</p>
                    <p className="text-xs text-gray-400 font-mono">{truncateAddress(summary?.chainId || FLUXERA_CONFIG.CHAIN_ID, 12, 8)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">Active</p>
                  <p className="text-xs text-gray-500">Microchain</p>
                </div>
              </div>

              {/* Application ID */}
              <div className="flex items-center justify-between rounded-lg bg-gray-700/50 border border-gray-600/50 p-3">
                <div className="flex items-center space-x-3">
                  <div className="h-2 w-2 rounded-full bg-purple-500"></div>
                  <div>
                    <p className="text-sm font-medium">Application ID</p>
                    <p className="text-xs text-gray-400 font-mono">{truncateAddress(FLUXERA_CONFIG.APP_ID, 12, 8)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">Deployed</p>
                  <p className="text-xs text-gray-500">Fluxera</p>
                </div>
              </div>

              {/* GraphQL Endpoint */}
              <div className="flex items-center justify-between rounded-lg bg-gray-700/50 border border-gray-600/50 p-3">
                <div className="flex items-center space-x-3">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  <div>
                    <p className="text-sm font-medium">GraphQL Endpoint</p>
                    <p className="text-xs text-gray-400">{FLUXERA_CONFIG.GRAPHQL_ENDPOINT}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">Local</p>
                  <p className="text-xs text-gray-500">Port 8080</p>
                </div>
              </div>

              {/* Auto-Refresh Info */}
              <div className="flex items-center justify-between rounded-lg bg-blue-900/20 border border-blue-500/30 p-3">
                <div className="flex items-center space-x-3">
                  <Activity className="h-4 w-4 text-blue-400 animate-spin" />
                  <div>
                    <p className="text-sm font-medium text-blue-300">Auto-Refresh</p>
                    <p className="text-xs text-blue-400">Real-time polling active</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-blue-400">5s interval</p>
                  <p className="text-xs text-blue-500">Live data</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER INFO */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>
            Powered by Fluxera • Running on Linera Protocol •
            <a href="https://linera.io" target="_blank" rel="noopener noreferrer" className="ml-1 text-blue-400 hover:text-blue-300">
              Learn more →
            </a>
          </p>
        </div>
      </main>
    </>
  );
}
