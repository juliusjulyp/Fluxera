'use client';

/**
 * GLOBAL SEARCH CONTEXT
 *
 * Provides global search state that can be used across components.
 * The Navbar search bar writes to this context, and components like
 * EventsTable and MessageTracer can read from it.
 */

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface SearchContextType {
  globalSearch: string;
  setGlobalSearch: (query: string) => void;
}

const SearchContext = createContext<SearchContextType | null>(null);

export function SearchProvider({ children }: { children: ReactNode }) {
  const [globalSearch, setGlobalSearch] = useState('');

  return (
    <SearchContext.Provider value={{ globalSearch, setGlobalSearch }}>
      {children}
    </SearchContext.Provider>
  );
}

export function useGlobalSearch() {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useGlobalSearch must be used within a SearchProvider');
  }
  return context;
}
