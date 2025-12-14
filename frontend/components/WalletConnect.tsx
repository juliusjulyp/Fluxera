'use client';

/**
 * MULTI-WALLET CONNECT COMPONENT
 *
 * Supports multiple wallet connection methods:
 * - CheCko (browser extension) - for users with CheCko installed
 * - Croissant (browser extension) - for users with Croissant installed
 * - Session Wallet (faucet) - quick demo wallet with free testnet tokens
 *
 * Features:
 * - Auto-detects available wallet extensions
 * - Shows connection modal with wallet options
 * - Displays connected wallet info with dropdown menu
 * - Copy wallet details to clipboard
 */

import { useState, useEffect } from 'react';
import {
  Wallet,
  LogOut,
  Loader2,
  AlertCircle,
  ChevronDown,
  ExternalLink,
  Zap,
  X,
  Copy,
  Check,
} from 'lucide-react';
import { useWallet, WalletType } from '@/components/providers/LineraProvider';
import { truncateAddress } from '@/hooks/useFluxera';

// Copy button component
function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="p-1 hover:bg-gray-700 rounded transition-colors"
      title={`Copy ${label}`}
    >
      {copied ? (
        <Check className="h-3 w-3 text-green-400" />
      ) : (
        <Copy className="h-3 w-3 text-gray-500 hover:text-gray-300" />
      )}
    </button>
  );
}

// Network status indicator colors
const NETWORK_STATUS_COLORS = {
  connected: 'bg-green-500',
  reconnecting: 'bg-yellow-500 animate-pulse',
  degraded: 'bg-orange-500',
  disconnected: 'bg-red-500',
};

// Wallet metadata
const WALLET_INFO: Record<Exclude<WalletType, null>, {
  name: string;
  description: string;
  icon: string;
  installUrl?: string;
  comingSoon?: boolean;
}> = {
  checko: {
    name: 'CheCko',
    description: 'Browser extension with Web3-style API',
    icon: '🦊',
    installUrl: 'https://github.com/respeer-ai/linera-wallet',
    comingSoon: true,
  },
  croissant: {
    name: 'Croissant',
    description: 'Native Linera browser wallet',
    icon: '🥐',
    installUrl: 'https://github.com/Nirajsah/croissant',
    comingSoon: true,
  },
  session: {
    name: 'Session Wallet',
    description: 'Quick demo wallet with free testnet tokens',
    icon: '⚡',
    comingSoon: false,
  },
};

