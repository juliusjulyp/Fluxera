/**
 * LINERA CLIENT INITIALIZATION
 *
 * Handles loading and initializing the @linera/client WASM module.
 * Must be called before any Linera operations.
 */

// Module-level state
let lineraModule: typeof import('@linera/client') | null = null;
let initPromise: Promise<typeof import('@linera/client')> | null = null;

/**
 * Initialize the Linera WASM module
 *
 * This downloads and initializes the WebAssembly binary.
 * Safe to call multiple times - will return cached module.
 *
 * @returns The initialized Linera module
 */
export async function initializeLinera(): Promise<typeof import('@linera/client')> {
  // Return cached module if already initialized
  if (lineraModule) {
    return lineraModule;
  }

  // Return existing promise if initialization is in progress
  if (initPromise) {
    return initPromise;
  }

  // Start initialization
  initPromise = (async () => {
    try {
      console.log('[Linera] Loading WASM module...');

      // Dynamic import of @linera/client
      const linera = await import('@linera/client');

      // Initialize the WASM runtime
      // This is required before any other operations
      await linera.default();

      console.log('[Linera] WASM module initialized successfully');
      lineraModule = linera;
      return linera;
    } catch (error) {
      console.error('[Linera] Failed to initialize:', error);
      initPromise = null; // Allow retry on failure
      throw error;
    }
  })();

  return initPromise;
}

/**
 * Get the initialized Linera module
 *
 * @throws Error if module not yet initialized
 */
export function getLinera(): typeof import('@linera/client') {
  if (!lineraModule) {
    throw new Error(
      'Linera not initialized. Call initializeLinera() first or use the LineraProvider.'
    );
  }
  return lineraModule;
}

/**
 * Check if Linera module is initialized
 */
export function isLineraReady(): boolean {
  return lineraModule !== null;
}

/**
 * Reset the Linera module (mainly for testing)
 */
export function resetLinera(): void {
  lineraModule = null;
  initPromise = null;
}
