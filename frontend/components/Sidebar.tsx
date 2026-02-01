/**
 * SIDEBAR NAVIGATION
 *
 * Left sidebar with navigation and quick stats
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  BarChart3,
  Database,
  MessageSquare,
  Settings,
  Menu,
  X,
  Globe,
  TrendingUp,
  FileText,
  Home
} from 'lucide-react';
import { useAnalyticsSummary } from '@/hooks/useFluxera';
import { LINERA_CONFIG } from '@/lib/linera-config';

interface SidebarProps {
  currentPage?: string;
}

export default function Sidebar({ currentPage = 'dashboard' }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { summary } = useAnalyticsSummary();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, href: '/' },
    { id: 'events', label: 'Events', icon: Activity, href: '/events' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, href: '/analytics' },
    { id: 'messages', label: 'Messages', icon: MessageSquare, href: '/messages' },
    { id: 'chains', label: 'Chains', icon: Globe, href: '/chains' },
    { id: 'docs', label: 'Documentation', icon: FileText, href: '/docs' },
    { id: 'settings', label: 'Settings', icon: Settings, href: '/settings' },
  ];

  const truncateAddress = (address: string, start = 6, end = 4) => {
    if (!address || address.length <= start + end) return address;
    return `${address.slice(0, start)}...${address.slice(-end)}`;
  };

  return (
    <>
      {/* Sidebar - Positioned below navbar */}
      <aside
        className={`fixed left-0 top-16 h-[calc(100vh-4rem)] bg-gray-900 border-r border-gray-800 transition-all duration-300 z-30 ${
          isCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        {/* Toggle Button */}
        <div className="flex items-center justify-end p-3 border-b border-gray-800">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            {isCollapsed ? (
              <Menu className="h-5 w-5 text-gray-400" />
            ) : (
              <X className="h-5 w-5 text-gray-400" />
            )}
          </button>
        </div>

        {/* Quick Stats */}
        {!isCollapsed && (
          <div className="p-4 border-b border-gray-800">
            <div className="space-y-3">
              {/* Total Events */}
              <div className="flex items-center justify-between p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <div>
                  <p className="text-xs text-blue-400">Total Events</p>
                  <p className="text-lg font-bold text-white">
                    {summary?.totalEvents?.toLocaleString() || '0'}
                  </p>
                </div>
                <Database className="h-6 w-6 text-blue-500" />
              </div>

              {/* Unique Users */}
              <div className="flex items-center justify-between p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                <div>
                  <p className="text-xs text-green-400">Unique Users</p>
                  <p className="text-lg font-bold text-white">
                    {summary?.uniqueUsers?.toLocaleString() || '0'}
                  </p>
                </div>
                <TrendingUp className="h-6 w-6 text-green-500" />
              </div>

              {/* Messages */}
              <div className="flex items-center justify-between p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                <div>
                  <p className="text-xs text-purple-400">Messages</p>
                  <p className="text-lg font-bold text-white">
                    {summary?.totalMessages?.toLocaleString() || '0'}
                  </p>
                </div>
                <MessageSquare className="h-6 w-6 text-purple-500" />
              </div>
            </div>
          </div>
        )}

        {/* Navigation Menu */}
        <nav className="p-2">
          <div className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {!isCollapsed && (
                    <span className="text-sm font-medium">{item.label}</span>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Chain Info (Footer) */}
        {!isCollapsed && (
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-800 bg-gray-900">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Chain ID</span>
                <div className="flex items-center space-x-1">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-xs text-gray-400">Active</span>
                </div>
              </div>
              <p className="text-xs font-mono text-gray-400">
                {truncateAddress(summary?.chainId || LINERA_CONFIG.CHAIN_ID, 8, 6)}
              </p>
            </div>
          </div>
        )}
      </aside>

      {/* Collapsed sidebar spacer */}
      <div className={`${isCollapsed ? 'w-16' : 'w-64'}`}></div>
    </>
  );
}
