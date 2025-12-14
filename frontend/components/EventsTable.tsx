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
 * Works in PUBLIC MODE - no wallet connection required
 */

'use client';

import { useState, useMemo, useEffect } from 'react';
import { Loader2, Download, Search, Filter, ArrowUpDown, X, Eye } from 'lucide-react';
import {
  useEvents,
  AnalyticsEvent,
  truncateAddress,
  formatRelativeTime,
} from '@/hooks/useFluxera';
import { useGlobalSearch } from '@/components/providers/SearchContext';

export default function EventsTable() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedEvent, setSelectedEvent] = useState<AnalyticsEvent | null>(null);
  const eventsPerPage = 10;

  // Global search from Navbar
  const { globalSearch } = useGlobalSearch();

  // Sync global search with local search
  useEffect(() => {
    if (globalSearch) {
      setSearchQuery(globalSearch);
      setCurrentPage(0);
    }
  }, [globalSearch]);

  // Fetch events with pagination
  const { events, loading, error, hasMore, loadMore, refresh } = useEvents(100);

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
        event?.owner?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event?.eventId?.toLowerCase().includes(searchQuery.toLowerCase())
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

  if (loading && events.length === 0) {
    return (
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <span className="ml-3 text-gray-400">Loading events from blockchain...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500 rounded-lg p-6">
        <p className="text-red-400">Error loading events: {error.message}</p>
        <button
          onClick={refresh}
          className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm rounded-lg"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-6">
      {/* Header with controls */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Filter className="h-6 w-6 text-blue-400" />
          Events Explorer
          <span className="text-sm font-normal text-gray-400">
            ({filteredEvents.length} events)
          </span>
        </h2>

        <div className="flex items-center gap-2">
          <button
            onClick={refresh}
            disabled={loading}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Loader2 className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={exportToCSV}
            disabled={filteredEvents.length === 0}
            className="px-4 py-2 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Search by owner */}
        <div>
          <label className="block text-gray-400 text-sm mb-2 flex items-center gap-1">
            <Search className="h-3 w-3" />
            Search by Owner/ID
          </label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(0);
            }}
            placeholder="Enter address or event ID..."
            className="w-full px-4 py-2 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>

        {/* Filter by type */}
        <div>
          <label className="block text-gray-400 text-sm mb-2 flex items-center gap-1">
            <Filter className="h-3 w-3" />
            Filter by Type
          </label>
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
          <label className="block text-gray-400 text-sm mb-2 flex items-center gap-1">
            <ArrowUpDown className="h-3 w-3" />
            Sort Order
          </label>
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
              <tr
                key={event?.eventId}
                onClick={() => setSelectedEvent(event)}
                className="border-b border-gray-800 hover:bg-gray-700/30 transition-colors cursor-pointer"
              >
                <td className="py-3">
                  <span className="inline-block px-2 py-1 bg-blue-600/20 text-blue-300 text-xs rounded">
                    {event?.eventType}
                  </span>
                </td>
                <td className="py-3">
                  <span className="font-mono text-sm text-gray-300">
                    {truncateAddress(event?.owner || '', 8)}
                  </span>
                </td>
                <td className="py-3 text-gray-400 text-sm">
                  {formatRelativeTime(event?.timestamp || '')}
                </td>
                <td className="py-3 text-gray-400 text-sm">
                  <div className="max-w-xs truncate">
                    {event?.data || 'N/A'}
                  </div>
                </td>
                <td className="py-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-gray-500">
                      {truncateAddress(event?.chainId || '', 6)}
                    </span>
                    <Eye className="h-3 w-3 text-gray-600" />
                  </div>
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

      {/* Load More */}
      {hasMore && (
        <div className="mt-4 text-center">
          <button
            onClick={loadMore}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 text-white text-sm rounded-lg transition-colors"
          >
            {loading ? 'Loading...' : 'Load More Events'}
          </button>
        </div>
      )}

      {/* No results */}
      {filteredEvents.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center py-12">
          {/* Animated database icon */}
          <div className="relative mb-4">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-gray-700 flex items-center justify-center">
              <Filter className="h-8 w-8 text-gray-600" />
            </div>
            {/* Floating particles */}
            <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-blue-500/30 animate-ping" />
            <div className="absolute -bottom-1 -left-1 w-2 h-2 rounded-full bg-purple-500/30 animate-pulse" />
          </div>

          <p className="text-gray-400 text-base font-medium">No events found</p>
          <p className="text-gray-500 text-sm mt-1 text-center max-w-xs">
            {searchQuery || filterType !== 'all'
              ? 'Try adjusting your filters or search query'
              : 'Connect your wallet and track your first event!'}
          </p>
        </div>
      )}

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-600/20 flex items-center justify-center">
                  <Eye className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Event Details</h3>
                  <p className="text-xs text-gray-400">Full event information</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="space-y-4">
                {/* Event Type */}
                <div className="bg-gray-900/50 rounded-lg p-4">
                  <label className="text-xs text-gray-500 uppercase tracking-wide">Event Type</label>
                  <div className="mt-1">
                    <span className="inline-block px-3 py-1.5 bg-blue-600/20 text-blue-300 text-sm font-medium rounded-lg">
                      {selectedEvent.eventType}
                    </span>
                  </div>
                </div>

                {/* Event ID */}
                <div className="bg-gray-900/50 rounded-lg p-4">
                  <label className="text-xs text-gray-500 uppercase tracking-wide">Event ID</label>
                  <p className="mt-1 font-mono text-sm text-white break-all">{selectedEvent.eventId}</p>
                </div>

                {/* Owner */}
                <div className="bg-gray-900/50 rounded-lg p-4">
                  <label className="text-xs text-gray-500 uppercase tracking-wide">Owner Address</label>
                  <p className="mt-1 font-mono text-sm text-white break-all">{selectedEvent.owner}</p>
                </div>

                {/* Timestamp */}
                <div className="bg-gray-900/50 rounded-lg p-4">
                  <label className="text-xs text-gray-500 uppercase tracking-wide">Timestamp</label>
                  <p className="mt-1 text-sm text-white">
                    {selectedEvent.timestamp}
                    <span className="text-gray-500 ml-2">({formatRelativeTime(selectedEvent.timestamp)})</span>
                  </p>
                </div>

                {/* Chain ID */}
                <div className="bg-gray-900/50 rounded-lg p-4">
                  <label className="text-xs text-gray-500 uppercase tracking-wide">Chain ID</label>
                  <p className="mt-1 font-mono text-sm text-white break-all">{selectedEvent.chainId}</p>
                </div>

                {/* Data */}
                <div className="bg-gray-900/50 rounded-lg p-4">
                  <label className="text-xs text-gray-500 uppercase tracking-wide">Event Data</label>
                  <pre className="mt-2 p-3 bg-gray-950 rounded-lg overflow-x-auto text-sm text-gray-300 font-mono whitespace-pre-wrap break-all">
                    {(() => {
                      try {
                        return JSON.stringify(JSON.parse(selectedEvent.data), null, 2);
                      } catch {
                        return selectedEvent.data || 'No data';
                      }
                    })()}
                  </pre>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-700">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(selectedEvent, null, 2));
                }}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Copy JSON
              </button>
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
