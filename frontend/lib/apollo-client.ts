/**
 * APOLLO CLIENT CONFIGURATION
 *
 * This file sets up the Apollo Client for connecting to our Fluxera GraphQL API
 *
 * WHAT IS APOLLO CLIENT?
 * - It's a GraphQL client library for React
 * - Handles fetching data, caching, and state management
 * - Replaces traditional REST API calls with GraphQL queries
 *
 * HOW IT WORKS:
 * 1. We configure it to point to our Fluxera GraphQL endpoint
 * 2. Components use hooks like useQuery() and useMutation()
 * 3. Apollo automatically caches results and manages loading states
 * 4. It can poll for updates (refresh data every X seconds)
 *
 * DATA FLOW:
 * Component → useQuery hook → Apollo Client → HTTP Request →
 * Fluxera GraphQL API → Linera Blockchain → Data returned →
 * Apollo Cache → Component re-renders with data
 */

import { ApolloClient, InMemoryCache, HttpLink, ApolloLink } from '@apollo/client';
import { FLUXERA_CONFIG } from './constants';

/**
 * HTTP Link - Defines how to send requests to the GraphQL server
 * Points to our Fluxera application's GraphQL endpoint
 */
const httpLink = new HttpLink({
  uri: FLUXERA_CONFIG.APP_GRAPHQL_URL,
  // Credentials: 'include' would send cookies if we had authentication
  credentials: 'same-origin',
});

/**
 * Logging Link - Helps us debug GraphQL requests (disabled for Next.js compatibility)
 * Note: In development, you can see GraphQL queries in the Network tab of browser DevTools
 */
const loggingLink = new ApolloLink((operation, forward) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[GraphQL] ${operation.operationName}`, operation.variables);
  }
  return forward(operation);
});

/**
 * In Memory Cache - Apollo's caching system
 *
 * HOW CACHING WORKS:
 * - First query: Fetches from server, stores in cache
 * - Subsequent queries: Returns from cache instantly (no network request)
 * - Mutations: Automatically update cache when data changes
 *
 * TYPE POLICIES:
 * - Define how to merge arrays and objects when data updates
 * - For events: merge new events with existing ones
 */
const cache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        // When fetching events, merge new results with existing cache
        events: {
          merge(existing = [], incoming) {
            return [...existing, ...incoming];
          },
        },
        // Same for messages
        messages: {
          merge(existing = [], incoming) {
            return [...existing, ...incoming];
          },
        },
      },
    },
  },
});

/**
 * Apollo Client Instance
 * This is the main client that components will use
 *
 * CONFIGURATION:
 * - link: Chain of links (logging → http)
 * - cache: In-memory cache for storing query results
 * - defaultOptions: Set default behavior for all queries
 */
export const apolloClient = new ApolloClient({
  // Chain links: logging first (for debugging), then http (for actual requests)
  link: ApolloLink.from([
    loggingLink,  // Log all requests in development
    httpLink,     // Send actual HTTP requests
  ]),

  // Use our configured cache
  cache,

  // Default options for ALL queries
  defaultOptions: {
    watchQuery: {
      // 'cache-first': Try cache first, only fetch from network if not cached
      fetchPolicy: 'cache-first',
      errorPolicy: 'all',
    },
    query: {
      fetchPolicy: 'cache-first',
      errorPolicy: 'all',
    },
  },
});

/**
 * EXAMPLE USAGE IN A COMPONENT:
 *
 * import { useQuery } from '@apollo/client';
 * import { GET_ANALYTICS } from '@/lib/graphql/queries';
 *
 * function MyComponent() {
 *   const { data, loading, error } = useQuery(GET_ANALYTICS, {
 *     pollInterval: 5000  // Refresh every 5 seconds
 *   });
 *
 *   if (loading) return <Loader />;
 *   if (error) return <Error message={error.message} />;
 *
 *   return <div>{data.analyticsSummary.totalEvents}</div>;
 * }
 */
