'use client';

/**
 * MESSAGE TRACER VISUALIZATION
 *
 * Visualizes cross-chain message flow in the Linera network.
 * Shows source chain, target chain, message type, and status.
 *
 * Features:
 * - Animated flow lines between chains
 * - Color-coded message types
 * - Real-time updates
 * - Message details on hover
 */

import { useState } from 'react';
import {
  ArrowRight,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useRecentMessages, CrossChainMessage, truncateAddress, formatRelativeTime } from '@/hooks/useFluxera';

// Message type colors
const MESSAGE_TYPE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  analytics_sync: { bg: 'bg-blue-500/20', border: 'border-blue-500/50', text: 'text-blue-400' },
  data_request: { bg: 'bg-green-500/20', border: 'border-green-500/50', text: 'text-green-400' },
  data_response: { bg: 'bg-green-500/20', border: 'border-green-500/50', text: 'text-green-400' },
  event_broadcast: { bg: 'bg-purple-500/20', border: 'border-purple-500/50', text: 'text-purple-400' },
  state_sync: { bg: 'bg-yellow-500/20', border: 'border-yellow-500/50', text: 'text-yellow-400' },
  default: { bg: 'bg-gray-500/20', border: 'border-gray-500/50', text: 'text-gray-400' },
};

function getMessageTypeColor(messageType: string) {
  return MESSAGE_TYPE_COLORS[messageType.toLowerCase()] || MESSAGE_TYPE_COLORS.default;
}

interface MessageCardProps {
  message: CrossChainMessage;
  isExpanded: boolean;
  onToggle: () => void;
}

