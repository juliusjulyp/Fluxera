/**
 * CROSS-CHAIN MESSAGE FORM
 *
 * Interactive form for sending messages between Linera chains.
 * Requires wallet connection to submit messages.
 *
 * DUAL-MODE:
 * - Without wallet: Shows form but prompts to connect
 * - With wallet: Full functionality to send cross-chain messages
 *
 * USE CASES:
 * - Sync analytics data between chains
 * - Trigger cross-chain events
 * - Coordinate multi-chain workflows
 *
 * DATA FLOW:
 * User Input → Form Submit → useSendMessage hook →
 * LineraProvider → Fluxera WASM contract → Linera runtime →
 * Message queued → Delivered to target chain
 */

'use client';

import { useState } from 'react';
import { Loader2, CheckCircle, AlertCircle, MessageSquare, TestTube } from 'lucide-react';
import { useSendMessage, useWallet } from '@/components/providers/LineraProvider';
import { isLocalTestingMode, sendMessageDirect } from '@/lib/public-client';

export default function CrossChainMessageForm() {
  const [targetChain, setTargetChain] = useState('');
  const [messageType, setMessageType] = useState('');
  const [isCustomType, setIsCustomType] = useState(false);
  const [payload, setPayload] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [messageId, setMessageId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get wallet state and send message function
  const { isConnected, chainId: myChainId } = useWallet();
  const { sendMessage } = useSendMessage();

  // Check if we're in local testing mode
  const localMode = isLocalTestingMode();
  const canSubmit = isConnected || localMode;

  /**
   * Normalize chain ID - strip 0x prefix if present
   */
  const normalizeChainId = (chainId: string): string => {
    let normalized = chainId.trim();
    // Strip 0x or 0X prefix if present
    if (normalized.toLowerCase().startsWith('0x')) {
      normalized = normalized.slice(2);
    }
    return normalized;
  };

  /**
   * Validate chain ID format (64 hex characters)
   */
  const isValidChainId = (chainId: string): boolean => {
    const normalized = normalizeChainId(chainId);
    return /^[a-fA-F0-9]{64}$/.test(normalized);
  };

  /**
   * Handle chain ID input with auto-normalization
   */
  const handleChainIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTargetChain(value);

    // Clear error if user is typing
    if (error?.includes('chain ID')) {
      setError(null);
    }
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canSubmit) {
      setError('Please connect your wallet or enable local testing mode');
      return;
    }

    // Normalize and validate chain ID
    const normalizedChainId = normalizeChainId(targetChain);
    if (!isValidChainId(targetChain)) {
      setError('Invalid chain ID format. Must be 64 hex characters (without 0x prefix).');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let result;

      if (isConnected) {
        // Use wallet connection for mutations
        result = await sendMessage(normalizedChainId, messageType, payload);
      } else if (localMode) {
        // Use direct HTTP mutation for local testing
        console.log('[LocalMode] Sending message via direct HTTP...');
        const response = await sendMessageDirect(normalizedChainId, messageType, payload);
        result = {
          success: true,
          messageId: response.sendCrossChainMessage || `msg_${Date.now()}`,
          timestamp: new Date().toISOString(),
        };
      } else {
        result = { success: false, error: 'No connection method available' };
      }

      if (result.success) {
        console.log('Message sent successfully:', result);
        setMessageId(result.messageId || 'N/A');
        setShowSuccess(true);
        setTargetChain('');
        setMessageType('');
        setIsCustomType(false);
        setPayload('');
        setTimeout(() => setShowSuccess(false), 5000);
      } else {
        setError(result.error || 'Failed to send message');
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Message type presets
   */
  const messageTypes = [
    { type: 'analytics_sync', label: '📊 Analytics Sync', description: 'Sync analytics data' },
    { type: 'event_notification', label: '🔔 Event Notification', description: 'Notify about new events' },
    { type: 'data_request', label: '🔍 Data Request', description: 'Request data from another chain' },
    { type: 'custom', label: '⚙️ Custom', description: 'Custom message type' },
  ];

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-6">
      <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <MessageSquare className="h-6 w-6 text-purple-400" />
        Send Cross-Chain Message
      </h2>

      {/* Local testing mode indicator */}
      {localMode && !isConnected && (
        <div className="mb-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center space-x-3">
          <TestTube className="h-5 w-5 text-green-400 flex-shrink-0" />
          <div>
            <p className="text-green-300 font-medium text-sm">Local Testing Mode</p>
            <p className="text-green-400/70 text-xs">Connected to local Linera network. Messages will be sent directly via HTTP.</p>
          </div>
        </div>
      )}

      {/* Success notification */}
      {showSuccess && (
        <div className="mb-4 p-4 bg-green-500/20 border border-green-500 rounded-lg flex items-start space-x-3">
          <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-green-400 font-semibold">Message sent successfully!</p>
            <p className="text-green-300 text-sm mt-1">Message ID: {messageId}</p>
          </div>
        </div>
      )}

      {/* Error notification */}
      {error && (
        <div className="mb-4 p-4 bg-red-500/20 border border-red-500 rounded-lg flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-400 font-semibold">Error sending message</p>
            <p className="text-red-300 text-sm mt-1">{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Target Chain Input */}
        <div>
          <label htmlFor="targetChain" className="block text-gray-300 text-sm font-medium mb-2">
            Target Chain ID
          </label>
          <input
            id="targetChain"
            type="text"
            value={targetChain}
            onChange={handleChainIdChange}
            placeholder="e476187f6ddfeb9d588c7b45d3df334d5501d6499b3f9ad5595cae86cce16a65"
            required
            disabled={!canSubmit}
            className={`w-full px-4 py-2 bg-gray-900/50 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm disabled:opacity-50 disabled:cursor-not-allowed ${
              targetChain && !isValidChainId(targetChain)
                ? 'border-yellow-500'
                : 'border-gray-600'
            }`}
          />
          <div className="flex items-center justify-between mt-1">
            <div className="flex items-start gap-2">
              <p className="text-gray-500 text-xs">
                Raw hex (64 chars). No "0x" prefix.
              </p>
              {targetChain && targetChain.toLowerCase().startsWith('0x') && (
                <span className="text-yellow-400 text-xs">
                  (0x will be auto-removed)
                </span>
              )}
            </div>
            {(isConnected && myChainId) || localMode ? (
              <button
                type="button"
                onClick={() => setTargetChain(myChainId || process.env.NEXT_PUBLIC_CHAIN_ID || '')}
                className="text-xs text-purple-400 hover:text-purple-300 underline"
              >
                Use configured chain (for testing)
              </button>
            ) : null}
          </div>
        </div>

        {/* Message Type Selection */}
        <div>
          <label className="block text-gray-300 text-sm font-medium mb-2">
            Message Type
          </label>
          <div className="grid grid-cols-2 gap-2">
            {messageTypes.map((type) => (
              <button
                key={type.type}
                type="button"
                onClick={() => {
                  if (type.type === 'custom') {
                    setIsCustomType(true);
                    setMessageType('');
                  } else {
                    setIsCustomType(false);
                    setMessageType(type.type);
                  }
                }}
                disabled={!canSubmit}
                className={`p-3 rounded-lg border transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                  (type.type === 'custom' && isCustomType) || (!isCustomType && messageType === type.type)
                    ? 'bg-purple-600/30 border-purple-500 text-purple-200'
                    : 'bg-gray-700/50 border-gray-600 text-gray-300 hover:bg-gray-700'
                }`}
              >
                <div className="font-medium text-sm">{type.label}</div>
                <div className="text-xs text-gray-400 mt-1">{type.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Custom message type input */}
        {isCustomType && (
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Custom Message Type
            </label>
            <input
              type="text"
              value={messageType}
              onChange={(e) => setMessageType(e.target.value)}
              placeholder="Enter custom message type (e.g., my_custom_event)"
              disabled={!canSubmit}
              className="w-full px-4 py-2 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        )}

        {/* Payload Input */}
        <div>
          <label htmlFor="payload" className="block text-gray-300 text-sm font-medium mb-2">
            Message Payload (JSON)
          </label>
          <textarea
            id="payload"
            value={payload}
            onChange={(e) => setPayload(e.target.value)}
            placeholder='{"data": "your message here", "timestamp": "2024-01-15"}'
            rows={4}
            required
            disabled={!canSubmit}
            className="w-full px-4 py-2 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !targetChain || !messageType || !payload || !canSubmit}
          className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:from-gray-600 disabled:to-gray-600 text-white font-semibold rounded-lg transition-all duration-200 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Sending Message...</span>
            </>
          ) : (
            <>
              {localMode && !isConnected && <TestTube className="h-5 w-5" />}
              <span>Send Cross-Chain Message</span>
            </>
          )}
        </button>
      </form>

      {/* Info Box */}
      <div className="mt-4 p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
        <p className="text-purple-300 text-sm">
          💡 <strong>How it works:</strong> Your message is sent from this chain to the target chain using Linera's
          cross-chain messaging protocol.
          {localMode && !isConnected ? (
            <span> Running in <strong>local testing mode</strong> - messages are sent directly to your local network.</span>
          ) : (
            <span> The target chain will receive and process it asynchronously.</span>
          )}
        </p>
      </div>

      {/* Example payload */}
      <div className="mt-3 p-3 bg-gray-900/50 border border-gray-700 rounded-lg">
        <p className="text-gray-400 text-xs mb-2">📝 Example payload:</p>
        <pre className="text-gray-300 text-xs font-mono">
{`{
  "event_type": "analytics_sync",
  "events_count": 150,
  "timestamp": "${new Date().toISOString()}"
}`}
        </pre>
      </div>
    </div>
  );
}
