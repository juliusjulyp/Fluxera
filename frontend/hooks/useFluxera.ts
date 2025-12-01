/**
 * CUSTOM HOOKS FOR FLUXERA DATA
 *
 * These hooks make it super easy to fetch and mutate Fluxera data in React components
 *
 * WHY CUSTOM HOOKS:
 * Instead of this in every component:
 *   import { useQuery } from '@apollo/client';
 *   import { GET_ANALYTICS_SUMMARY } from '@/lib/graphql/queries';
 *   const { data, loading, error } = useQuery(GET_ANALYTICS_SUMMARY);
 *
 * We can just do this:
 *   import { useAnalyticsSummary } from '@/hooks/useFluxera';
 *   const { summary, loading, error } = useAnalyticsSummary();
 *
 * BENEFITS:
 * - Cleaner component code
 * - Type safety (TypeScript knows what data looks like)
 * - Consistent error handling
 * - Easy to add polling, caching, etc.
 * - Can add custom logic (data transformation, caching, etc.)
 */

/**
 * IMPORTANT: Apollo Client React hooks for Next.js
 *
 * In Next.js 13+ with app directory, we need to import from the React subpackage
 * This ensures the hooks work properly in Client Components
 */
import { useQuery, useMutation } from '@apollo/client/react';
import {
  GET_ANALYTICS_SUMMARY,
  GET_RECENT_EVENTS,
  GET_EVENTS,
  GET_EVENTS_BY_TYPE,
  GET_EVENTS_BY_OWNER,
  GET_CHAIN_METRICS,
  GET_ALL_CHAIN_METRICS,
  GET_USER_EVENT_COUNT,
  GET_RECENT_MESSAGES,
  GET_MESSAGES,
  GET_DASHBOARD_DATA,
} from '@/lib/graphql/queries';
import {
  TRACK_EVENT,
  SEND_CROSS_CHAIN_MESSAGE,
} from '@/lib/graphql/mutations';
import {
  GetAnalyticsSummaryResponse,
  GetRecentEventsResponse,
  GetEventsResponse,
  GetEventsByTypeResponse,
  GetEventsByOwnerResponse,
  GetChainMetricsResponse,
  GetAllChainMetricsResponse,
  GetUserEventCountResponse,
  GetRecentMessagesResponse,
  GetMessagesResponse,
  GetDashboardDataResponse,
  TrackEventResponse,
  SendMessageResponse,
} from '@/types/fluxera';
import { POLLING_INTERVALS } from '@/lib/constants';

/**
 * USE ANALYTICS SUMMARY
 *
 * Fetches the high-level statistics (total events, users, messages, etc.)
 *
 * USAGE:
 * function Dashboard() {
 *   const { summary, loading, error, refetch } = useAnalyticsSummary();
 *
 *   if (loading) return <Loader />;
 *   if (error) return <Error />;
 *
 *   return (
 *     <div>
 *       <h1>Total Events: {summary.totalEvents}</h1>
 *       <h2>Unique Users: {summary.uniqueUsers}</h2>
 *       <button onClick={() => refetch()}>Refresh</button>
 *     </div>
 *   );
 * }
 *
 * OPTIONS:
 * - pollInterval: Auto-refresh every X milliseconds (default: 5 seconds)
 * - skip: Don't fetch until some condition is met
 *
 * RETURNS:
 * - summary: The analytics data (or undefined if loading/error)
 * - loading: Boolean - true while fetching
 * - error: Error object if query failed
 * - refetch: Function to manually refresh the data
 */
export function useAnalyticsSummary(options?: any) {
  const { data, loading, error, refetch } = useQuery<GetAnalyticsSummaryResponse>(
    GET_ANALYTICS_SUMMARY,
    {
      pollInterval: POLLING_INTERVALS.STATS, // Refresh every 5 seconds
      ...options,
    }
  );

  return {
    summary: data?.analyticsSummary,
    loading,
    error,
    refetch,
  };
}

/**
 * USE RECENT EVENTS
 *
 * Fetches the most recent events (like a timeline)
 *
 * USAGE:
 * function EventFeed() {
 *   const { events, loading, error } = useRecentEvents({ limit: 10 });
 *
 *   return (
 *     <div>
 *       {events?.map(event => (
 *         <EventCard key={event.eventId} event={event} />
 *       ))}
 *     </div>
 *   );
 * }
 *
 * PARAMETERS:
 * - limit: How many events to fetch (default: 10)
 */
export function useRecentEvents(variables?: { limit?: number }, options?: any) {
  const { data, loading, error, refetch } = useQuery<GetRecentEventsResponse>(
    GET_RECENT_EVENTS,
    {
      variables,
      pollInterval: POLLING_INTERVALS.EVENTS, // Refresh every 3 seconds
      ...options,
    }
  );

  return {
    events: data?.recentEvents,
    loading,
    error,
    refetch,
  };
}