function MessageCard({ message, isExpanded, onToggle }: MessageCardProps) {
  const colors = getMessageTypeColor(message.messageType);

  return (
    <div
      className={`rounded-lg border ${colors.border} ${colors.bg} transition-all duration-200 hover:scale-[1.01]`}
    >
      {/* Main Row */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer"
        onClick={onToggle}
      >
        {/* Left: Source Chain */}
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-400 mb-1">Source</p>
          <p className="text-sm font-mono text-white truncate">
            {truncateAddress(message.sourceChain, 6)}
          </p>
        </div>

        {/* Center: Arrow with Message Type */}
        <div className="flex items-center space-x-2 px-4">
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${colors.bg} ${colors.border} border`}>
            <MessageSquare className={`h-3 w-3 ${colors.text}`} />
            <span className={`text-xs font-medium ${colors.text}`}>
              {message.messageType.replace(/_/g, ' ')}
            </span>
          </div>
          <ArrowRight className={`h-5 w-5 ${colors.text} animate-pulse`} />
        </div>

        {/* Right: Target Chain */}
        <div className="flex-1 min-w-0 text-right">
          <p className="text-xs text-gray-400 mb-1">Target</p>
          <p className="text-sm font-mono text-white truncate">
            {truncateAddress(message.targetChain, 6)}
          </p>
        </div>

        {/* Timestamp & Expand */}
        <div className="flex items-center space-x-3 ml-4">
          <div className="text-right">
            <div className="flex items-center space-x-1 text-gray-400">
              <Clock className="h-3 w-3" />
              <span className="text-xs">{formatRelativeTime(message.sentAt)}</span>
            </div>
          </div>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          )}
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-700/50">
          <div className="grid grid-cols-2 gap-4 mt-3">
            {/* Message ID */}
            <div>
              <p className="text-xs text-gray-500 mb-1">Message ID</p>
              <p className="text-xs font-mono text-gray-300 break-all">{message.messageId}</p>
            </div>

            {/* Timestamp */}
            <div>
              <p className="text-xs text-gray-500 mb-1">Sent At</p>
              <p className="text-xs text-gray-300">{new Date(message.sentAt).toLocaleString()}</p>
            </div>

            {/* Source Chain Full */}
            <div>
              <p className="text-xs text-gray-500 mb-1">Source Chain (Full)</p>
              <p className="text-xs font-mono text-gray-300 break-all">{message.sourceChain}</p>
            </div>

            {/* Target Chain Full */}
            <div>
              <p className="text-xs text-gray-500 mb-1">Target Chain (Full)</p>
              <p className="text-xs font-mono text-gray-300 break-all">{message.targetChain}</p>
            </div>

            {/* Payload */}
            {message.payload && (
              <div className="col-span-2">
                <p className="text-xs text-gray-500 mb-1">Payload</p>
                <pre className="text-xs font-mono text-gray-300 bg-gray-800 rounded p-2 overflow-x-auto">
                  {message.payload}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface MessageTracerProps {
  limit?: number;
  refreshInterval?: number;
  showHeader?: boolean;
}

export default function MessageTracer({
  limit = 10,
  refreshInterval = 5000,
  showHeader = true,
}: MessageTracerProps) {
  const { messages, loading, error, refresh } = useRecentMessages(limit, refreshInterval);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleToggle = (messageId: string) => {
    setExpandedId(expandedId === messageId ? null : messageId);
  };

  return (
    <div className="rounded-lg bg-gray-800 border border-gray-700">
      {/* Header */}
      {showHeader && (
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">Cross-Chain Message Tracer</h3>
          </div>
          <button
            onClick={refresh}
            disabled={loading}
            className="flex items-center space-x-1 px-3 py-1 text-sm text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        {/* Loading State */}
        {loading && messages.length === 0 && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
            <span className="ml-2 text-gray-400">Loading messages...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="flex items-center justify-center py-12 text-red-400">
            <AlertCircle className="h-6 w-6" />
            <span className="ml-2">Failed to load messages: {error.message}</span>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            {/* Animated illustration */}
            <div className="relative mb-4">
              {/* Chain nodes */}
              <div className="flex items-center space-x-8">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/30 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-blue-500/50 animate-pulse" />
                </div>

                {/* Animated connection line */}
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-0.5 bg-gray-600 rounded animate-pulse" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-0.5 bg-gray-500 rounded animate-pulse" style={{ animationDelay: '100ms' }} />
                  <div className="w-2 h-0.5 bg-gray-400 rounded animate-pulse" style={{ animationDelay: '200ms' }} />
                  <MessageSquare className="h-4 w-4 text-gray-500 animate-bounce" />
                  <div className="w-2 h-0.5 bg-gray-400 rounded animate-pulse" style={{ animationDelay: '200ms' }} />
                  <div className="w-2 h-0.5 bg-gray-500 rounded animate-pulse" style={{ animationDelay: '100ms' }} />
                  <div className="w-2 h-0.5 bg-gray-600 rounded animate-pulse" style={{ animationDelay: '0ms' }} />
                </div>

                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/30 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-purple-500/50 animate-pulse" />
                </div>
              </div>
            </div>

            <p className="text-sm font-medium text-gray-400">No cross-chain messages yet</p>
            <p className="text-xs text-gray-500 mt-1 text-center max-w-xs">
              Messages will appear here when chains communicate using Linera's cross-chain messaging
            </p>
          </div>
        )}

        {/* Messages List */}
        {messages.length > 0 && (
          <div className="space-y-3">
            {messages.map((message) => (
              <MessageCard
                key={message.messageId}
                message={message}
                isExpanded={expandedId === message.messageId}
                onToggle={() => handleToggle(message.messageId)}
              />
            ))}
          </div>
        )}

        {/* Stats Footer */}
        {messages.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-700 flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center space-x-1">
              <CheckCircle className="h-3 w-3 text-green-500" />
              <span>{messages.length} messages tracked</span>
            </div>
            <div className="flex items-center space-x-4">
              {/* Unique source chains */}
              <span>
                {new Set(messages.map(m => m.sourceChain)).size} source chains
              </span>
              {/* Unique target chains */}
              <span>
                {new Set(messages.map(m => m.targetChain)).size} target chains
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
