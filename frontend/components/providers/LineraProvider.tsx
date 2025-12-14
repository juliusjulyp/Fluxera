'use client';

/**
 * LINERA PROVIDER
 *
 * Dual-mode React context provider with multi-wallet support:
 * 1. PUBLIC MODE - Read-only access to blockchain data (no wallet needed)
 * 2. WALLET MODE - Full access including mutations (after wallet connection)
 *
 * SUPPORTED WALLETS:
 * - CheCko (browser extension) - window.linera with Web3-style API
 * - Croissant (browser extension) - window.linera with Linera-native API
 * - Session Wallet (faucet) - temporary wallet for quick demos
 *
 * Users can explore the app without connecting, then connect when they
 * want to track events or send messages.
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  ReactNode,
} from 'react';
import { LINERA_CONFIG } from '@/lib/linera-config';
import { setQueryChainId } from '@/lib/public-client';

// ============================================
// TYPES
// ============================================

export type WalletType = 'checko' | 'croissant' | 'session' | null;

interface WalletState {
  isConnected: boolean;
  isConnecting: boolean;
  walletType: WalletType;
  chainId: string | null;
  address: string | null;        // Display address (truncated)
  fullAddress: string | null;    // Full address for copying
  error: Error | null;
  // Network status - validators can be flaky on testnet
  networkStatus: 'connected' | 'reconnecting' | 'degraded' | 'disconnected';
  connectedAt: string | null;    // Connection timestamp
}

interface LineraContextType {
  // Wallet state
  wallet: WalletState;

  // Wallet detection
  availableWallets: WalletType[];
  detectWallets: () => void;

  // Actions
  connect: (walletType: WalletType) => Promise<void>;
  disconnect: () => void;

  // Authenticated operations (require wallet)
  trackEvent: (eventType: string, data: string) => Promise<TrackEventResult>;
  sendMessage: (targetChain: string, messageType: string, payload: string) => Promise<SendMessageResult>;

  // Query through authenticated wallet (for reading data from user's chain)
  query: (graphqlQuery: string) => Promise<any>;
}

interface TrackEventResult {
  success: boolean;
  eventId?: string;
  timestamp?: string;
  error?: string;
}

interface SendMessageResult {
  success: boolean;
  messageId?: string;
  timestamp?: string;
  error?: string;
}

// Linera notification type
interface LineraNotification {
  reason: {
    NewBlock?: boolean;
  };
}

// Window type extension for wallet providers
declare global {
  interface Window {
    linera?: {
      // CheCko (Web3-style)
      request?: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      // Croissant (Linera-native)
      request?: (args: { type: string; chainId?: string; appId?: string; query?: string }) => Promise<unknown>;
      on?: (event: string, callback: (data: unknown) => void) => void;
      off?: (event: string, callback: (data: unknown) => void) => void;
      isCheCko?: boolean;
      isCroissant?: boolean;
    };
  }
}

// ============================================
// CONTEXT
// ============================================

const LineraContext = createContext<LineraContextType | null>(null);

// ============================================
// PROVIDER
// ============================================

interface LineraProviderProps {
  children: ReactNode;
  onNewBlock?: () => void;
}

export function LineraProvider({ children, onNewBlock }: LineraProviderProps) {
  // Wallet state
  const [wallet, setWallet] = useState<WalletState>({
    isConnected: false,
    isConnecting: false,
    walletType: null,
    chainId: null,
    address: null,
    fullAddress: null,
    error: null,
    networkStatus: 'disconnected',
    connectedAt: null,
  });

  // Available wallets
  const [availableWallets, setAvailableWallets] = useState<WalletType[]>(['session']);

  // Refs for Linera client objects
  const clientRef = useRef<any>(null);
  const backendRef = useRef<any>(null);
  const onNewBlockRef = useRef(onNewBlock);
  const extensionProviderRef = useRef<Window['linera'] | null>(null);

  // Update callback ref
  useEffect(() => {
    onNewBlockRef.current = onNewBlock;
  }, [onNewBlock]);

  /**
   * Detect available wallet extensions
   */
  const detectWallets = useCallback(() => {
    const wallets: WalletType[] = ['session']; // Session wallet always available

    if (typeof window !== 'undefined' && window.linera) {
      // Check for CheCko
      if (window.linera.isCheCko) {
        wallets.unshift('checko');
      }
      // Check for Croissant
      else if (window.linera.isCroissant) {
        wallets.unshift('croissant');
      }
      // Generic window.linera detected (could be either)
      else if (window.linera.request) {
        // Try to detect based on API style
        wallets.unshift('checko'); // Default to checko if unclear
      }
    }

    setAvailableWallets(wallets);
    console.log('[Linera] Detected wallets:', wallets);
  }, []);

  // Detect wallets on mount
  useEffect(() => {
    // Wait a bit for extensions to inject
    const timer = setTimeout(detectWallets, 500);
    return () => clearTimeout(timer);
  }, [detectWallets]);

  // Track if we should attempt restore
  const shouldRestoreRef = useRef(true);

  /**
   * Connect via CheCko wallet extension
   */
  const connectCheCko = useCallback(async () => {
    if (!window.linera?.request) {
      throw new Error('CheCko wallet not found. Please install the extension.');
    }

    console.log('[Linera] Connecting to CheCko...');
    extensionProviderRef.current = window.linera;

    // Request accounts (Web3-style)
    const accounts = await window.linera.request({ method: 'eth_requestAccounts' }) as string[];

    if (!accounts || accounts.length === 0) {
      throw new Error('No accounts returned from CheCko');
    }

    const chainId = accounts[0];

    // Set up notification listener if available
    if (window.linera.on) {
      window.linera.on('notification', (data: unknown) => {
        const notification = data as LineraNotification;
        if (notification?.reason?.NewBlock && onNewBlockRef.current) {
          onNewBlockRef.current();
        }
      });
    }

    return { chainId, address: chainId };
  }, []);

  /**
   * Connect via Croissant wallet extension
   */
  const connectCroissant = useCallback(async () => {
    if (!window.linera?.request) {
      throw new Error('Croissant wallet not found. Please install the extension.');
    }

    console.log('[Linera] Connecting to Croissant...');
    extensionProviderRef.current = window.linera;

    // Request wallet connection (Croissant-style)
    const response = await window.linera.request({ type: 'CONNECT_WALLET' }) as {
      success: boolean;
      data?: { chainId: string; address?: string };
      error?: string;
    };

    if (!response.success) {
      throw new Error(response.error || 'Failed to connect to Croissant');
    }

    const chainId = response.data?.chainId;
    if (!chainId) {
      throw new Error('No chain ID returned from Croissant');
    }

    // Set up notification listener
    if (window.linera.on) {
      window.linera.on('notification', (data: unknown) => {
        const notification = data as LineraNotification;
        if (notification?.reason?.NewBlock && onNewBlockRef.current) {
          onNewBlockRef.current();
        }
      });
    }

    return { chainId, address: response.data?.address || chainId };
  }, []);

  /**
   * Connect via session wallet (faucet)
   */
  const connectSession = useCallback(async () => {
    console.log('[Linera] Loading WASM module...');

    // Load @linera/client using runtime loader
    const { loadLineraClient } = await import('@/lib/linera-loader');
    const linera = await loadLineraClient();

    console.log('[Linera] Connecting to faucet:', LINERA_CONFIG.FAUCET_URL);

    // Get classes from linera module
    const Faucet = linera.Faucet;
    const Client = linera.Client;
    const PrivateKeySigner = linera.PrivateKeySigner;

    if (!Faucet || !Client) {
      throw new Error('Linera client classes not found');
    }

    // Create faucet connection
    const faucet = new Faucet(LINERA_CONFIG.FAUCET_URL);

    // Create wallet from faucet (gets genesis config)
    console.log('[Linera] Creating session wallet...');
    const wallet = await faucet.createWallet();

    // Create a random signer for this session
    console.log('[Linera] Creating session signer...');
    let signer;
    if (PrivateKeySigner?.createRandom) {
      signer = PrivateKeySigner.createRandom();
    } else {
      // Fallback: create a simple signer object
      console.log('[Linera] PrivateKeySigner not available, using null signer');
      signer = null;
    }

    // Get owner address from signer
    const owner = signer?.address?.() || null;
    console.log('[Linera] Owner address:', owner);

    // Claim chain from faucet (includes free tokens)
    console.log('[Linera] Claiming chain from faucet...');
    const chainId = await faucet.claimChain(wallet, owner);
    console.log('[Linera] Chain claimed successfully!');
    console.log('[Linera] Chain Details:');
    console.log('  - Chain ID:', chainId);
    console.log('  - Owner:', owner || 'Not set');
    console.log('  - Faucet URL:', LINERA_CONFIG.FAUCET_URL);

    // Create client with wallet, signer, and skip_process_inbox=false
    // Note: Client constructor returns a Promise
    console.log('[Linera] Creating client...');
    const clientResult = new Client(wallet, signer, false);
    const client = await clientResult;
    clientRef.current = client;

    // Connect to Fluxera app if APP_ID is configured
    if (LINERA_CONFIG.APP_ID && client?.application) {
      console.log('[Linera] Connecting to Fluxera app:', LINERA_CONFIG.APP_ID);
      const backend = await client.application(LINERA_CONFIG.APP_ID);
      backendRef.current = backend;
    }

    // Set up notifications for real-time updates
    if (client?.onNotification) {
      client.onNotification((notification: LineraNotification) => {
        if (notification.reason.NewBlock && onNewBlockRef.current) {
          onNewBlockRef.current();
        }
      });
    }

    return { chainId, address: owner || chainId };
  }, []);

  /**
   * Connect wallet
   */
  const connect = useCallback(async (walletType: WalletType) => {
    if (wallet.isConnecting || wallet.isConnected) {
      return;
    }

    if (!walletType) {
      return;
    }

    setWallet(prev => ({ ...prev, isConnecting: true, error: null }));

    try {
      let result: { chainId: string; address: string };

      switch (walletType) {
        case 'checko':
          result = await connectCheCko();
          break;
        case 'croissant':
          result = await connectCroissant();
          break;
        case 'session':
          result = await connectSession();
          break;
        default:
          throw new Error(`Unknown wallet type: ${walletType}`);
      }

      const displayAddress = result.address.length > 20
        ? result.address.slice(0, 16) + '...'
        : result.address;
      const connectedAt = new Date().toISOString();

      // Update state
      setWallet({
        isConnected: true,
        isConnecting: false,
        walletType,
        chainId: result.chainId,
        address: displayAddress,
        fullAddress: result.address,
        error: null,
        networkStatus: 'connected',
        connectedAt,
      });

      // Update public query client to use this chain
      setQueryChainId(result.chainId);

      // Save to localStorage for persistence
      if (typeof window !== 'undefined') {
        localStorage.setItem(LINERA_CONFIG.STORAGE_KEYS.WALLET_TYPE, walletType);
        localStorage.setItem(LINERA_CONFIG.STORAGE_KEYS.CHAIN_ID, result.chainId);
        localStorage.setItem(LINERA_CONFIG.STORAGE_KEYS.ADDRESS, displayAddress);
      }

      // Log wallet details
      console.log('='.repeat(50));
      console.log('[Linera] Wallet Connected Successfully!');
      console.log('='.repeat(50));
      console.log('[Linera] Wallet Details:');
      console.log('  - Wallet Type:', walletType);
      console.log('  - Chain ID:', result.chainId);
      console.log('  - Address:', result.address);
      console.log('  - Display Address:', displayAddress);
      console.log('  - Network Status:', 'connected');
      console.log('  - Timestamp:', new Date().toISOString());
      console.log('='.repeat(50));

    } catch (error) {
      console.error('[Linera] Connection failed:', error);
      setWallet(prev => ({
        ...prev,
        isConnecting: false,
        error: error instanceof Error ? error : new Error('Connection failed'),
        networkStatus: 'disconnected',
      }));
    }
  }, [wallet.isConnecting, wallet.isConnected, connectCheCko, connectCroissant, connectSession]);

  /**
   * Disconnect wallet
   */
  const disconnect = useCallback(() => {
    // Clean up extension listeners
    if (extensionProviderRef.current?.off) {
      extensionProviderRef.current.off('notification', () => {});
    }

    clientRef.current = null;
    backendRef.current = null;
    extensionProviderRef.current = null;

    // Clear localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem(LINERA_CONFIG.STORAGE_KEYS.WALLET_TYPE);
      localStorage.removeItem(LINERA_CONFIG.STORAGE_KEYS.CHAIN_ID);
      localStorage.removeItem(LINERA_CONFIG.STORAGE_KEYS.ADDRESS);
    }

    setWallet({
      isConnected: false,
      isConnecting: false,
      walletType: null,
      chainId: null,
      address: null,
      fullAddress: null,
      error: null,
      networkStatus: 'disconnected',
      connectedAt: null,
    });

    // Reset public query client to default chain
    setQueryChainId(null);

    console.log('[Linera] Disconnected');
  }, []);

  // Try to restore wallet from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!shouldRestoreRef.current) return;
    shouldRestoreRef.current = false; // Only try once

    const savedWalletType = localStorage.getItem(LINERA_CONFIG.STORAGE_KEYS.WALLET_TYPE) as WalletType;
    const savedChainId = localStorage.getItem(LINERA_CONFIG.STORAGE_KEYS.CHAIN_ID);

    if (savedWalletType && savedChainId) {
      console.log('[Linera] Found saved wallet:', savedWalletType);

      // For extension wallets, try to reconnect after a delay
      if (savedWalletType === 'checko' || savedWalletType === 'croissant') {
        const timer = setTimeout(() => {
          if (availableWallets.includes(savedWalletType)) {
            console.log('[Linera] Restoring extension wallet...');
            connect(savedWalletType);
          } else {
            console.log('[Linera] Extension not available, clearing storage');
            localStorage.removeItem(LINERA_CONFIG.STORAGE_KEYS.WALLET_TYPE);
            localStorage.removeItem(LINERA_CONFIG.STORAGE_KEYS.CHAIN_ID);
            localStorage.removeItem(LINERA_CONFIG.STORAGE_KEYS.ADDRESS);
          }
        }, 1000);
        return () => clearTimeout(timer);
      } else if (savedWalletType === 'session') {
        // Session wallets are ephemeral and can't be restored
        console.log('[Linera] Session wallet cannot be restored. Please reconnect.');
        localStorage.removeItem(LINERA_CONFIG.STORAGE_KEYS.WALLET_TYPE);
        localStorage.removeItem(LINERA_CONFIG.STORAGE_KEYS.CHAIN_ID);
        localStorage.removeItem(LINERA_CONFIG.STORAGE_KEYS.ADDRESS);
      }
    }
  }, [availableWallets, connect]);

  /**
   * Execute a query via the connected wallet
   */
  const executeQuery = useCallback(async (query: string): Promise<any> => {
    // Session wallet uses backend ref
    if (backendRef.current) {
      const payload = JSON.stringify({ query });
      const response = await backendRef.current.query(payload);
      return JSON.parse(response);
    }

    // Extension wallets use window.linera
    if (extensionProviderRef.current?.request) {
      // Croissant-style query
      const response = await extensionProviderRef.current.request({
        type: 'QUERY',
        appId: LINERA_CONFIG.APP_ID,
        query,
      }) as { success: boolean; data?: unknown; error?: string };

      if (!response.success) {
        throw new Error(response.error || 'Query failed');
      }

      return response.data;
    }

    throw new Error('No wallet connected');
  }, []);

  /**
   * Track an event (requires wallet)
   */
  const trackEvent = useCallback(async (
    eventType: string,
    data: string
  ): Promise<TrackEventResult> => {
    if (!wallet.isConnected) {
      return { success: false, error: 'Wallet not connected' };
    }

    try {
      const mutation = `mutation { trackEvent(eventType: "${eventType}", data: "${data.replace(/"/g, '\\"')}") }`;
      console.log('[Linera] Tracking event...');
      console.log('[Linera] Event Type:', eventType);
      console.log('[Linera] Data:', data);

      const result = await executeQuery(mutation);
      console.log('[Linera] Raw response:', result);

      if (result.errors?.length > 0) {
        return { success: false, error: result.errors[0].message };
      }

      // Handle the response - it might be JSON string, plain string, or object
      const responseData = result.data?.trackEvent;
      console.log('[Linera] Response data:', responseData);

      // If no response, still consider it successful (mutation executed)
      if (!responseData) {
        return {
          success: true,
          eventId: `evt_${Date.now()}`,
          timestamp: new Date().toISOString(),
        };
      }

      // Try to parse if it's a JSON string
      if (typeof responseData === 'string') {
        try {
          const trackResult = JSON.parse(responseData);
          return {
            success: true,
            eventId: trackResult.event_id || trackResult.eventId || responseData,
            timestamp: trackResult.timestamp || new Date().toISOString(),
          };
        } catch {
          // Not JSON, use the string as event ID
          return {
            success: true,
            eventId: responseData || `evt_${Date.now()}`,
            timestamp: new Date().toISOString(),
          };
        }
      }

      // If it's already an object
      if (typeof responseData === 'object') {
        return {
          success: true,
          eventId: responseData.event_id || responseData.eventId || `evt_${Date.now()}`,
          timestamp: responseData.timestamp || new Date().toISOString(),
        };
      }

      return {
        success: true,
        eventId: `evt_${Date.now()}`,
        timestamp: new Date().toISOString(),
      };

    } catch (error) {
      console.error('[Linera] Track event failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }, [wallet.isConnected, executeQuery]);

  /**
   * Send cross-chain message (requires wallet)
   */
  const sendMessage = useCallback(async (
    targetChain: string,
    messageType: string,
    payload: string
  ): Promise<SendMessageResult> => {
    if (!wallet.isConnected) {
      return { success: false, error: 'Wallet not connected' };
    }

    try {
      const mutation = `mutation { sendCrossChainMessage(targetChain: "${targetChain}", messageType: "${messageType}", payload: "${payload.replace(/"/g, '\\"')}") }`;
      console.log('[Linera] Sending cross-chain message...');
      console.log('[Linera] Target Chain:', targetChain);
      console.log('[Linera] Message Type:', messageType);
      console.log('[Linera] Payload:', payload);

      const result = await executeQuery(mutation);
      console.log('[Linera] Raw response:', result);

      if (result.errors?.length > 0) {
        return { success: false, error: result.errors[0].message };
      }

      // Handle the response - it might be JSON string, plain string, or object
      const responseData = result.data?.sendCrossChainMessage;
      console.log('[Linera] Response data:', responseData);

      // If no response, still consider it successful (mutation executed)
      if (!responseData) {
        return {
          success: true,
          messageId: `msg_${Date.now()}`,
          timestamp: new Date().toISOString(),
        };
      }

      // Try to parse if it's a JSON string
      if (typeof responseData === 'string') {
        try {
          const sendResult = JSON.parse(responseData);
          return {
            success: true,
            messageId: sendResult.message_id || sendResult.messageId || responseData,
            timestamp: sendResult.timestamp || new Date().toISOString(),
          };
        } catch {
          // Not JSON, use the string as message ID
          return {
            success: true,
            messageId: responseData || `msg_${Date.now()}`,
            timestamp: new Date().toISOString(),
          };
        }
      }

      // If it's already an object
      if (typeof responseData === 'object') {
        return {
          success: true,
          messageId: responseData.message_id || responseData.messageId || `msg_${Date.now()}`,
          timestamp: responseData.timestamp || new Date().toISOString(),
        };
      }

      return {
        success: true,
        messageId: `msg_${Date.now()}`,
        timestamp: new Date().toISOString(),
      };

    } catch (error) {
      console.error('[Linera] Send message failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }, [wallet.isConnected, executeQuery]);

  /**
   * Public query function - allows components to query through the authenticated wallet
   */
  const query = useCallback(async (graphqlQuery: string): Promise<any> => {
    if (!wallet.isConnected) {
      throw new Error('Wallet not connected');
    }
    return executeQuery(graphqlQuery);
  }, [wallet.isConnected, executeQuery]);

  // Context value
  const value: LineraContextType = {
    wallet,
    availableWallets,
    detectWallets,
    connect,
    disconnect,
    trackEvent,
    sendMessage,
    query,
  };

  return (
    <LineraContext.Provider value={value}>
      {children}
    </LineraContext.Provider>
  );
}

// ============================================
// HOOKS
// ============================================

/**
 * Hook to access Linera wallet context
 */
export function useWallet() {
  const context = useContext(LineraContext);
  if (!context) {
    throw new Error('useWallet must be used within a LineraProvider');
  }
  return {
    ...context.wallet,
    availableWallets: context.availableWallets,
    detectWallets: context.detectWallets,
    connect: context.connect,
    disconnect: context.disconnect,
  };
}

/**
 * Hook for tracking events (authenticated)
 */
export function useTrackEvent() {
  const context = useContext(LineraContext);
  if (!context) {
    throw new Error('useTrackEvent must be used within a LineraProvider');
  }
  return {
    trackEvent: context.trackEvent,
    isConnected: context.wallet.isConnected,
  };
}

/**
 * Hook for sending messages (authenticated)
 */
export function useSendMessage() {
  const context = useContext(LineraContext);
  if (!context) {
    throw new Error('useSendMessage must be used within a LineraProvider');
  }
  return {
    sendMessage: context.sendMessage,
    isConnected: context.wallet.isConnected,
  };
}

/**
 * Hook for querying through authenticated wallet
 * Use this to read data from the user's chain (same chain where they track events/send messages)
 */
export function useAuthenticatedQuery() {
  const context = useContext(LineraContext);
  if (!context) {
    throw new Error('useAuthenticatedQuery must be used within a LineraProvider');
  }
  return {
    query: context.query,
    isConnected: context.wallet.isConnected,
    chainId: context.wallet.chainId,
  };
}
