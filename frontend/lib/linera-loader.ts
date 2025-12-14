/**
 * LINERA CLIENT LOADER
 *
 * This file handles loading @linera/client in a way that works with Next.js.
 * The WASM module requires special handling for browser-only execution.
 */

// Type definitions for @linera/client
interface LineraModule {
  initialize: () => Promise<void>;
  Faucet: new (url: string) => {
    createWallet: () => Promise<unknown>;
    claimChain: (client: unknown) => Promise<string>;
  };
  Client: new (wallet: unknown) => {
    frontend: () => {
      application: (appId: string) => Promise<unknown>;
    };
    onNotification?: (callback: (notification: unknown) => void) => void;
  };
  Wallet: unknown;
  InMemoryWallet: unknown;
}

let lineraModule: LineraModule | null = null;
let loadPromise: Promise<LineraModule> | null = null;

/**
 * Load the @linera/client module at runtime.
 * This uses a standard dynamic import which Next.js handles properly.
 */
export async function loadLineraClient(): Promise<LineraModule> {
  // Return cached module
  if (lineraModule) {
    return lineraModule;
  }

  // Return existing promise if loading
  if (loadPromise) {
    return loadPromise;
  }

  // Only load in browser
  if (typeof window === 'undefined') {
    throw new Error('Linera client can only be loaded in browser');
  }

  loadPromise = (async () => {
    try {
      console.log('[LineraLoader] Loading @linera/client...');

      // Dynamic import - Next.js will handle this with the webpack config
      const linera = await import('@linera/client') as unknown as LineraModule;

      // Initialize WASM using the named export
      if (typeof linera.initialize === 'function') {
        console.log('[LineraLoader] Initializing WASM...');
        await linera.initialize();
      }

      console.log('[LineraLoader] @linera/client loaded successfully');
      console.log('[LineraLoader] Available: Faucet:', !!linera.Faucet, 'Client:', !!linera.Client);

      lineraModule = linera;
      return linera;
    } catch (error) {
      console.error('[LineraLoader] Failed to load:', error);
      loadPromise = null;
      throw error;
    }
  })();

  return loadPromise;
}

/**
 * Check if linera client is loaded
 */
export function isLineraLoaded(): boolean {
  return lineraModule !== null;
}

/**
 * Get the loaded linera module (throws if not loaded)
 */
export function getLineraModule(): LineraModule {
  if (!lineraModule) {
    throw new Error('Linera client not loaded. Call loadLineraClient() first.');
  }
  return lineraModule;
}