/**
 * USE EVENTS
 *
 * Fetches all events with pagination
 *
 * USAGE:
 * function EventExplorer() {
 *   const [page, setPage] = useState(0);
 *   const { events, loading } = useEvents({
 *     offset: page * 100,
 *     limit: 100
 *   });
 *
 *   return (
 *     <div>
 *       {events?.map(event => <EventCard event={event} />)}
 *       <button onClick={() => setPage(page + 1)}>Next Page</button>
 *     </div>
 *   );
 * }
 *
 * PARAMETERS:
 * - offset: Skip this many events
 * - limit: Return this many events (default: 100)
 */
export function useEvents(variables?: { offset?: number; limit?: number }, options?: any) {
  const { data, loading, error, refetch, fetchMore } = useQuery<GetEventsResponse>(
    GET_EVENTS,
    {
      variables,
      ...options,
    }
  );

  return {
    events: data?.events,
    loading,
    error,
    refetch,
    fetchMore, // Use this for infinite scroll or "load more"
  };
}

/**
 * USE EVENTS BY TYPE
 *
 * Fetches events filtered by type (e.g., only "page_view" events)
 *
 * USAGE:
 * function PageViews() {
 *   const { events, loading } = useEventsByType({ eventType: "page_view", limit: 50 });
 *
 *   return <div>{events?.length} page views</div>;
 * }
 */
export function useEventsByType(variables: { eventType: string; limit?: number }, options?: any) {
  const { data, loading, error, refetch } = useQuery<GetEventsByTypeResponse>(
    GET_EVENTS_BY_TYPE,
    {
      variables,
      ...options,
    }
  );

  return {
    events: data?.eventsByType,
    loading,
    error,
    refetch,
  };
}

/**
 * USE EVENTS BY OWNER
 *
 * Fetches events for a specific user/address
 *
 * USAGE:
 * function UserProfile({ userAddress }) {
 *   const { events, loading } = useEventsByOwner({ owner: userAddress });
 *
 *   return (
 *     <div>
 *       <h2>Activity for {userAddress}</h2>
 *       {events?.map(event => <EventCard event={event} />)}
 *     </div>
 *   );
 * }
 */
export function useEventsByOwner(variables: { owner: string; limit?: number }, options?: any) {
  const { data, loading, error, refetch } = useQuery<GetEventsByOwnerResponse>(
    GET_EVENTS_BY_OWNER,
    {
      variables,
      ...options,
    }
  );

  return {
    events: data?.eventsByOwner,
    loading,
    error,
    refetch,
  };
}

/**
 * USE CHAIN METRICS
 *
 * Fetches metrics for a specific chain
 *
 * USAGE:
 * function ChainCard({ chainId }) {
 *   const { metrics, loading } = useChainMetrics({ chainId });
 *
 *   if (!metrics) return null;
 *
 *   return (
 *     <div>
 *       <h3>Chain: {chainId.slice(0, 8)}...</h3>
 *       <p>{metrics.totalEvents} events</p>
 *       <p>{metrics.uniqueUsers} users</p>
 *     </div>
 *   );
 * }
 */
export function useChainMetrics(variables: { chainId: string }, options?: any) {
  const { data, loading, error, refetch } = useQuery<GetChainMetricsResponse>(
    GET_CHAIN_METRICS,
    {
      variables,
      ...options,
    }
  );

  return {
    metrics: data?.chainMetrics,
    loading,
    error,
    refetch,
  };
}

/**
 * USE ALL CHAIN METRICS
 *
 * Fetches metrics for ALL chains in the network
 *
 * USAGE:
 * function ChainList() {
 *   const { chains, loading } = useAllChainMetrics();
 *
 *   return (
 *     <div>
 *       {chains?.map(({ chainId, metrics }) => (
 *         <ChainCard key={chainId} chainId={chainId} metrics={metrics} />
 *       ))}
 *     </div>
 *   );
 * }
 */
export function useAllChainMetrics(options?: any) {
  const { data, loading, error, refetch } = useQuery<GetAllChainMetricsResponse>(
    GET_ALL_CHAIN_METRICS,
    {
      pollInterval: POLLING_INTERVALS.STATS,
      ...options,
    }
  );

  return {
    chains: data?.allChainMetrics,
    loading,
    error,
    refetch,
  };
}

/**
 * USE USER EVENT COUNT
 *
 * Get the number of events a user has tracked
 *
 * USAGE:
 * function UserBadge({ address }) {
 *   const { count, loading } = useUserEventCount({ owner: address });
 *
 *   return <span>{count} events tracked</span>;
 * }
 */
export function useUserEventCount(variables: { owner: string }, options?: any) {
  const { data, loading, error, refetch } = useQuery<GetUserEventCountResponse>(
    GET_USER_EVENT_COUNT,
    {
      variables,
      ...options,
    }
  );

  return {
    count: data?.userEventCount,
    loading,
    error,
    refetch,
  };
}

/**
 * USE RECENT MESSAGES
 *
 * Fetches recent cross-chain messages
 *
 * USAGE:
 * function MessageFeed() {
 *   const { messages, loading } = useRecentMessages({ limit: 10 });
 *
 *   return (
 *     <div>
 *       {messages?.map(msg => (
 *         <MessageCard key={msg.messageId} message={msg} />
 *       ))}
 *     </div>
 *   );
 * }
 */
