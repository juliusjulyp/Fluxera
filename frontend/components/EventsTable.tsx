/**
 * EVENTS TABLE WITH FILTERING
 *
 * Advanced events table with:
 * - Search by owner address
 * - Filter by event type
 * - Sort by timestamp
 * - Pagination
 * - Export to CSV
 *
 * This makes the dashboard actually useful for analytics!
 */

'use client';

import { useState, useMemo } from 'react';
import { useEvents } from '@/hooks/useFluxera';
import { AnalyticsEvent } from '@/types/fluxera';

export default function EventsTable() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(0);
  const eventsPerPage = 10;

  // Fetch all events
  const { events, loading, error } = useEvents({
    offset: 0,
    limit: 1000, // Get more for client-side filtering
  });

  /**
   * Get unique event types for filter dropdown
   */
  const eventTypes = useMemo(() => {
    if (!events) return [];
    const types = new Set(events.map(e => e?.eventType).filter(Boolean));
    return Array.from(types);
  }, [events]);

  /**
   * Filter and sort events based on user selections
   */
  const filteredEvents = useMemo(() => {
    if (!events) return [];

    let filtered = events.filter(e => e); // Remove null entries

    // Filter by search query (owner address)
    if (searchQuery) {
      filtered = filtered.filter(event =>
        event?.owner?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by event type
    if (filterType !== 'all') {
      filtered = filtered.filter(event => event?.eventType === filterType);
    }

    // Sort by timestamp
    filtered.sort((a, b) => {
      const timeA = new Date(a?.timestamp || 0).getTime();
      const timeB = new Date(b?.timestamp || 0).getTime();
      return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
    });

    return filtered;
  }, [events, searchQuery, filterType, sortOrder]);

  /**
   * Paginate results
   */
  const paginatedEvents = useMemo(() => {
    const start = currentPage * eventsPerPage;
    return filteredEvents.slice(start, start + eventsPerPage);
  }, [filteredEvents, currentPage]);

  const totalPages = Math.ceil(filteredEvents.length / eventsPerPage);

  /**
   * Export to CSV
   */
  const exportToCSV = () => {
    if (!filteredEvents || filteredEvents.length === 0) return;

    const headers = ['Event ID', 'Event Type', 'Owner', 'Timestamp', 'Data', 'Chain ID'];
    const rows = filteredEvents.map(event => [
      event?.eventId || '',
      event?.eventType || '',
      event?.owner || '',
      event?.timestamp || '',
      event?.data || '',
      event?.chainId || '',
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fluxera-events-${new Date().toISOString()}.csv`;
    a.click();
  };

  /**
   * Helper functions
   */
  const truncateAddress = (address: string, start = 6, end = 4) => {
    if (!address || address.length <= start + end) return address;
    return `${address.slice(0, start)}...${address.slice(-end)}`;
  };

  const formatTimeAgo = (timestamp: string) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  if (loading) {
    return (
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-center py-12">
          <svg className="animate-spin h-8 w-8 text-blue-500" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500 rounded-lg p-6">
        <p className="text-red-400">Error loading events: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-6">
      {/* Header with controls */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <span className="text-2xl">📋</span>
          Events Explorer
          <span className="text-sm font-normal text-gray-400">
            ({filteredEvents.length} events)
          </span>
        </h2>

        <button
          onClick={exportToCSV}
          className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
        >
          <span>📥</span>
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Search by owner */}
        <div>
          <label className="block text-gray-400 text-sm mb-2">🔍 Search by Owner</label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(0);
            }}
            placeholder="Enter address..."
            className="w-full px-4 py-2 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>

        {/* Filter by type */}
        <div>
          <label className="block text-gray-400 text-sm mb-2">🏷️ Filter by Type</label>
          <select
            value={filterType}
            onChange={(e) => {
              setFilterType(e.target.value);
              setCurrentPage(0);
            }}
            className="w-full px-4 py-2 bg-gray-900/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="all">All Types</option>
            {eventTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        {/* Sort order */}
        <div>
          <label className="block text-gray-400 text-sm mb-2">📅 Sort Order</label>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
            className="w-full px-4 py-2 bg-gray-900/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="desc">Newest First</option>
            <option value="asc">Oldest First</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left text-gray-400 text-sm font-medium pb-3">Event Type</th>
              <th className="text-left text-gray-400 text-sm font-medium pb-3">Owner</th>
              <th className="text-left text-gray-400 text-sm font-medium pb-3">Time</th>
              <th className="text-left text-gray-400 text-sm font-medium pb-3">Data</th>
              <th className="text-left text-gray-400 text-sm font-medium pb-3">Chain</th>
            </tr>
          </thead>
          <tbody>
            {paginatedEvents.map((event) => (
              <tr key={event?.eventId} className="border-b border-gray-800 hover:bg-gray-700/30 transition-colors">
                <td className="py-3">
                  <span className="inline-block px-2 py-1 bg-blue-600/20 text-blue-300 text-xs rounded">
                    {event?.eventType}
                  </span>
                </td>
                <td className="py-3">
                  <span className="font-mono text-sm text-gray-300">
                    {truncateAddress(event?.owner || '', 8, 6)}
                  </span>
                </td>
                <td className="py-3 text-gray-400 text-sm">
                  {formatTimeAgo(event?.timestamp || '')}
                </td>
                <td className="py-3 text-gray-400 text-sm">
                  <div className="max-w-xs truncate">
                    {event?.data || 'N/A'}
                  </div>
                </td>
                <td className="py-3">
                  <span className="font-mono text-xs text-gray-500">
                    {truncateAddress(event?.chainId || '', 6, 4)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-700">
          <div className="text-gray-400 text-sm">
            Page {currentPage + 1} of {totalPages}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 text-white text-sm rounded-lg transition-colors"
            >
              ← Previous
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
              disabled={currentPage === totalPages - 1}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 text-white text-sm rounded-lg transition-colors"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* No results */}
      {filteredEvents.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No events found</p>
          <p className="text-gray-600 text-sm mt-2">Try adjusting your filters</p>
        </div>
      )}
    </div>
  );
}
