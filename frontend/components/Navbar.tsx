/**
 * TOP NAVIGATION BAR
 *
 * Fixed top navbar with branding, search, and user actions
 */

'use client';

import { useState } from 'react';
import {
  Search,
  Bell,
  User,
  Settings,
  LogOut,
  ChevronDown,
  Zap,
} from 'lucide-react';
import { useAnalyticsSummary } from '@/hooks/useFluxera';

export default function Navbar() {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const { summary, error: summaryError } = useAnalyticsSummary();

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
            placeholder="Search events, addresses, chain IDs..."
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
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
            {/* Notification badge */}
            <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-gray-800 border border-gray-700 rounded-lg shadow-xl">
              <div className="p-4 border-b border-gray-700">
                <h3 className="text-sm font-semibold text-white">Notifications</h3>
              </div>
              <div className="max-h-96 overflow-y-auto">
                <div className="p-4 hover:bg-gray-700/50 border-b border-gray-700 cursor-pointer">
                  <div className="flex items-start space-x-3">
                    <div className="h-2 w-2 mt-1.5 rounded-full bg-blue-500"></div>
                    <div className="flex-1">
                      <p className="text-sm text-white">New event tracked</p>
                      <p className="text-xs text-gray-400 mt-1">button_click event from 0x2db...</p>
                      <p className="text-xs text-gray-500 mt-1">2 minutes ago</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 hover:bg-gray-700/50 border-b border-gray-700 cursor-pointer">
                  <div className="flex items-start space-x-3">
                    <div className="h-2 w-2 mt-1.5 rounded-full bg-purple-500"></div>
                    <div className="flex-1">
                      <p className="text-sm text-white">Cross-chain message sent</p>
                      <p className="text-xs text-gray-400 mt-1">Analytics sync to chain 040...</p>
                      <p className="text-xs text-gray-500 mt-1">15 minutes ago</p>
                    </div>
                  </div>
                </div>
                <div className="p-3 text-center border-t border-gray-700">
                  <button className="text-sm text-blue-400 hover:text-blue-300">
                    View all notifications
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center space-x-2 px-3 py-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-white" />
            </div>
            <div className="text-left hidden md:block">
              <p className="text-sm font-medium text-white">Admin</p>
              <p className="text-xs text-gray-400">0x2db...eaa9</p>
            </div>
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </button>

          {/* User Dropdown */}
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-gray-800 border border-gray-700 rounded-lg shadow-xl">
              <div className="p-4 border-b border-gray-700">
                <p className="text-sm font-semibold text-white">Admin User</p>
                <p className="text-xs text-gray-400 font-mono mt-1">0x2db...eaa9</p>
              </div>
              <div className="py-2">
                <button className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700/50 flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span>Profile</span>
                </button>
                <button className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700/50 flex items-center space-x-2">
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </button>
              </div>
              <div className="border-t border-gray-700 py-2">
                <button className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-gray-700/50 flex items-center space-x-2">
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
