/**
 * ON-CHAIN RECORD FORM
 *
 * Creates labeled records on the Linera blockchain.
 * Each submission is a real blockchain transaction stored permanently.
 *
 * USE CASES:
 * - Log application events with metadata
 * - Create audit trail entries
 * - Store timestamped records on-chain
 *
 * DUAL-MODE:
 * - Without wallet: Shows form but prompts to connect
 * - With wallet: Full functionality to create records
 *
 * DATA FLOW:
 * User Input → Form Submit → useTrackEvent hook →
 * LineraProvider → Fluxera WASM contract → Blockchain →
 * Success Response → Record appears in chain activity
 */

'use client';

import { useState } from 'react';
import { Loader2, CheckCircle, AlertCircle, Zap, TestTube } from 'lucide-react';
import { useTrackEvent, useWallet } from '@/components/providers/LineraProvider';
import { isLocalTestingMode, trackEventDirect } from '@/lib/public-client';

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

  // Check if we're in local testing mode
  const localMode = isLocalTestingMode();
  const canSubmit = isConnected || localMode;

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canSubmit) {
      setError('Please connect your wallet or enable local testing mode');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let result;

      if (isConnected) {
        // Use wallet connection for mutations
        result = await trackEvent(eventType, customData || '{}');
      } else if (localMode) {
        // Use direct HTTP mutation for local testing
        console.log('[LocalMode] Tracking event via direct HTTP...');
        const response = await trackEventDirect(eventType, customData || '{}');
        result = {
          success: true,
          eventId: response.trackEvent || `evt_${Date.now()}`,
          timestamp: new Date().toISOString(),
        };
      } else {
        result = { success: false, error: 'No connection method available' };
      }

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
        Create On-Chain Record
      </h2>

      {/* Local testing mode indicator */}
      {localMode && !isConnected && (
        <div className="mb-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center space-x-3">
          <TestTube className="h-5 w-5 text-green-400 flex-shrink-0" />
          <div>
            <p className="text-green-300 font-medium text-sm">Local Testing Mode</p>
            <p className="text-green-400/70 text-xs">Connected to local Linera network. Records will be created directly via HTTP.</p>
          </div>
        </div>
      )}

      {/* Success notification */}
      {showSuccess && (
        <div className="mb-4 p-4 bg-green-500/20 border border-green-500 rounded-lg flex items-start space-x-3">
          <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-green-400 font-semibold">Record created successfully!</p>
            <p className="text-green-300 text-sm mt-1">Record ID: {eventId}</p>
          </div>
        </div>
      )}

      {/* Error notification */}
      {error && (
        <div className="mb-4 p-4 bg-red-500/20 border border-red-500 rounded-lg flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-400 font-semibold">Error creating record</p>
            <p className="text-red-300 text-sm mt-1">{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Record Label Input */}
        <div>
          <label htmlFor="eventType" className="block text-gray-300 text-sm font-medium mb-2">
            Record Label
          </label>
          <input
            id="eventType"
            type="text"
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
            placeholder="e.g., audit_entry, app_log, state_snapshot"
            required
            disabled={!canSubmit}
            className="w-full px-4 py-2 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        {/* Data Payload Input */}
        <div>
          <label htmlFor="customData" className="block text-gray-300 text-sm font-medium mb-2">
            Data Payload (JSON)
          </label>
          <textarea
            id="customData"
            value={customData}
            onChange={(e) => setCustomData(e.target.value)}
            placeholder='{"message": "User completed checkout", "orderId": "12345"}'
            rows={4}
            disabled={!canSubmit}
            className="w-full px-4 py-2 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <p className="text-gray-500 text-xs mt-1">
            JSON recommended for structured data, but any text format is accepted for demo.
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !eventType || !canSubmit}
          className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:from-gray-600 disabled:to-gray-600 text-white font-semibold rounded-lg transition-all duration-200 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Creating Record...</span>
            </>
          ) : (
            <>
              {localMode && !isConnected && <TestTube className="h-5 w-5" />}
              <span>Create Record on Blockchain</span>
            </>
          )}
        </button>
      </form>

      {/* Info Box */}
      <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
        <p className="text-blue-300 text-sm">
          💡 <strong>How it works:</strong> This creates a permanent, timestamped record on the Linera blockchain.
          {localMode && !isConnected ? (
            <span> Running in <strong>local testing mode</strong> - records are created directly on your local network.</span>
          ) : (
            <span> Your label and data are stored on-chain with your wallet address and timestamp.</span>
          )}
        </p>
      </div>
    </div>
  );
}
