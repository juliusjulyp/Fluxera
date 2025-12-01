/**
 * CROSS-CHAIN MESSAGE FORM
 *
 * Interactive form for sending messages between Linera chains
 *
 * WHAT THIS DEMONSTRATES:
 * - Linera's cross-chain messaging capability
 * - Asynchronous message passing between microchains
 * - Fluxera's cross-chain analytics synchronization
 *
 * USE CASES:
 * - Sync analytics data between chains
 * - Trigger cross-chain events
 * - Coordinate multi-chain workflows
 *
 * DATA FLOW:
 * User Input → Form Submit → useSendCrossChainMessage hook →
 * GraphQL Mutation → Fluxera contract.rs send_cross_chain_message() →
 * Linera runtime.prepare_message().send_to() →
 * Message stored on source chain → Message delivered to target chain
 */

'use client';

import { useState } from 'react';
import { useSendCrossChainMessage } from '@/hooks/useFluxera';

export default function CrossChainMessageForm() {
  const [targetChain, setTargetChain] = useState('');
  const [messageType, setMessageType] = useState('');
  const [payload, setPayload] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [messageId, setMessageId] = useState('');

  // Get the mutation hook
  const [sendMessage, { loading, error }] = useSendCrossChainMessage();

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Call the GraphQL mutation
      const result = await sendMessage({
        variables: {
          targetChain: targetChain,
          messageType: messageType,
          payload: payload,
        },
      });

      // Parse JSON response
      const response = JSON.parse((result.data as any)?.sendCrossChainMessage || '{}');

      console.log('Message sent successfully:', response);

      // Show success notification
      setMessageId(response.message_id || 'N/A');
      setShowSuccess(true);

      // Reset form
      setTargetChain('');
      setMessageType('');
      setPayload('');

      // Hide success message after 5 seconds
      setTimeout(() => setShowSuccess(false), 5000);

    } catch (err) {
      console.error('Failed to send message:', err);
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
        <span className="text-2xl">✉️</span>
        Send Cross-Chain Message
      </h2>

      {/* Success notification */}
      {showSuccess && (
        <div className="mb-4 p-4 bg-green-500/20 border border-green-500 rounded-lg">
          <p className="text-green-400 font-semibold">✅ Message sent successfully!</p>
          <p className="text-green-300 text-sm mt-1">Message ID: {messageId}</p>
          <p className="text-green-300 text-sm">Target: {targetChain.slice(0, 16)}...</p>
        </div>
      )}

      {/* Error notification */}
      {error && (
        <div className="mb-4 p-4 bg-red-500/20 border border-red-500 rounded-lg">
          <p className="text-red-400 font-semibold">❌ Error sending message</p>
          <p className="text-red-300 text-sm mt-1">{error.message}</p>
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
            onChange={(e) => setTargetChain(e.target.value)}
            placeholder="e.g., 04022f7a91f2800b7eb437ab4baa1d8e010854739bbdf64d605705f4c1ecaa99"
            required
            className="w-full px-4 py-2 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm"
          />
          <p className="text-gray-500 text-xs mt-1">
            💡 Enter the full chain ID of the destination chain
          </p>
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
                onClick={() => setMessageType(type.type)}
                className={`p-3 rounded-lg border transition-all ${
                  messageType === type.type
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

        {/* Custom message type input if "custom" selected */}
        {messageType === 'custom' && (
          <div>
            <input
              type="text"
              value={messageType === 'custom' ? '' : messageType}
              onChange={(e) => setMessageType(e.target.value)}
              placeholder="Enter custom message type"
              className="w-full px-4 py-2 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
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
            className="w-full px-4 py-2 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !targetChain || !messageType || !payload}
          className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:from-gray-600 disabled:to-gray-600 text-white font-semibold rounded-lg transition-all duration-200 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Sending Message...
            </span>
          ) : (
            <span>🚀 Send Cross-Chain Message</span>
          )}
        </button>
      </form>

      {/* Info Box */}
      <div className="mt-4 p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
        <p className="text-purple-300 text-sm">
          💡 <strong>How it works:</strong> Your message is sent from this chain to the target chain using Linera's
          cross-chain messaging protocol. The target chain will receive and process it asynchronously.
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
