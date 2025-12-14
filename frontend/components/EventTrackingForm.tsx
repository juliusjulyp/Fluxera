/**
 * EVENT TRACKING FORM
 *
 * Interactive form that lets users log events to the Fluxera indexer.
 * Requires wallet connection to submit events.
 *
 * IMPORTANT: Fluxera is an INDEXER/ANALYTICS tool.
 * This form records event labels and metadata on-chain for tracking purposes.
 * It does NOT execute any token transfers, swaps, mints, or other DeFi operations.
 *
 * DUAL-MODE:
 * - Without wallet: Shows form but prompts to connect
 * - With wallet: Full functionality to log events
 *
 * DATA FLOW:
 * User Input → Form Submit → useTrackEvent hook →
 * LineraProvider → Fluxera WASM contract → Blockchain →
 * Success Response → Dashboard Refreshes (event appears in logs)
 */

'use client';

import { useState } from 'react';
import { Wallet, Loader2, CheckCircle, AlertCircle, Zap } from 'lucide-react';
import { useTrackEvent, useWallet } from '@/components/providers/LineraProvider';

export default function EventTrackingForm() {
  const [eventType, setEventType] = useState('');
  const [customData, setCustomData] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [eventId, setEventId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get wallet state and track event function
  const { isConnected } = useWallet();
  const { trackEvent } = useTrackEvent();

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isConnected) {
      setError('Please connect your wallet first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await trackEvent(eventType, customData || '{}');

      if (result.success) {
        console.log('Event tracked successfully:', result);
        setEventId(result.eventId || 'N/A');
        setShowSuccess(true);
        setEventType('');
        setCustomData('');
        setTimeout(() => setShowSuccess(false), 5000);
      } else {
        setError(result.error || 'Failed to track event');
      }
    } catch (err) {
      console.error('Failed to track event:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-6">
      <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <Zap className="h-6 w-6 text-blue-400" />
        Track New Event
      </h2>

      {/* Wallet not connected prompt */}
      {!isConnected && (
        <div className="mb-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex items-center space-x-3">
          <Wallet className="h-5 w-5 text-yellow-400 flex-shrink-0" />
          <div>
            <p className="text-yellow-300 font-medium text-sm">Wallet Required</p>
            <p className="text-yellow-400/70 text-xs">Connect your wallet to track events on the blockchain</p>
          </div>
        </div>
      )}

      {/* Success notification */}
      {showSuccess && (
        <div className="mb-4 p-4 bg-green-500/20 border border-green-500 rounded-lg flex items-start space-x-3">
          <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-green-400 font-semibold">Event tracked successfully!</p>
            <p className="text-green-300 text-sm mt-1">Event ID: {eventId}</p>
          </div>
        </div>
      )}

      {/* Error notification */}
      {error && (
        <div className="mb-4 p-4 bg-red-500/20 border border-red-500 rounded-lg flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-400 font-semibold">Error tracking event</p>
            <p className="text-red-300 text-sm mt-1">{error}</p>
          </div>
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
            placeholder="Enter your event type..."
            required
            disabled={!isConnected}
            className="w-full px-4 py-2 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          />
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
            placeholder='{"action": "page_view", "user": "alice", "page": "/dashboard", "timestamp": "2024-01-15"}'
            rows={4}
            disabled={!isConnected}
            className="w-full px-4 py-2 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !eventType || !isConnected}
          className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:from-gray-600 disabled:to-gray-600 text-white font-semibold rounded-lg transition-all duration-200 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Tracking Event...</span>
            </>
          ) : !isConnected ? (
            <>
              <Wallet className="h-5 w-5" />
              <span>Connect Wallet to Track</span>
            </>
          ) : (
            <span>🚀 Track Event on Blockchain</span>
          )}
        </button>
      </form>

      {/* Info Box */}
      <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
        <p className="text-blue-300 text-sm">
          💡 <strong>How it works:</strong> Fluxera is an <strong>event indexer</strong> - it records and tracks events on Linera.
          Your event label and data are stored on-chain for analytics. This does NOT execute any DeFi operations.
        </p>
      </div>
    </div>
  );
}
