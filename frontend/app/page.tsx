/**
 * FLUXERA DASHBOARD - MAIN PAGE
 *
 * Real-time analytics dashboard for the Linera blockchain.
 *
 * DUAL-MODE ARCHITECTURE:
 * - Public Mode: View stats, events, messages without wallet connection
 * - Wallet Mode: Track events and send cross-chain messages
 *
 * DATA FLOW:
 * Public hooks (useAnalyticsSummary, useRecentEvents, etc.)
 *   ↓
 * Public client fetches from Conway testnet GraphQL endpoint
 *   ↓
 * Fluxera WASM app processes queries
 *   ↓
 * Returns blockchain state data
 *   ↓
 * Components render with live data!
 */

"use client";

import { Activity, Database, Globe, Zap, AlertCircle, Loader, TrendingUp, Wallet } from "lucide-react";
import {
  useAnalyticsSummary,
  useRecentEvents,
  useChainMetrics,
  truncateAddress,
  formatRelativeTime,
} from "@/hooks/useFluxera";
import { useWallet } from "@/components/providers/LineraProvider";
import { LINERA_CONFIG } from "@/lib/linera-config";
import { getQueryChainId } from "@/lib/public-client";
import EventTrackingForm from "@/components/EventTrackingForm";
import CrossChainMessageForm from "@/components/CrossChainMessageForm";
import EventsTable from "@/components/EventsTable";
import MessageTracer from "@/components/MessageTracer";
import ValidatorStatus from "@/components/ValidatorStatus";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";

