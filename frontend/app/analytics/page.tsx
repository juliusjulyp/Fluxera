'use client';

import { BarChart3, TrendingUp, Database, Globe, Activity } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import ChainActivityViewer from '@/components/ChainActivityViewer';
import { useAnalyticsSummary, useChainMetrics } from '@/hooks/useFluxera';
import { LINERA_CONFIG } from '@/lib/linera-config';

export default function AnalyticsPage() {
  const { summary, loading: summaryLoading } = useAnalyticsSummary();
  const { chains, loading: chainsLoading } = useChainMetrics();

  return (
    <>
      <Navbar />
      <Sidebar currentPage="analytics" />

      <main className="ml-64 mt-16 min-h-screen bg-gray-900 text-gray-100 p-6">
        {/* Page Header */}
        <div className="mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/30">
              <BarChart3 className="h-6 w-6 text-purple-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Analytics</h1>
              <p className="text-sm text-gray-400">Network statistics and performance metrics</p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {/* Total Events */}
          <div className="rounded-xl bg-gradient-to-br from-blue-900/40 to-blue-900/20 border border-blue-500/30 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-300">Total Events</p>
                <p className="text-3xl font-bold mt-1">
                  {summaryLoading ? '...' : summary?.totalEvents?.toLocaleString() || '0'}
                </p>
              </div>
              <Database className="h-8 w-8 text-blue-400" />
            </div>
          </div>

          {/* Unique Users */}
          <div className="rounded-xl bg-gradient-to-br from-green-900/40 to-green-900/20 border border-green-500/30 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-300">Unique Users</p>
                <p className="text-3xl font-bold mt-1">
                  {summaryLoading ? '...' : summary?.uniqueUsers?.toLocaleString() || '0'}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-400" />
            </div>
          </div>

          {/* Total Messages */}
          <div className="rounded-xl bg-gradient-to-br from-purple-900/40 to-purple-900/20 border border-purple-500/30 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-300">Messages Sent</p>
                <p className="text-3xl font-bold mt-1">
                  {summaryLoading ? '...' : summary?.totalMessages?.toLocaleString() || '0'}
                </p>
              </div>
              <Activity className="h-8 w-8 text-purple-400" />
            </div>
          </div>

          {/* Active Chains */}
          <div className="rounded-xl bg-gradient-to-br from-yellow-900/40 to-yellow-900/20 border border-yellow-500/30 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-300">Active Chains</p>
                <p className="text-3xl font-bold mt-1">
                  {chainsLoading ? '...' : LINERA_CONFIG.getConfiguredChains().length || chains?.length || '1'}
                </p>
              </div>
              <Globe className="h-8 w-8 text-yellow-400" />
            </div>
          </div>
        </div>

        {/* Chain Activity */}
        <div className="mb-6">
          <ChainActivityViewer refreshInterval={10000} eventsPerChain={10} />
        </div>

        {/* Chain Metrics Table */}
        <div className="rounded-lg bg-gray-800 border border-gray-700 p-6">
          <h3 className="text-lg font-semibold mb-4">Chain Metrics</h3>
          {chainsLoading ? (
            <p className="text-gray-400">Loading chain metrics...</p>
          ) : chains.length === 0 ? (
            <p className="text-gray-400">No chain metrics available yet. Track some events to see metrics.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-gray-400 border-b border-gray-700">
                    <th className="pb-3 pr-4">Chain ID</th>
                    <th className="pb-3 pr-4">Total Events</th>
                    <th className="pb-3 pr-4">Unique Users</th>
                    <th className="pb-3">Last Activity</th>
                  </tr>
                </thead>
                <tbody>
                  {chains.map((chain) => (
                    <tr key={chain.chainId} className="border-b border-gray-700/50">
                      <td className="py-3 pr-4 font-mono text-sm text-blue-400">
                        {chain.chainId.slice(0, 12)}...
                      </td>
                      <td className="py-3 pr-4">{chain.metrics.totalEvents}</td>
                      <td className="py-3 pr-4">{chain.metrics.uniqueUsers}</td>
                      <td className="py-3 text-sm text-gray-400">{chain.metrics.lastActivity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
