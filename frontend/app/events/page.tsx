'use client';

import { Activity } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import EventsTable from '@/components/EventsTable';
import { useRecentEvents } from '@/hooks/useFluxera';

export default function EventsPage() {
  const { events, loading, error, refresh } = useRecentEvents(20);

  return (
    <>
      <Navbar />
      <Sidebar currentPage="events" />

      <main className="ml-64 mt-16 min-h-screen bg-gray-900 text-gray-100 p-6">
        {/* Page Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30">
                <Activity className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Events</h1>
                <p className="text-sm text-gray-400">Browse and filter all tracked events</p>
              </div>
            </div>
            <button
              onClick={refresh}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Events Table */}
        <EventsTable />

        {/* Recent Events Quick View */}
        <div className="mt-6 rounded-lg bg-gray-800 border border-gray-700 p-6">
          <h3 className="text-lg font-semibold mb-4">Live Event Feed</h3>
          <div className="space-y-2">
            {loading ? (
              <p className="text-gray-400">Loading events...</p>
            ) : error ? (
              <p className="text-red-400">Failed to load events</p>
            ) : events.length === 0 ? (
              <p className="text-gray-400">No events tracked yet</p>
            ) : (
              events.slice(0, 10).map((event) => (
                <div
                  key={event.eventId}
                  className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                    <span className="text-sm font-medium text-blue-300">{event.eventType}</span>
                  </div>
                  <span className="text-xs text-gray-400 font-mono">
                    {event.eventId?.slice(0, 16)}...
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </>
  );
}
