'use client';

/**
 * WALLET CONNECT COMPONENT
 *
 * Shows local mode status and wallet options for future implementation.
 * Currently supports:
 * - Local Testing Mode - works without wallet connection
 *
 * Coming Soon:
 * - CheCko (browser extension)
 * - Croissant (browser extension)
 */

import { useState, useEffect } from 'react';
import {
  Wallet,
  ChevronDown,
  Zap,
  X,
  Check,
  TestTube,
} from 'lucide-react';
import { isLocalTestingMode } from '@/lib/public-client';

// Wallet metadata for future implementation
const WALLET_INFO = {
  checko: {
    name: 'CheCko',
    description: 'Browser extension with Web3-style API',
    icon: '🦊',
    installUrl: 'https://github.com/respeer-ai/linera-wallet',
  },
  croissant: {
    name: 'Croissant',
    description: 'Native Linera browser wallet',
    icon: '🥐',
    installUrl: 'https://github.com/Nirajsah/croissant',
  },
};

export default function WalletConnect() {
  const [showModal, setShowModal] = useState(false);
  const localMode = isLocalTestingMode();

  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowModal(false);
    };
    if (showModal) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [showModal]);

  return (
    <>
      {/* Local Mode Badge */}
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center space-x-2 px-4 py-2 bg-green-900/30 border border-green-700/50 rounded-lg text-green-400 hover:bg-green-900/50 transition-colors"
      >
        <TestTube className="h-4 w-4" />
        <span className="text-sm font-medium">Local Mode</span>
        <ChevronDown className="h-3 w-3 opacity-60" />
      </button>

      {/* Info Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-md mx-4 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <div className="flex items-center space-x-2">
                <Zap className="h-5 w-5 text-blue-500" />
                <h2 className="text-lg font-semibold text-white">Fluxera Network</h2>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              {/* Local Testing Mode Info */}
              <div className="p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <TestTube className="h-5 w-5 text-green-400" />
                  <span className="font-semibold text-green-300">Local Testing Mode Active</span>
                </div>
                <p className="text-sm text-green-400/80">
                  Connected to local Linera network. All features work without wallet connection -
                  transactions are sent directly via GraphQL to your local service.
                </p>
                <div className="mt-3 p-2 bg-gray-900/50 rounded text-xs font-mono text-gray-400">
                  Service: {process.env.NEXT_PUBLIC_LINERA_SERVICE || 'localhost:8081'}
                </div>
              </div>

              {/* What you can do section */}
              <div className="p-3 bg-gray-800/50 border border-gray-700 rounded-lg">
                <p className="text-sm font-medium text-white mb-2">Available features:</p>
                <ul className="text-xs text-gray-400 space-y-1">
                  <li className="flex items-center space-x-2">
                    <Check className="h-3 w-3 text-green-400" />
                    <span>Track events on blockchain</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="h-3 w-3 text-green-400" />
                    <span>View dashboard statistics</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="h-3 w-3 text-green-400" />
                    <span>Send cross-chain messages</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="h-3 w-3 text-green-400" />
                    <span>Query real-time data</span>
                  </li>
                </ul>
              </div>

              {/* Wallet Options - Coming Soon */}
              <div className="flex items-center space-x-2 py-2">
                <div className="flex-1 h-px bg-gray-700" />
                <span className="text-xs text-gray-500">Browser Wallets</span>
                <div className="flex-1 h-px bg-gray-700" />
              </div>

              {/* CheCko */}
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

              {/* Croissant */}
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
                Running on local Linera network. Wallet integration coming soon.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