export default function WalletConnect() {
  const {
    isConnected,
    isConnecting,
    address,
    fullAddress,
    chainId,
    walletType,
    error,
    networkStatus,
    connectedAt,
    availableWallets,
    connect,
    disconnect,
    detectWallets,
  } = useWallet();

  const [showModal, setShowModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Re-detect wallets when modal opens
  useEffect(() => {
    if (showModal) {
      detectWallets();
    }
  }, [showModal, detectWallets]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-wallet-dropdown]')) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showDropdown]);

  const handleConnect = async (type: WalletType) => {
    setShowModal(false);
    await connect(type);
  };

  // Loading state
  if (isConnecting) {
    return (
      <button
        disabled
        className="flex items-center space-x-2 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-400 cursor-not-allowed"
      >
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Connecting...</span>
      </button>
    );
  }

  // Error state
  if (error && !isConnected) {
    return (
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center space-x-2 px-4 py-2 bg-red-900/50 border border-red-700 rounded-lg text-red-400 hover:bg-red-900/70 transition-colors"
      >
        <AlertCircle className="h-4 w-4" />
        <span className="text-sm">Retry Connect</span>
      </button>
    );
  }

  // Connected state
  if (isConnected && address && walletType) {
    const walletInfo = WALLET_INFO[walletType];
    const statusColor = NETWORK_STATUS_COLORS[networkStatus || 'connected'];

    return (
      <div className="relative" data-wallet-dropdown>
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center space-x-2 px-4 py-2 bg-green-900/30 border border-green-700/50 rounded-lg text-green-400 hover:bg-green-900/50 transition-colors"
        >
          <div className={`h-2 w-2 rounded-full ${statusColor}`} title={`Network: ${networkStatus}`} />
          <span className="text-lg">{walletInfo.icon}</span>
          <span className="text-sm font-mono">{truncateAddress(address, 4)}</span>
          <ChevronDown className={`h-4 w-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
        </button>

        {showDropdown && (
          <div className="absolute right-0 mt-2 w-96 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50">
            {/* Wallet Info Header */}
            <div className="p-4 border-b border-gray-700 bg-gradient-to-r from-green-900/20 to-blue-900/20">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-2xl">{walletInfo.icon}</span>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-semibold text-white">{walletInfo.name}</span>
                    <span className="px-2 py-0.5 text-xs bg-green-900/50 text-green-400 rounded-full">Connected</span>
                  </div>
                  <p className="text-xs text-gray-400">{walletInfo.description}</p>
                </div>
              </div>
            </div>

            {/* Wallet Details */}
            <div className="p-4 space-y-3">
              {/* Wallet Type */}
              <div className="bg-gray-900/50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Wallet Type</p>
                  <CopyButton text={walletType} label="wallet type" />
                </div>
                <p className="text-sm font-medium text-white">{walletType}</p>
              </div>

              {/* Address */}
              <div className="bg-gray-900/50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Address</p>
                  <CopyButton text={fullAddress || address} label="address" />
                </div>
                <p className="text-xs font-mono text-white break-all">{fullAddress || address}</p>
              </div>

              {/* Chain ID */}
              {chainId && (
                <div className="bg-gray-900/50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Chain ID</p>
                    <CopyButton text={chainId} label="chain ID" />
                  </div>
                  <p className="text-xs font-mono text-gray-300 break-all">{chainId}</p>
                </div>
              )}

              {/* Network Status */}
              <div className="bg-gray-900/50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Network</p>
                  <CopyButton text="Conway Testnet" label="network" />
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`h-2 w-2 rounded-full ${statusColor}`} />
                  <p className="text-sm text-white">Conway Testnet</p>
                  <span className={`px-2 py-0.5 text-xs rounded-full ${
                    networkStatus === 'connected'
                      ? 'bg-green-900/50 text-green-400'
                      : 'bg-yellow-900/50 text-yellow-400'
                  }`}>
                    {networkStatus}
                  </span>
                </div>
              </div>

              {/* Connection Time */}
              <div className="bg-gray-900/50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Connected At</p>
                  <CopyButton text={connectedAt || ''} label="timestamp" />
                </div>
                <p className="text-xs text-gray-300">
                  {connectedAt ? new Date(connectedAt).toLocaleString() : 'Unknown'}
                </p>
              </div>

              {/* Copy All Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const details = [
                    `Wallet Type: ${walletType}`,
                    `Address: ${fullAddress || address}`,
                    `Chain ID: ${chainId}`,
                    `Network: Conway Testnet`,
                    `Status: ${networkStatus}`,
                    `Connected At: ${connectedAt ? new Date(connectedAt).toISOString() : 'Unknown'}`,
                  ].join('\n');
                  navigator.clipboard.writeText(details);
                }}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors"
              >
                <Copy className="h-4 w-4" />
                <span>Copy All Details</span>
              </button>
            </div>

            {/* Actions */}
            <div className="p-3 border-t border-gray-700">
              <button
                onClick={() => {
                  disconnect();
                  setShowDropdown(false);
                }}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 text-red-400 hover:bg-red-900/20 border border-red-900/50 rounded-lg transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span className="text-sm">Disconnect Wallet</span>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Disconnected state - show connect button
  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors"
      >
        <Wallet className="h-4 w-4" />
        <span className="text-sm font-medium">Connect Wallet</span>
      </button>

      {/* Connection Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-md mx-4 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <div className="flex items-center space-x-2">
                <Zap className="h-5 w-5 text-blue-500" />
                <h2 className="text-lg font-semibold text-white">Connect to Fluxera</h2>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            {/* Wallet Options */}
            <div className="p-4 space-y-3">
              {/* Session Wallet - Always available */}
              <button
                onClick={() => handleConnect('session')}
                className="w-full flex items-center space-x-4 p-4 bg-gray-800 hover:bg-gray-750 border border-gray-700 hover:border-gray-600 rounded-xl transition-all group"
              >
                <span className="text-3xl">{WALLET_INFO.session.icon}</span>
                <div className="flex-1 text-left">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-white">{WALLET_INFO.session.name}</span>
                    <span className="px-2 py-0.5 text-xs bg-blue-900/50 text-blue-400 rounded-full">
                      Recommended
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mt-0.5">{WALLET_INFO.session.description}</p>
                </div>
                <ChevronDown className="h-5 w-5 text-gray-500 -rotate-90 group-hover:text-gray-400 transition-colors" />
              </button>

              {/* Divider */}
              <div className="flex items-center space-x-2 py-2">
                <div className="flex-1 h-px bg-gray-700" />
                <span className="text-xs text-gray-500">Extension Wallets</span>
                <div className="flex-1 h-px bg-gray-700" />
              </div>

              {/* CheCko - Coming Soon */}
              <div className="w-full flex items-center space-x-4 p-4 bg-gray-800/50 border border-gray-700/50 rounded-xl opacity-60 cursor-not-allowed">
                <span className="text-3xl">{WALLET_INFO.checko.icon}</span>
                <div className="flex-1 text-left">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-400">{WALLET_INFO.checko.name}</span>
                    <span className="px-2 py-0.5 text-xs bg-yellow-900/50 text-yellow-400 rounded-full">
                      Coming Soon
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">{WALLET_INFO.checko.description}</p>
                </div>
              </div>

              {/* Croissant - Coming Soon */}
              <div className="w-full flex items-center space-x-4 p-4 bg-gray-800/50 border border-gray-700/50 rounded-xl opacity-60 cursor-not-allowed">
                <span className="text-3xl">{WALLET_INFO.croissant.icon}</span>
                <div className="flex-1 text-left">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-400">{WALLET_INFO.croissant.name}</span>
                    <span className="px-2 py-0.5 text-xs bg-yellow-900/50 text-yellow-400 rounded-full">
                      Coming Soon
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">{WALLET_INFO.croissant.description}</p>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-700 bg-gray-800/50 rounded-b-xl">
              <p className="text-xs text-gray-500 text-center">
                By connecting, you agree to use Conway Testnet for testing purposes only.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
