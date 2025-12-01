/**
 * EVENT TRACKING FORM
 *
 * Interactive form that lets users track custom events on the Fluxera blockchain
 *
 * WHAT THIS DOES:
 * - User fills out event type and custom data
 * - Form submits GraphQL mutation to Fluxera
 * - Event written to blockchain
 * - Dashboard auto-updates with new event
 *
 * DATA FLOW:
 * User Input → Form Submit → useTrackEvent hook →
 * GraphQL Mutation → Fluxera contract.rs → Blockchain →
 * Success Response → Dashboard Refreshes
 */

'use client';

import { useState } from 'react';
import { useTrackEvent } from '@/hooks/useFluxera';

export default function EventTrackingForm() {
  const [eventType, setEventType] = useState('');
  const [customData, setCustomData] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [eventId, setEventId] = useState('');

  // Get the mutation hook from our custom hooks
  const [trackEvent, { loading, error }] = useTrackEvent();

  /**
   * Handle form submission
   *
   * STEPS:
   * 1. Validate input
   * 2. Call trackEvent mutation
   * 3. Parse JSON response from blockchain
   * 4. Show success message with event ID
   * 5. Reset form
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Call the GraphQL mutation
      const result = await trackEvent({
        variables: {
          eventType: eventType,
          data: customData,
        },
      });

      // The response is a JSON string, parse it
      const response = JSON.parse((result.data as any)?.trackEvent || '{}');

      console.log('Event tracked successfully:', response);

      // Show success notification
      setEventId(response.event_id || 'N/A');
      setShowSuccess(true);

      // Reset form
      setEventType('');
      setCustomData('');

      // Hide success message after 5 seconds
      setTimeout(() => setShowSuccess(false), 5000);

    } catch (err) {
      console.error('Failed to track event:', err);
    }
  };

  /**
   * Quick preset buttons for blockchain-native event types
   */
  const presets = [
    { type: 'token_transfer', label: '💸 Token Transfer' },
    { type: 'swap_executed', label: '🔄 Token Swap' },
    { type: 'cross_chain_message', label: '📡 Cross-Chain Message' },
    { type: 'nft_mint', label: '🎨 NFT Mint' },
    { type: 'liquidity_added', label: '💧 Add Liquidity' },
    { type: 'order_placed', label: '📊 Place Order' },
  ];

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-6">
      <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <span className="text-2xl">⚡</span>
        Track New Event
      </h2>

      {/* Success notification */}
      {showSuccess && (
        <div className="mb-4 p-4 bg-green-500/20 border border-green-500 rounded-lg">
          <p className="text-green-400 font-semibold">✅ Event tracked successfully!</p>
          <p className="text-green-300 text-sm mt-1">Event ID: {eventId}</p>
        </div>
      )}

      {/* Error notification */}
      {error && (
        <div className="mb-4 p-4 bg-red-500/20 border border-red-500 rounded-lg">
          <p className="text-red-400 font-semibold">❌ Error tracking event</p>
          <p className="text-red-300 text-sm mt-1">{error.message}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Event Type Input */}
        <div>
          <label htmlFor="eventType" className="block text-gray-300 text-sm font-medium mb-2">
            Event Type
          </label>
          <input
            id="eventType"
            type="text"
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
            placeholder="e.g., token_transfer, swap_executed, nft_mint"
            required
            className="w-full px-4 py-2 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Quick Preset Buttons */}
        <div>
          <p className="text-gray-400 text-sm mb-2">Quick presets:</p>
          <div className="flex flex-wrap gap-2">
            {presets.map((preset) => (
              <button
                key={preset.type}
                type="button"
                onClick={() => setEventType(preset.type)}
                className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm rounded-md transition-colors"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Data Input */}
        <div>
          <label htmlFor="customData" className="block text-gray-300 text-sm font-medium mb-2">
            Custom Data (JSON or text)
          </label>
          <textarea
            id="customData"
            value={customData}
            onChange={(e) => setCustomData(e.target.value)}
            placeholder='{"from": "0xabc...", "to": "0xdef...", "amount": "100", "token": "LINERA"}'
            rows={4}
            className="w-full px-4 py-2 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !eventType}
          className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:from-gray-600 disabled:to-gray-600 text-white font-semibold rounded-lg transition-all duration-200 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Tracking Event...
            </span>
          ) : (
            <span>🚀 Track Event on Blockchain</span>
          )}
        </button>
      </form>

      {/* Info Box */}
      <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
        <p className="text-blue-300 text-sm">
          💡 <strong>What happens:</strong> Your event is written to the Linera blockchain via Fluxera's GraphQL API.
          It will appear in the "Recent Events" section and update the analytics counters.
        </p>
      </div>
    </div>
  );
}
