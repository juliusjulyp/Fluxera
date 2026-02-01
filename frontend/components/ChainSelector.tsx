/**
 * CHAIN SELECTOR COMPONENT
 *
 * Dropdown selector for choosing target chains in cross-chain messaging.
 * Shows all known Fluxera chains with status indicators.
 *
 * Features:
 * - Dropdown with known chains
 * - Status indicator (active/inactive)
 * - Custom chain ID input option
 * - Excludes current chain from selection
 *
 * Wave 6: Multi-Chain Support
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check, Plus, X, Link as LinkIcon } from 'lucide-react';
import {
  getKnownChains,
  truncateChainId,
  isValidChainId,
  normalizeChainId,
  ChainInfo,
} from '@/lib/chain-registry';

interface ChainSelectorProps {
  /** Currently selected chain ID */
  value: string;
  /** Callback when selection changes */
  onChange: (chainId: string) => void;
  /** Chain ID to exclude from selection (e.g., current chain) */
  excludeChainId?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Whether the selector is disabled */
  disabled?: boolean;
  /** Whether to allow custom chain ID entry */
  allowCustom?: boolean;
  /** Optional label */
  label?: string;
}

export default function ChainSelector({
  value,
  onChange,
  excludeChainId,
  placeholder = 'Select target chain',
  disabled = false,
  allowCustom = true,
  label,
}: ChainSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customChainId, setCustomChainId] = useState('');
  const [customError, setCustomError] = useState<string | null>(null);
  const [chains, setChains] = useState<ChainInfo[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load known chains and filter out excluded chain
  useEffect(() => {
    const knownChains = getKnownChains().filter(
      (c) => !excludeChainId || c.chainId.toLowerCase() !== excludeChainId.toLowerCase()
    );
    setChains(knownChains);
  }, [excludeChainId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowCustomInput(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Find selected chain info
  const selectedChain = chains.find(
    (c) => c.chainId.toLowerCase() === value.toLowerCase()
  );

  // Check if current value is a custom (non-known) chain
  const isCustomValue = value && !selectedChain;

  const handleSelect = (chainId: string) => {
    onChange(chainId);
    setIsOpen(false);
    setShowCustomInput(false);
    setCustomChainId('');
    setCustomError(null);
  };

  const handleCustomSubmit = () => {
    const normalized = normalizeChainId(customChainId);

    if (!isValidChainId(normalized)) {
      setCustomError('Invalid format. Must be 64 hex characters.');
      return;
    }

    // Check if it's the excluded chain
    if (excludeChainId && normalized.toLowerCase() === excludeChainId.toLowerCase()) {
      setCustomError('Cannot select your own chain as target.');
      return;
    }

    handleSelect(normalized);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Label */}
      {label && (
        <label className="block text-gray-300 text-sm font-medium mb-2">
          {label}
        </label>
      )}

      {/* Dropdown Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full px-4 py-3 bg-gray-900/50 border rounded-lg text-left flex items-center justify-between transition-all
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-purple-500 cursor-pointer'}
          ${isOpen ? 'border-purple-500 ring-2 ring-purple-500/20' : 'border-gray-600'}`}
      >
        {value ? (
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <div
              className={`w-2 h-2 rounded-full flex-shrink-0 ${
                selectedChain?.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'
              }`}
            />
            <div className="min-w-0 flex-1">
              <p className="text-white font-medium truncate">
                {selectedChain?.name || (isCustomValue ? 'Custom Chain' : 'Unknown')}
              </p>
              <p className="text-gray-400 text-xs font-mono truncate">
                {truncateChainId(value, 10)}
              </p>
            </div>
            {!disabled && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1 hover:bg-gray-700 rounded transition-colors"
              >
                <X className="h-4 w-4 text-gray-400 hover:text-white" />
              </button>
            )}
          </div>
        ) : (
          <span className="text-gray-500">{placeholder}</span>
        )}
        <ChevronDown
          className={`h-5 w-5 text-gray-400 transition-transform flex-shrink-0 ml-2 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-xl overflow-hidden">
          {/* Known Chains */}
          {chains.length > 0 && (
            <div className="max-h-60 overflow-y-auto">
              {chains.map((chain) => (
                <button
                  key={chain.chainId}
                  type="button"
                  onClick={() => handleSelect(chain.chainId)}
                  className={`w-full px-4 py-3 flex items-center justify-between hover:bg-gray-700 transition-colors
                    ${value.toLowerCase() === chain.chainId.toLowerCase() ? 'bg-purple-600/20' : ''}`}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        chain.status === 'active' ? 'bg-green-500' : 'bg-gray-500'
                      }`}
                    />
                    <div className="text-left min-w-0">
                      <p className="text-white font-medium">{chain.name}</p>
                      <p className="text-gray-400 text-xs font-mono truncate">
                        {truncateChainId(chain.chainId, 10)}
                      </p>
                      {chain.description && (
                        <p className="text-gray-500 text-xs mt-0.5">{chain.description}</p>
                      )}
                    </div>
                  </div>
                  {value.toLowerCase() === chain.chainId.toLowerCase() && (
                    <Check className="h-4 w-4 text-purple-400 flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          )}

          {/* No Known Chains Message */}
          {chains.length === 0 && (
            <div className="px-4 py-6 text-center">
              <LinkIcon className="h-8 w-8 text-gray-600 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">No other chains available</p>
              <p className="text-gray-500 text-xs mt-1">
                Enter a custom chain ID below
              </p>
            </div>
          )}

          {/* Custom Chain Input */}
          {allowCustom && (
            <div className="border-t border-gray-700">
              {showCustomInput ? (
                <div className="p-3 space-y-2">
                  <div>
                    <input
                      type="text"
                      value={customChainId}
                      onChange={(e) => {
                        setCustomChainId(e.target.value);
                        setCustomError(null);
                      }}
                      placeholder="Enter 64-character chain ID"
                      className={`w-full px-3 py-2 bg-gray-900 border rounded text-white text-sm font-mono placeholder-gray-500 focus:outline-none focus:border-purple-500 ${
                        customError ? 'border-red-500' : 'border-gray-600'
                      }`}
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleCustomSubmit();
                        }
                      }}
                    />
                    {customError && (
                      <p className="text-red-400 text-xs mt-1">{customError}</p>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={handleCustomSubmit}
                      className="flex-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-sm rounded transition-colors"
                    >
                      Use Chain
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCustomInput(false);
                        setCustomChainId('');
                        setCustomError(null);
                      }}
                      className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm rounded transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowCustomInput(true)}
                  className="w-full px-4 py-3 flex items-center space-x-3 text-purple-400 hover:bg-gray-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>Enter custom chain ID</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