export function useRecentMessages(variables?: { limit?: number }, options?: any) {
  const { data, loading, error, refetch } = useQuery<GetRecentMessagesResponse>(
    GET_RECENT_MESSAGES,
    {
      variables,
      pollInterval: POLLING_INTERVALS.MESSAGES,
      ...options,
    }
  );

  return {
    messages: data?.recentMessages,
    loading,
    error,
    refetch,
  };
}

/**
 * USE MESSAGES
 *
 * Fetches all messages with pagination
 */
export function useMessages(variables?: { offset?: number; limit?: number }, options?: any) {
  const { data, loading, error, refetch, fetchMore } = useQuery<GetMessagesResponse>(
    GET_MESSAGES,
    {
      variables,
      ...options,
    }
  );

  return {
    messages: data?.messages,
    loading,
    error,
    refetch,
    fetchMore,
  };
}

/**
 * USE DASHBOARD DATA
 *
 * Fetches EVERYTHING needed for the dashboard in ONE query
 * This is more efficient than making multiple separate queries
 *
 * USAGE:
 * function Dashboard() {
 *   const { data, loading, error } = useDashboardData({
 *     eventsLimit: 10,
 *     messagesLimit: 5
 *   });
 *
 *   if (loading) return <Loader />;
 *   if (error) return <Error />;
 *
 *   return (
 *     <div>
 *       <StatsCards summary={data.analyticsSummary} />
 *       <EventFeed events={data.recentEvents} />
 *       <MessageFeed messages={data.recentMessages} />
 *       <ChainList chains={data.allChainMetrics} />
 *     </div>
 *   );
 * }
 */
export function useDashboardData(variables?: { eventsLimit?: number; messagesLimit?: number }, options?: any) {
  const { data, loading, error, refetch } = useQuery<GetDashboardDataResponse>(
    GET_DASHBOARD_DATA,
    {
      variables,
      pollInterval: POLLING_INTERVALS.STATS,
      ...options,
    }
  );

  return {
    data,
    loading,
    error,
    refetch,
  };
}

/**
 * USE TRACK EVENT (MUTATION)
 *
 * Hook for tracking a new event
 *
 * USAGE:
 * function EventForm() {
 *   const [trackEvent, { loading, error }] = useTrackEvent();
 *
 *   const handleSubmit = async (e) => {
 *     e.preventDefault();
 *
 *     const result = await trackEvent({
 *       variables: {
 *         eventType: "button_click",
 *         data: JSON.stringify({ button: "submit" })
 *       }
 *     });
 *
 *     // Parse the JSON response
 *     const response = JSON.parse(result.data.trackEvent);
 *     console.log("Event ID:", response.event_id);
 *   };
 *
 *   return (
 *     <form onSubmit={handleSubmit}>
 *       <button type="submit" disabled={loading}>
 *         {loading ? "Tracking..." : "Track Event"}
 *       </button>
 *     </form>
 *   );
 * }
 *
 * WHAT HAPPENS:
 * 1. User submits form
 * 2. trackEvent() is called with variables
 * 3. GraphQL mutation sent to Fluxera
 * 4. contract.rs execute_operation() runs
 * 5. Event saved to blockchain
 * 6. Response returned with event_id
 * 7. Apollo cache updated (can refetch queries automatically)
 */
export function useTrackEvent(options?: any) {
  return useMutation(TRACK_EVENT, {
    // After successful mutation, refetch these queries to update UI
    refetchQueries: [
      { query: GET_ANALYTICS_SUMMARY },
      { query: GET_RECENT_EVENTS },
    ],
    ...options,
  });
}

/**
 * USE SEND CROSS CHAIN MESSAGE (MUTATION)
 *
 * Hook for sending a message to another chain
 *
 * USAGE:
 * function SendMessageForm() {
 *   const [sendMessage, { loading, error }] = useSendCrossChainMessage();
 *
 *   const handleSend = async () => {
 *     const result = await sendMessage({
 *       variables: {
 *         targetChain: "chain_002",
 *         messageType: "analytics_sync",
 *         payload: JSON.stringify({ data: "..." })
 *       }
 *     });
 *
 *     const response = JSON.parse(result.data.sendCrossChainMessage);
 *     console.log("Message ID:", response.message_id);
 *   };
 *
 *   return <button onClick={handleSend}>Send Message</button>;
 * }
 *
 * WHAT HAPPENS:
 * 1. sendMessage() called with target chain and data
 * 2. GraphQL mutation sent
 * 3. contract.rs send_cross_chain_message() runs
 * 4. Linera's runtime.prepare_message().send_to() sends message
 * 5. Message stored on source chain
 * 6. Message delivered to target chain
 * 7. Response returned with message_id
 */
export function useSendCrossChainMessage(options?: any) {
  return useMutation(SEND_CROSS_CHAIN_MESSAGE, {
    // After sending message, refetch message lists
    refetchQueries: [
      { query: GET_ANALYTICS_SUMMARY },
      { query: GET_RECENT_MESSAGES },
    ],
    ...options,
  });
}
