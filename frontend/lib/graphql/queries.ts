/**
 * GRAPHQL QUERIES FOR FLUXERA
 *
 * These queries fetch data from our Fluxera WebAssembly application
 *
 * HOW GRAPHQL QUERIES WORK:
 * 1. We define what data we want using GraphQL query language
 * 2. Apollo Client sends the query to our Fluxera GraphQL endpoint
 * 3. The Linera service routes it to our service.rs implementation
 * 4. Our Rust code executes the query (e.g., analyticsSummary() function)
 * 5. Data is returned as JSON
 * 6. Apollo Client caches it and returns to our React component
 *
 * MAPPING TO RUST CODE:
 * Each query here corresponds to a function in service.rs:
 * - analyticsSummary → async fn analytics_summary()
 * - recentEvents → async fn recent_events()
 * - etc.
 */

import { gql } from '@apollo/client';

/**
 * GET_ANALYTICS_SUMMARY
 *
 * Fetches high-level statistics about the entire analytics system
 *
 * WHAT IT RETURNS:
 * - totalEvents: Count of all events tracked (from state.total_event_count)
 * - totalMessages: Count of cross-chain messages sent (from state.total_messages)
 * - uniqueUsers: Number of distinct users who have tracked events
 * - chainId: The current chain ID this app is running on
 *
 * RUST CODE IN service.rs (line 77-84):
 * async fn analytics_summary(&self) -> AnalyticsSummary {
 *   AnalyticsSummary {
 *     total_events: *self.state.total_event_count.get(),
 *     total_messages: *self.state.total_messages.get(),
 *     unique_users: self.state.user_event_counts.indices().await.len(),
 *     chain_id: self.runtime.chain_id().to_string(),
 *   }
 * }
 *
 * USE CASE: Display on dashboard - "You have 1,250 events across 42 users"
 */
export const GET_ANALYTICS_SUMMARY = gql`
  query GetAnalyticsSummary {
    analyticsSummary {
      totalEvents
      totalMessages
      uniqueUsers
      chainId
    }
  }
`;

/**
 * GET_RECENT_EVENTS
 *
 * Fetches the most recent events (like a timeline or activity feed)
 *
 * PARAMETERS:
 * - $limit: How many events to return (default: 10 in Rust code)
 *
 * WHAT IT RETURNS:
 * - eventId: Unique ID in format "{chainId}-{count}"
 * - eventType: Type like "page_view", "user_signup", etc.
 * - owner: Address of the user who triggered the event
 * - timestamp: When the event occurred
 * - data: JSON string with custom event data
 * - chainId: Which chain this event is from
 *
 * RUST CODE IN service.rs (line 86-99):
 * async fn recent_events(&self, limit: Option<usize>) -> Vec<AnalyticsEvent> {
 *   // Gets last N events from the LogView
 * }
 *
 * USE CASE: Show latest activity - "John signed up 2 minutes ago"
 */
export const GET_RECENT_EVENTS = gql`
  query GetRecentEvents($limit: Int) {
    recentEvents(limit: $limit) {
      eventId
      eventType
      owner
      timestamp
      data
      chainId
    }
  }
`;

/**
 * GET_EVENTS_PAGINATED
 *
 * Fetches all events with pagination support
 *
 * PARAMETERS:
 * - $offset: Skip this many events (for pagination)
 * - $limit: Return this many events (default: 100)
 *
 * WHY PAGINATION:
 * If you have 100,000 events, you can't load them all at once!
 * Pagination lets you load page by page:
 * - Page 1: offset=0, limit=100  (events 0-99)
 * - Page 2: offset=100, limit=100  (events 100-199)
 * - etc.
 *
 * RUST CODE IN service.rs (line 101-115):
 * async fn events(&self, offset: Option<usize>, limit: Option<usize>)
 *
 * USE CASE: Event explorer page with infinite scroll
 */
export const GET_EVENTS = gql`
  query GetEvents($offset: Int, $limit: Int) {
    events(offset: $offset, limit: $limit) {
      eventId
      eventType
      owner
      timestamp
      data
      chainId
    }
  }
`;

/**
 * GET_EVENTS_BY_TYPE
 *
 * Filter events by their type
 *
 * PARAMETERS:
 * - $eventType: Filter by this type (e.g., "page_view")
 * - $limit: Maximum events to return
 *
 * HOW IT WORKS:
 * Loops through all events and only returns ones matching the type
 * (See service.rs line 137-157)
 *
 * USE CASE: "Show me all button clicks" or "Show me all transactions"
 */
export const GET_EVENTS_BY_TYPE = gql`
  query GetEventsByType($eventType: String!, $limit: Int) {
    eventsByType(eventType: $eventType, limit: $limit) {
      eventId
      eventType
      owner
      timestamp
      data
      chainId
    }
  }
`;

/**
 * GET_EVENTS_BY_OWNER
 *
 * Get all events for a specific user/address
 *
 * PARAMETERS:
 * - $owner: User address (e.g., "0x123...")
 * - $limit: Maximum events to return
 *
 * HOW IT WORKS:
 * Filters events where event.owner == $owner
 * (See service.rs line 117-134)
 *
 * USE CASE: User profile page - "Show all of Alice's activity"
 */
export const GET_EVENTS_BY_OWNER = gql`
  query GetEventsByOwner($owner: String!, $limit: Int) {
    eventsByOwner(owner: $owner, limit: $limit) {
      eventId
      eventType
      owner
      timestamp
      data
      chainId
    }
  }
`;

