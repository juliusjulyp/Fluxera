/**
 * TOP NAVIGATION BAR
 *
 * Fixed top navbar with branding, search, and wallet connection
 */

'use client';

import { useState } from 'react';
import {
  Search,
  Bell,
  Zap,
} from 'lucide-react';
import { useAnalyticsSummary } from '@/hooks/useFluxera';
import { useGlobalSearch } from '@/components/providers/SearchContext';
import WalletConnect from '@/components/WalletConnect';

export default function Navbar() {
  const [showNotifications, setShowNotifications] = useState(false);
  const { summary, error: summaryError } = useAnalyticsSummary();
  const { globalSearch, setGlobalSearch } = useGlobalSearch();

  return (
    <nav className="fixed top-0 right-0 left-0 h-16 bg-gray-900 border-b border-gray-800 z-40 flex items-center justify-between px-6">
      {/* Left Section - Logo & Brand */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Zap className="h-8 w-8 text-blue-500" />
          <div>
            <h1 className="text-xl font-bold text-white">Fluxera</h1>
            <p className="text-xs text-gray-400">Linera Analytics Platform</p>
          </div>
        </div>
      </div>

      {/* Center Section - Search */}
      <div className="flex-1 max-w-2xl mx-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            placeholder="Search events, addresses, chain IDs..."
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {globalSearch && (
            <button
              onClick={() => setGlobalSearch('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Right Section - Actions & Status */}
      <div className="flex items-center space-x-4">
        {/* Connection Status */}
        <div className="flex items-center space-x-2 px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg">
          <div className={`h-2 w-2 rounded-full ${summaryError ? 'bg-red-500' : 'bg-green-500 animate-pulse'}`}></div>
          <span className="text-sm text-gray-400">
            {summaryError ? 'Disconnected' : 'Live'}
          </span>
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <Bell className="h-5 w-5 text-gray-400" />
          </button>

          {/* Notifications Dropdown - Coming Soon */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-72 bg-gray-800 border border-gray-700 rounded-lg shadow-xl">
              <div className="p-4 border-b border-gray-700">
                <h3 className="text-sm font-semibold text-white">Notifications</h3>
              </div>
              <div className="p-8 text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-700/50 flex items-center justify-center">
                  <Bell className="h-6 w-6 text-gray-500" />
                </div>
                <p className="text-gray-400 text-sm font-medium">Coming Soon</p>
                <p className="text-gray-500 text-xs mt-1">Real-time block notifications will appear here</p>
              </div>
            </div>
          )}
        </div>

        {/* Wallet Connect */}
        <WalletConnect />
      </div>
    </nav>
  );
}
