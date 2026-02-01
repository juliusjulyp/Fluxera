'use client';

import { MessageSquare } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import MessageTracer from '@/components/MessageTracer';
import CrossChainMessageForm from '@/components/CrossChainMessageForm';
import { useMessagesWithStatus } from '@/hooks/useFluxera';

export default function MessagesPage() {
  const { messages, loading, error } = useMessagesWithStatus(50);

  return (
    <>
      <Navbar />
      <Sidebar currentPage="messages" />

      <main className="ml-64 mt-16 min-h-screen bg-gray-900 text-gray-100 p-6">
        {/* Page Header */}
        <div className="mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/30">
              <MessageSquare className="h-6 w-6 text-purple-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Cross-Chain Messages</h1>
              <p className="text-sm text-gray-400">Send and track messages across Linera microchains</p>
            </div>
          </div>
        </div>

        {/* Send Message Form */}
        <div className="mb-6">
          <CrossChainMessageForm />
        </div>

        {/* Message Tracer */}
        <div className="mb-6">
          <MessageTracer limit={20} refreshInterval={5000} />
        </div>

        {/* All Messages Table */}
        <div className="rounded-lg bg-gray-800 border border-gray-700 p-6">
          <h3 className="text-lg font-semibold mb-4">Message History</h3>
          {loading ? (
            <p className="text-gray-400">Loading messages...</p>
          ) : error ? (
            <p className="text-red-400">Failed to load messages</p>
          ) : messages.length === 0 ? (
            <p className="text-gray-400">No messages sent yet. Send your first cross-chain message above!</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-gray-400 border-b border-gray-700">
                    <th className="pb-3 pr-4">Message ID</th>
                    <th className="pb-3 pr-4">Type</th>
                    <th className="pb-3 pr-4">Source</th>
                    <th className="pb-3 pr-4">Target</th>
                    <th className="pb-3 pr-4">Status</th>
                    <th className="pb-3">Sent At</th>
                  </tr>
                </thead>
                <tbody>
                  {messages.map((msg) => (
                    <tr key={msg.messageId} className="border-b border-gray-700/50">
                      <td className="py-3 pr-4 font-mono text-sm text-blue-400">
                        {msg.messageId.slice(0, 16)}...
                      </td>
                      <td className="py-3 pr-4 text-sm">{msg.messageType}</td>
                      <td className="py-3 pr-4 font-mono text-xs text-gray-400">
                        {msg.sourceChain.slice(0, 8)}...
                      </td>
                      <td className="py-3 pr-4 font-mono text-xs text-gray-400">
                        {msg.targetChain.slice(0, 8)}...
                      </td>
                      <td className="py-3 pr-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          msg.status === 'DELIVERED' || msg.status === 'Delivered'
                            ? 'bg-green-500/20 text-green-400'
                            : msg.status === 'FAILED' || msg.status === 'Failed'
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-blue-500/20 text-blue-400'
                        }`}>
                          {msg.status}
                        </span>
                      </td>
                      <td className="py-3 text-sm text-gray-400">{msg.sentAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
