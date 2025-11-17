// API client for Fluxera indexer
// This handles all communication with the Rust backend

// Base URL for our Fluxera indexer API
const API_BASE_URL = 'http://localhost:3001';

// TypeScript interfaces matching our API responses
export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
  count?: number;
}

export interface HealthData {
  database: string;
  status: string;
  total_events: number;
  unique_microchains: number;
  latest_block: number | null;
}

export interface StatsData {
  total_events: number;
  unique_microchains: number;
  latest_block_height: number | null;
}

export interface EventData {
  id: string;
  event_type: string;
  block_height: number;
  microchain_id: string;
  timestamp: number;
  transaction_data?: string;
  contract_event_data?: string;
  state_change_data?: string;
  created_at: string;
}

// Generic API request function
async function apiRequest<T>(endpoint: string): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data: ApiResponse<T> = await response.json();
    return data;
  } catch (error) {
    console.error('API request failed:', error);
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// API functions for each endpoint

/**
 * Test if the indexer API is healthy and connected
 */
export async function fetchHealth(): Promise<ApiResponse<HealthData>> {
  return apiRequest<HealthData>('/health');
}

/**
 * Get database statistics (total events, chains, etc.)
 */
export async function fetchStats(): Promise<ApiResponse<StatsData>> {
  return apiRequest<StatsData>('/stats');
}

/**
 * Get all events with optional filtering
 */
export async function fetchEvents(params?: {
  microchain_id?: string;
  start_height?: number;
  end_height?: number;
  limit?: number;
}): Promise<ApiResponse<EventData[]>> {
  let endpoint = '/events';
  
  if (params) {
    const searchParams = new URLSearchParams();
    if (params.microchain_id) searchParams.append('microchain_id', params.microchain_id);
    if (params.start_height) searchParams.append('start_height', params.start_height.toString());
    if (params.end_height) searchParams.append('end_height', params.end_height.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    
    const query = searchParams.toString();
    if (query) endpoint += `?${query}`;
  }
  
  return apiRequest<EventData[]>(endpoint);
}

/**
 * Get recent events (last 10 by default)
 */
export async function fetchRecentEvents(): Promise<ApiResponse<EventData[]>> {
  return apiRequest<EventData[]>('/events/recent');
}

/**
 * Get events for a specific microchain
 */
export async function fetchMicrochainEvents(chainId: string): Promise<ApiResponse<EventData[]>> {
  return apiRequest<EventData[]>(`/events/microchain/${chainId}`);
}

/**
 * Get events within a block height range
 */
export async function fetchEventsByHeight(startHeight: number, endHeight: number): Promise<ApiResponse<EventData[]>> {
  return apiRequest<EventData[]>(`/events/height/${startHeight}/${endHeight}`);
}

// Utility function to check if API is accessible
export async function checkApiConnection(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      timeout: 5000, // 5 second timeout
    } as any);
    return response.ok;
  } catch {
    return false;
  }
}