/**
 * GET_CHAIN_METRICS
 *
 * Get analytics metrics for a specific chain
 *
 * PARAMETERS:
 * - $chainId: The chain to get metrics for
 *
 * WHAT IT RETURNS:
 * - totalEvents: Events on this chain
 * - uniqueUsers: Users active on this chain
 * - lastActivity: Timestamp of most recent event
 * - eventTypes: JSON object with count per event type
 *   Example: {"page_view": 500, "click": 300}
 *
 * RUST CODE IN service.rs (line 159-167):
 * async fn chain_metrics(&self, chain_id: String) -> Option<ChainMetrics>
 *
 * USE CASE: Chain explorer - "This chain has 1,250 events from 42 users"
 */
export const GET_CHAIN_METRICS = gql`
  query GetChainMetrics($chainId: String!) {
    chainMetrics(chainId: $chainId) {
      totalEvents
      uniqueUsers
      lastActivity
      eventTypes
    }
  }
`;

/**
 * GET_ALL_CHAIN_METRICS
 *
 * Get metrics for ALL chains in the network
 *
 * WHAT IT RETURNS:
 * Array of chain metrics with chain IDs:
 * [
 *   { chainId: "chain_001", metrics: { totalEvents: 100, ... } },
 *   { chainId: "chain_002", metrics: { totalEvents: 200, ... } },
 * ]
 *
 * RUST CODE IN service.rs (line 169-183):
 * async fn all_chain_metrics() -> Vec<ChainMetricsWithId>
 *
 * USE CASE: Network overview - "10 chains active with 5,000 total events"
 */
export const GET_ALL_CHAIN_METRICS = gql`
  query GetAllChainMetrics {
    allChainMetrics {
      chainId
      metrics {
        totalEvents
        uniqueUsers
        lastActivity
        eventTypes
      }
    }
  }
`;

/**
 * GET_USER_EVENT_COUNT
 *
 * Get the number of events a specific user has triggered
 *
 * PARAMETERS:
 * - $owner: User address
 *
 * RETURNS:
 * Just a number - how many events this user has created
 *
 * RUST CODE IN service.rs (line 185-194):
 * async fn user_event_count(&self, owner: String) -> u64
 *
 * USE CASE: User badge - "You've tracked 1,250 events!"
 */
export const GET_USER_EVENT_COUNT = gql`
  query GetUserEventCount($owner: String!) {
    userEventCount(owner: $owner)
  }
`;

/**
 * GET_RECENT_MESSAGES
 *
 * Get the most recent cross-chain messages
 *
 * PARAMETERS:
 * - $limit: How many messages to return (default: 10)
 *
 * WHAT IT RETURNS:
 * - messageId: Unique message ID
 * - sourceChain: Chain that sent the message
 * - targetChain: Chain that should receive it
 * - messageType: Type of message (e.g., "analytics_sync")
 * - sentAt: When it was sent
 * - payload: JSON data being sent
 *
 * RUST CODE IN service.rs (line 196-209):
 * async fn recent_messages(&self, limit: Option<usize>)
 *
 * USE CASE: Cross-chain message tracker - "Chain A sent message to Chain B"
 */
export const GET_RECENT_MESSAGES = gql`
  query GetRecentMessages($limit: Int) {
    recentMessages(limit: $limit) {
      messageId
      sourceChain
      targetChain
      messageType
      sentAt
      payload
    }
  }
`;

/**
 * GET_MESSAGES_PAGINATED
 *
 * Get all cross-chain messages with pagination
 *
 * PARAMETERS:
 * - $offset: Skip this many messages
 * - $limit: Return this many messages (default: 100)
 *
 * RUST CODE IN service.rs (line 211-229):
 * async fn messages(&self, offset: Option<usize>, limit: Option<usize>)
 *
 * USE CASE: Message explorer with pagination
 */
export const GET_MESSAGES = gql`
  query GetMessages($offset: Int, $limit: Int) {
    messages(offset: $offset, limit: $limit) {
      messageId
      sourceChain
      targetChain
      messageType
      sentAt
      payload
    }
  }
`;

/**
 * COMPLETE DASHBOARD QUERY
 *
 * This query fetches EVERYTHING needed for the dashboard in ONE request
 *
 * WHY THIS IS POWERFUL:
 * With REST, you'd need 3 separate API calls:
 * - GET /api/stats
 * - GET /api/events
 * - GET /api/messages
 *
 * With GraphQL, ONE request gets all the data!
 *
 * PARAMETERS:
 * - $eventsLimit: How many events to fetch
 * - $messagesLimit: How many messages to fetch
 *
 * USE CASE: Dashboard page loads everything at once
 */
export const GET_DASHBOARD_DATA = gql`
  query GetDashboardData($eventsLimit: Int, $messagesLimit: Int) {
    analyticsSummary {
      totalEvents
      totalMessages
      uniqueUsers
      chainId
    }
    recentEvents(limit: $eventsLimit) {
      eventId
      eventType
      owner
      timestamp
      data
      chainId
    }
    recentMessages(limit: $messagesLimit) {
      messageId
      sourceChain
      targetChain
      messageType
      sentAt
      payload
    }
    allChainMetrics {
      chainId
      metrics {
        totalEvents
        uniqueUsers
        lastActivity
        eventTypes
      }
    }
  }
`;
