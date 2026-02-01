'use client';

import { FileText, ExternalLink, Code, Zap, Globe, Database } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';

export default function DocsPage() {
  return (
    <>
      <Navbar />
      <Sidebar currentPage="docs" />

      <main className="ml-64 mt-16 min-h-screen bg-gray-900 text-gray-100 p-6">
        {/* Page Header */}
        <div className="mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/30">
              <FileText className="h-6 w-6 text-green-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Documentation</h1>
              <p className="text-sm text-gray-400">Learn how to use Fluxera</p>
            </div>
          </div>
        </div>

        {/* Quick Start */}
        <div className="mb-6 rounded-lg bg-gray-800 border border-gray-700 p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Zap className="h-5 w-5 mr-2 text-yellow-400" />
            Quick Start
          </h3>
          <div className="space-y-4 text-gray-300">
            <div>
              <h4 className="font-medium text-white mb-2">1. Track an Event</h4>
              <p className="text-sm">Use the "Track New Event" form on the dashboard to record analytics events on-chain.</p>
            </div>
            <div>
              <h4 className="font-medium text-white mb-2">2. Send Cross-Chain Messages</h4>
              <p className="text-sm">Use the message form to send data between Linera microchains. Messages are tracked with delivery status.</p>
            </div>
            <div>
              <h4 className="font-medium text-white mb-2">3. Monitor Activity</h4>
              <p className="text-sm">View real-time events and message status in the dashboard. WebSocket provides instant updates.</p>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          <div className="rounded-lg bg-gray-800 border border-gray-700 p-6">
            <Database className="h-8 w-8 text-blue-400 mb-3" />
            <h4 className="font-semibold mb-2">Event Tracking</h4>
            <p className="text-sm text-gray-400">
              Track any type of event on-chain with custom data payloads. Events are immutable and timestamped.
            </p>
          </div>

          <div className="rounded-lg bg-gray-800 border border-gray-700 p-6">
            <Globe className="h-8 w-8 text-purple-400 mb-3" />
            <h4 className="font-semibold mb-2">Cross-Chain Messaging</h4>
            <p className="text-sm text-gray-400">
              Send messages between microchains with automatic delivery acknowledgment and status tracking.
            </p>
          </div>

          <div className="rounded-lg bg-gray-800 border border-gray-700 p-6">
            <Zap className="h-8 w-8 text-yellow-400 mb-3" />
            <h4 className="font-semibold mb-2">Real-Time Updates</h4>
            <p className="text-sm text-gray-400">
              WebSocket connection provides instant event streaming. Falls back to polling if disconnected.
            </p>
          </div>
        </div>

        {/* API Reference */}
        <div className="mb-6 rounded-lg bg-gray-800 border border-gray-700 p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Code className="h-5 w-5 mr-2 text-blue-400" />
            GraphQL API
          </h3>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-green-400 mb-2">Queries</h4>
              <pre className="bg-gray-900 rounded p-4 text-sm overflow-x-auto">
{`# Get analytics summary
query {
  analyticsSummary {
    totalEvents
    totalMessages
    uniqueUsers
    chainId
  }
}

# Get recent events
query {
  recentEvents(limit: 10) {
    eventId
    eventType
    owner
    timestamp
    data
  }
}

# Get messages with status
query {
  messagesWithStatus(limit: 10) {
    messageId
    status
    sourceChain
    targetChain
  }
}`}
              </pre>
            </div>

            <div>
              <h4 className="font-medium text-yellow-400 mb-2">Mutations</h4>
              <pre className="bg-gray-900 rounded p-4 text-sm overflow-x-auto">
{`# Track an event
mutation {
  trackEvent(
    eventType: "user_action"
    data: "{\\"action\\": \\"click\\"}"
  )
}

# Send cross-chain message
mutation {
  sendCrossChainMessage(
    targetChain: "<chain_id>"
    messageType: "analytics_sync"
    payload: "{\\"data\\": \\"value\\"}"
  )
}`}
              </pre>
            </div>
          </div>
        </div>

        {/* External Links */}
        <div className="rounded-lg bg-gray-800 border border-gray-700 p-6">
          <h3 className="text-lg font-semibold mb-4">Resources</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a
              href="https://github.com/juliusjulyp/Fluxera"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <span>Fluxera GitHub</span>
              <ExternalLink className="h-4 w-4 text-gray-400" />
            </a>
            <a
              href="https://linera.io"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <span>Linera Documentation</span>
              <ExternalLink className="h-4 w-4 text-gray-400" />
            </a>
            <a
              href="https://github.com/linera-io/linera-protocol"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <span>Linera GitHub</span>
              <ExternalLink className="h-4 w-4 text-gray-400" />
            </a>
          </div>
        </div>
      </main>
    </>
  );
}
