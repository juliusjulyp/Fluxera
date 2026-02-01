'use client';

import { Globe, Activity, MessageSquare, Clock } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { useRegisteredChains, useChainMetrics, truncateAddress } from '@/hooks/useFluxera';
import { LINERA_CONFIG } from '@/lib/linera-config';

export default function ChainsPage() {
  const { chains: registeredChains, loading: registeredLoading } = useRegisteredChains();
  const { chains: chainMetrics, loading: metricsLoading } = useChainMetrics();

  const configuredChains = LINERA_CONFIG.getConfiguredChains();

  return (
    <>
      <Navbar />
      <Sidebar currentPage="chains" />

      <main className="ml-64 mt-16 min-h-screen bg-gray-900 text-gray-100 p-6">
        {/* Page Header */}
        <div className="mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
              <Globe className="h-6 w-6 text-yellow-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Chains</h1>
              <p className="text-sm text-gray-400">Manage and monitor Fluxera microchains</p>
            </div>
          </div>
        </div>

        {/* Configured Chains */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4">Configured Chains ({configuredChains.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {configuredChains.length === 0 ? (
              <p className="text-gray-400 col-span-full">No chains configured in environment</p>
            ) : (
              configuredChains.map((chainId, index) => {
                const metrics = chainMetrics.find(c => c.chainId === chainId);
                const isPrimary = chainId === LINERA_CONFIG.CHAIN_ID;

                return (
                  <div
                    key={chainId}
                    className={`rounded-xl p-5 border ${
                      isPrimary
                        ? 'bg-gradient-to-br from-blue-900/40 to-blue-900/20 border-blue-500/30'
                        : 'bg-gray-800 border-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-sm font-medium ${isPrimary ? 'text-blue-300' : 'text-gray-300'}`}>
                        Chain {index + 1} {isPrimary && '(Primary)'}
                      </span>
                      <div className="flex items-center space-x-1">
                        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-xs text-green-400">Active</span>
                      </div>
                    </div>
                    <p className="font-mono text-xs text-gray-400 mb-3 break-all">
                      {chainId}
                    </p>
                    {metrics && (
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center space-x-1 text-gray-400">
                          <Activity className="h-3 w-3" />
                          <span>{metrics.metrics.totalEvents} events</span>
                        </div>
                        <div className="flex items-center space-x-1 text-gray-400">
                          <Globe className="h-3 w-3" />
                          <span>{metrics.metrics.uniqueUsers} users</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Registered Chains */}
        <div className="rounded-lg bg-gray-800 border border-gray-700 p-6">
          <h3 className="text-lg font-semibold mb-4">Registered Chains</h3>
          {registeredLoading ? (
            <p className="text-gray-400">Loading registered chains...</p>
          ) : registeredChains.length === 0 ? (
            <div className="text-center py-8">
              <Globe className="h-12 w-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">No chains registered yet</p>
              <p className="text-sm text-gray-500 mt-1">
                Chains are registered when they join the Fluxera network
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-gray-400 border-b border-gray-700">
                    <th className="pb-3 pr-4">Name</th>
                    <th className="pb-3 pr-4">Chain ID</th>
                    <th className="pb-3 pr-4">Messages Sent</th>
                    <th className="pb-3 pr-4">Messages Received</th>
                    <th className="pb-3">Registered At</th>
                  </tr>
                </thead>
                <tbody>
                  {registeredChains.map((chain) => (
                    <tr key={chain.chainId} className="border-b border-gray-700/50">
                      <td className="py-3 pr-4 font-medium">{chain.name}</td>
                      <td className="py-3 pr-4 font-mono text-sm text-blue-400">
                        {truncateAddress(chain.chainId, 8)}
                      </td>
                      <td className="py-3 pr-4">{chain.messagesSent}</td>
                      <td className="py-3 pr-4">{chain.messagesReceived}</td>
                      <td className="py-3 text-sm text-gray-400">{chain.registeredAt}</td>
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
