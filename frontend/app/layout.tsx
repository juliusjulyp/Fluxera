/**
 * ROOT LAYOUT
 *
 * This is the root layout for the entire application
 * It wraps all pages with providers and global styles
 *
 * WHAT'S HAPPENING HERE:
 * 1. Fonts are loaded (Inter for text, JetBrains Mono for code)
 * 2. Global CSS is imported
 * 3. Metadata is set (page title, description for SEO)
 * 4. ApolloProvider is added to enable GraphQL throughout the app
 *
 * WHY ApolloProviderWrapper:
 * - Next.js 13+ layouts are Server Components by default
 * - Apollo requires Client Component (browser-side React context)
 * - We created ApolloProviderWrapper as a separate client component
 * - Now GraphQL works everywhere in the app!
 */

import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { ApolloProviderWrapper } from "@/components/providers/ApolloProvider";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Fluxera Dashboard - Linera Analytics",
  description: "Real-time analytics and indexing for Linera microchains. Track events, monitor chains, and visualize cross-chain activity.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}
      >
        {/*
          ApolloProviderWrapper makes GraphQL available to all components
          Now any component can use:
          - useAnalyticsSummary()
          - useRecentEvents()
          - useTrackEvent()
          - etc.
        */}
        <ApolloProviderWrapper>
          {children}
        </ApolloProviderWrapper>
      </body>
    </html>
  );
}
