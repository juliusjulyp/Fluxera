'use client';

import { Settings, Globe, Database, Zap, RefreshCw } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { LINERA_CONFIG } from '@/lib/linera-config';
import { isLocalTestingMode, getServiceEndpoint } from '@/lib/public-client';
import { truncateAddress } from '@/hooks/useFluxera';

export default function SettingsPage() {
  const isLocal = isLocalTestingMode();
  const serviceEndpoint = getServiceEndpoint();
  const configuredChains = LINERA_CONFIG.getConfiguredChains();

  return (
    <>
      <Navbar />
      <Sidebar currentPage="settings" />

      <main className="ml-64 mt-16 min-h-screen bg-gray-900 text-gray-100 p-6">
        {/* Page Header */}
        <div className="mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-xl bg-gray-500/10 border border-gray-500/30">
              <Settings className="h-6 w-6 text-gray-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Settings</h1>
              <p className="text-sm text-gray-400">Application configuration and status</p>
            </div>
          </div>
        </div>

        {/* Network Status */}
        <div className="mb-6 rounded-lg bg-gray-800 border border-gray-700 p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Globe className="h-5 w-5 mr-2 text-blue-400" />
            Network Configuration
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
              <div>
                <p className="font-medium">Network Mode</p>
                <p className="text-sm text-gray-400">Current operating environment</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                isLocal
                  ? 'bg-yellow-500/20 text-yellow-400'
                  : 'bg-green-500/20 text-green-400'
              }`}>
                {isLocal ? 'Local Development' : 'Production (Conway)'}
              </span>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
              <div>
                <p className="font-medium">Linera Service</p>
                <p className="text-sm text-gray-400 font-mono">{serviceEndpoint}</p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm text-green-400">Connected</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
              <div>
                <p className="font-medium">Faucet URL</p>
                <p className="text-sm text-gray-400 font-mono">{LINERA_CONFIG.FAUCET_URL}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Application Config */}
        <div className="mb-6 rounded-lg bg-gray-800 border border-gray-700 p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Database className="h-5 w-5 mr-2 text-purple-400" />
            Application Configuration
          </h3>
          <div className="space-y-4">
            <div className="p-4 bg-gray-700/50 rounded-lg">
              <p className="font-medium mb-2">Primary Chain ID</p>
              <p className="text-sm text-gray-400 font-mono break-all">
                {LINERA_CONFIG.CHAIN_ID || 'Not configured'}
              </p>
            </div>

            <div className="p-4 bg-gray-700/50 rounded-lg">
              <p className="font-medium mb-2">Application ID</p>
              <p className="text-sm text-gray-400 font-mono break-all">
                {LINERA_CONFIG.APP_ID || 'Not configured'}
              </p>
            </div>

            <div className="p-4 bg-gray-700/50 rounded-lg">
              <p className="font-medium mb-2">Configured Chains ({configuredChains.length})</p>
              <div className="space-y-2 mt-2">
                {configuredChains.length === 0 ? (
                  <p className="text-sm text-gray-500">No chains configured</p>
                ) : (
                  configuredChains.map((chainId, index) => (
                    <div key={chainId} className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Chain {index + 1}</span>
                      <span className="font-mono text-blue-400">{truncateAddress(chainId, 10)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Indexer Config */}
        <div className="mb-6 rounded-lg bg-gray-800 border border-gray-700 p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Zap className="h-5 w-5 mr-2 text-yellow-400" />
            Indexer Configuration
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
              <div>
                <p className="font-medium">Indexer REST API</p>
                <p className="text-sm text-gray-400 font-mono">{LINERA_CONFIG.INDEXER_URL}</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
              <div>
                <p className="font-medium">Indexer WebSocket</p>
                <p className="text-sm text-gray-400 font-mono">{LINERA_CONFIG.INDEXER_WS_URL}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="rounded-lg bg-gray-800 border border-gray-700 p-6">
          <h3 className="text-lg font-semibold mb-4">Actions</h3>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => window.location.reload()}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Refresh App</span>
            </button>
            <button
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 rounded-lg transition-colors"
            >
              <span>Clear Local Storage</span>
            </button>
          </div>
        </div>
      </main>
    </>
  );
}