export default function Dashboard() {
  // Wallet state (for showing connect prompt on forms)
  const { isConnected, chainId: walletChainId } = useWallet();

  // Get current query chain (wallet chain if connected, otherwise default)
  const queryChainId = getQueryChainId();

  /**
   * PUBLIC DATA HOOKS
   * These work without wallet connection - anyone can view
   */
  const { summary, loading: summaryLoading, error: summaryError } = useAnalyticsSummary();
  const { events, loading: eventsLoading, error: eventsError } = useRecentEvents(5);
  const { chains, loading: chainsLoading } = useChainMetrics();

  return (
    <>
      {/* TOP NAVBAR */}
      <Navbar />

      {/* SIDEBAR */}
      <Sidebar currentPage="dashboard" />

      {/* MAIN CONTENT */}
      <main className="ml-64 mt-16 min-h-screen bg-gray-900 text-gray-100 p-6">
        {/* CONNECTION STATUS BANNER */}
        {summaryError && (
          <div className="mb-6 flex items-center space-x-2 rounded-lg bg-red-900/20 border border-red-500/30 p-4 text-red-400">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <div>
              <p className="font-semibold">Unable to connect to Fluxera</p>
              <p className="text-sm">
                Make sure the Fluxera app is deployed on Conway testnet and CHAIN_ID/APP_ID are configured in .env.local
              </p>
            </div>
          </div>
        )}

        {/* CHAIN QUERY INDICATOR */}
        {isConnected && walletChainId && (
          <div className="mb-6 flex items-center justify-between rounded-lg bg-green-900/20 border border-green-500/30 p-4">
            <div className="flex items-center space-x-3">
              <Database className="h-5 w-5 text-green-400" />
              <div>
                <p className="text-sm font-medium text-green-300">Querying Your Chain</p>
                <p className="text-xs text-green-400/70 font-mono">
                  {truncateAddress(walletChainId, 10)}
                </p>
              </div>
            </div>
            <div className="text-xs text-green-400/70">
              Track events to see them in the explorer below
            </div>
          </div>
        )}

        {/* WALLET CONNECTION PROMPT (when not connected) */}
        {!isConnected && (
          <div className="mb-6 flex items-center justify-between rounded-lg bg-blue-900/20 border border-blue-500/30 p-4">
            <div className="flex items-center space-x-3">
              <Wallet className="h-5 w-5 text-blue-400" />
              <div>
                <p className="text-sm font-medium text-blue-300">Viewing in Public Mode</p>
                <p className="text-xs text-blue-400/70">Connect a wallet to track events and send messages</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-xs text-blue-400">
              <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
              <span>Conway Testnet</span>
            </div>
          </div>
        )}

        {/* STATS CARDS */}
        <div className="mb-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* Total Events Card */}
          <div className="group relative rounded-xl bg-gradient-to-br from-blue-900/40 to-blue-900/20 border border-blue-500/30 p-6 hover:border-blue-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10">
            {/* Glow effect */}
            <div className="absolute inset-0 rounded-xl bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-300">Total Events</p>
                {summaryLoading ? (
                  <div className="flex items-center space-x-2 mt-2">
                    <Loader className="h-4 w-4 animate-spin text-blue-400" />
                    <span className="text-lg text-gray-400">Loading...</span>
                  </div>
                ) : (
                  <p className="text-3xl font-bold mt-1 tabular-nums">{summary?.totalEvents?.toLocaleString() || '0'}</p>
                )}
                <div className="flex items-center space-x-1 mt-2">
                  <TrendingUp className="h-3 w-3 text-green-400" />
                  <span className="text-xs text-green-400">On-chain verified</span>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                <Database className="h-8 w-8 text-blue-400" />
              </div>
            </div>
          </div>

          {/* Unique Users Card */}
          <div className="group relative rounded-xl bg-gradient-to-br from-green-900/40 to-green-900/20 border border-green-500/30 p-6 hover:border-green-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/10">
            <div className="absolute inset-0 rounded-xl bg-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-300">Unique Users</p>
                {summaryLoading ? (
                  <div className="flex items-center space-x-2 mt-2">
                    <Loader className="h-4 w-4 animate-spin text-green-400" />
                    <span className="text-lg text-gray-400">Loading...</span>
                  </div>
                ) : (
                  <p className="text-3xl font-bold mt-1 tabular-nums">{summary?.uniqueUsers?.toLocaleString() || '0'}</p>
                )}
                <div className="flex items-center space-x-1 mt-2">
                  <Activity className="h-3 w-3 text-green-400" />
                  <span className="text-xs text-green-400">Active addresses</span>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-green-500/10 group-hover:bg-green-500/20 transition-colors">
                <Globe className="h-8 w-8 text-green-400" />
              </div>
            </div>
          </div>

          {/* Cross-Chain Messages Card */}
          <div className="group relative rounded-xl bg-gradient-to-br from-purple-900/40 to-purple-900/20 border border-purple-500/30 p-6 hover:border-purple-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10">
            <div className="absolute inset-0 rounded-xl bg-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-300">Cross-Chain Messages</p>
                {summaryLoading ? (
                  <div className="flex items-center space-x-2 mt-2">
                    <Loader className="h-4 w-4 animate-spin text-purple-400" />
                    <span className="text-lg text-gray-400">Loading...</span>
                  </div>
                ) : (
                  <p className="text-3xl font-bold mt-1 tabular-nums">{summary?.totalMessages?.toLocaleString() || '0'}</p>
                )}
                <div className="flex items-center space-x-1 mt-2">
                  <Zap className="h-3 w-3 text-purple-400" />
                  <span className="text-xs text-purple-400">Linera messaging</span>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors">
                <Activity className="h-8 w-8 text-purple-400" />
              </div>
            </div>
          </div>

          {/* Active Chains Card */}
          <div className="group relative rounded-xl bg-gradient-to-br from-yellow-900/40 to-yellow-900/20 border border-yellow-500/30 p-6 hover:border-yellow-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-yellow-500/10">
            <div className="absolute inset-0 rounded-xl bg-yellow-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-300">Active Chains</p>
                {chainsLoading ? (
                  <div className="flex items-center space-x-2 mt-2">
                    <Loader className="h-4 w-4 animate-spin text-yellow-400" />
                    <span className="text-lg text-gray-400">Loading...</span>
                  </div>
                ) : (
                  <p className="text-3xl font-bold mt-1 tabular-nums">{chains?.length || '1'}</p>
                )}
                <div className="flex items-center space-x-1 mt-2">
                  <Globe className="h-3 w-3 text-yellow-400" />
                  <span className="text-xs text-yellow-400">Microchains</span>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-yellow-500/10 group-hover:bg-yellow-500/20 transition-colors">
                <Zap className="h-8 w-8 text-yellow-400" />
              </div>
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

        {/* MESSAGE TRACER - Cross-chain message visualization */}
        <div className="mb-6">
          <MessageTracer limit={5} refreshInterval={5000} />
        </div>

        {/* EVENTS TABLE WITH FILTERING */}
        <div className="mb-6">
          <EventsTable />
        </div>

        {/* VALIDATOR STATUS */}
        <div className="mb-6">
          <ValidatorStatus />
        </div>

        {/* RECENT EVENTS & SYSTEM INFO SECTION */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Recent Events */}
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
                <div className="flex flex-col items-center justify-center py-8">
                  {/* Animated placeholder */}
                  <div className="relative mb-3">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 flex items-center justify-center">
                      <Database className="h-7 w-7 text-blue-500/40" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-blue-500/20 animate-ping" />
                  </div>
                  <p className="text-sm text-gray-400 font-medium">No events tracked yet</p>
                  <p className="text-xs text-gray-500 mt-1 text-center">
                    {isConnected ? 'Track your first event using the form above!' : 'Connect wallet to start tracking'}
                  </p>
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
                            Owner: {truncateAddress(event.owner || '', 6)}
                          </p>
                          {event.data && event.data !== '{}' && (
                            <p className="text-xs text-gray-500 mt-1">
                              Data: {event.data.length > 50 ? event.data.substring(0, 50) + '...' : event.data}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400">{formatRelativeTime(event.timestamp || '')}</p>
                        <p className="text-xs text-gray-500 font-mono">ID: {event.eventId?.split('-')[1] || event.eventId?.slice(0, 8)}</p>
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
              {/* Network */}
              <div className="flex items-center justify-between rounded-lg bg-gray-700/50 border border-gray-600/50 p-3">
                <div className="flex items-center space-x-3">
                  <div className={`h-2 w-2 rounded-full ${summaryError ? 'bg-red-500' : 'bg-green-500 animate-pulse'}`}></div>
                  <div>
                    <p className="text-sm font-medium">Network</p>
                    <p className="text-xs text-gray-400">Conway Testnet</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">{summaryError ? 'Error' : 'Connected'}</p>
                  <p className="text-xs text-gray-500">Linera Protocol</p>
                </div>
              </div>

              {/* Chain Information */}
              <div className="flex items-center justify-between rounded-lg bg-gray-700/50 border border-gray-600/50 p-3">
                <div className="flex items-center space-x-3">
                  <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                  <div>
                    <p className="text-sm font-medium">Chain ID</p>
                    <p className="text-xs text-gray-400 font-mono">
                      {truncateAddress(summary?.chainId || LINERA_CONFIG.CHAIN_ID || 'Not configured', 12)}
                    </p>
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
                    <p className="text-xs text-gray-400 font-mono">
                      {truncateAddress(LINERA_CONFIG.APP_ID || 'Not configured', 12)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">Deployed</p>
                  <p className="text-xs text-gray-500">Fluxera</p>
                </div>
              </div>

              {/* Faucet URL */}
              <div className="flex items-center justify-between rounded-lg bg-gray-700/50 border border-gray-600/50 p-3">
                <div className="flex items-center space-x-3">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  <div>
                    <p className="text-sm font-medium">Faucet</p>
                    <p className="text-xs text-gray-400">{LINERA_CONFIG.FAUCET_URL}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">Active</p>
                  <p className="text-xs text-gray-500">Free tokens</p>
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
            Powered by Fluxera • Running on Linera Protocol (Conway Testnet) •
            <a href="https://linera.io" target="_blank" rel="noopener noreferrer" className="ml-1 text-blue-400 hover:text-blue-300">
              Learn more →
            </a>
          </p>
        </div>
      </main>
    </>
  );
}
