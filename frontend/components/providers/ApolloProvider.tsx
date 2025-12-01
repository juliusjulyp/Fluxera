/**
 * APOLLO PROVIDER WRAPPER
 *
 * This component wraps the app with ApolloProvider to make GraphQL available everywhere
 *
 * WHY WE NEED THIS:
 * - Next.js 13+ app directory uses Server Components by default
 * - ApolloProvider must be a Client Component (uses React context)
 * - Solution: Create a separate client component for the provider
 *
 * HOW IT WORKS:
 * 1. This file is marked "use client" so it runs in the browser
 * 2. It imports our apolloClient configuration
 * 3. Wraps children with <ApolloProvider client={apolloClient}>
 * 4. Now any child component can use Apollo hooks (useQuery, useMutation)
 *
 * USAGE IN LAYOUT.TSX:
 * import { ApolloProviderWrapper } from './components/providers/ApolloProvider';
 *
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         <ApolloProviderWrapper>
 *           {children}
 *         </ApolloProviderWrapper>
 *       </body>
 *     </html>
 *   );
 * }
 *
 * THEN IN ANY COMPONENT:
 * import { useAnalyticsSummary } from '@/hooks/useFluxera';
 *
 * function MyComponent() {
 *   const { summary, loading } = useAnalyticsSummary();
 *   // It just works! No additional setup needed.
 * }
 */

'use client'; // This is a Client Component (runs in browser)

/**
 * IMPORTANT: ApolloProvider for Next.js
 *
 * Import from '@apollo/client/react' for proper Next.js 13+ compatibility
 */
import { ApolloProvider } from '@apollo/client/react';
import { apolloClient } from '@/lib/apollo-client';

interface ApolloProviderWrapperProps {
  children: React.ReactNode;
}

/**
 * Wraps children with Apollo Client provider
 *
 * WHAT THIS ENABLES:
 * - All child components can use useQuery() hook to fetch data
 * - All child components can use useMutation() hook to change data
 * - Automatic caching of query results
 * - Automatic refetching when mutations complete
 * - Polling support for real-time updates
 *
 * DATA FLOW:
 * Component → useQuery hook → Apollo Client → HTTP Request →
 * Fluxera GraphQL API (localhost:8080) → Linera Blockchain →
 * Response → Apollo Cache → Component re-renders
 */
export function ApolloProviderWrapper({ children }: ApolloProviderWrapperProps) {
  return (
    <ApolloProvider client={apolloClient}>
      {children}
    </ApolloProvider>
  );
}
