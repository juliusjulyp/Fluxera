/**
 * CHAIN REGISTRY
 *
 * Manages known Fluxera chains in the network.
 * Chains are populated from environment variables (Docker setup)
 * and can be extended dynamically via contract registration.
 *
 * Wave 6: Multi-Chain Support
 */

export interface ChainInfo {
  /** Chain ID (64-character hex) */
  chainId: string;
  /** Human-readable name */
  name: string;
  /** Optional description */
  description?: string;
  /** Chain status */
  status: 'active' | 'inactive' | 'unknown';
  /** Whether Fluxera is deployed on this chain */
  fluxeraDeployed: boolean;
  /** Last known activity timestamp */
  lastActivity?: string;
}

/**
 * Get all known Fluxera chains from environment configuration
 */
export function getKnownChains(): ChainInfo[] {
  const chains: ChainInfo[] = [];

  // Parse from comma-separated ALL_CHAINS env var if available
  const allChainsStr = process.env.NEXT_PUBLIC_ALL_CHAINS || '';
  if (allChainsStr) {
    const chainIds = allChainsStr.split(',').filter(Boolean);
    chainIds.forEach((chainId, index) => {
      chains.push({
        chainId: chainId.trim(),
        name: index === 0 ? 'Primary Chain' : `Chain ${index + 1}`,
        description: index === 0 ? 'Main Fluxera deployment' : 'Secondary Fluxera chain',
        status: 'active',
        fluxeraDeployed: true,
      });
    });
    return chains;
  }

  // Fallback: parse individual chain env vars
  const chain1 = process.env.NEXT_PUBLIC_CHAIN_ID;
  const chain2 = process.env.NEXT_PUBLIC_CHAIN_2_ID;
  const chain3 = process.env.NEXT_PUBLIC_CHAIN_3_ID;

  if (chain1) {
    chains.push({
      chainId: chain1,
      name: 'Primary Chain',
      description: 'Main Fluxera deployment',
      status: 'active',
      fluxeraDeployed: true,
    });
  }

  if (chain2) {
    chains.push({
      chainId: chain2,
      name: 'Chain 2',
      description: 'Secondary Fluxera chain',
      status: 'active',
      fluxeraDeployed: true,
    });
  }

  if (chain3) {
    chains.push({
      chainId: chain3,
      name: 'Chain 3',
      description: 'Tertiary Fluxera chain',
      status: 'active',
      fluxeraDeployed: true,
    });
  }

  return chains;
}

/**
 * Get chain info by ID
 */
export function getChainById(chainId: string): ChainInfo | undefined {
  return getKnownChains().find(
    (c) => c.chainId.toLowerCase() === chainId.toLowerCase()
  );
}

/**
 * Check if a chain ID is a known Fluxera chain
 */
export function isKnownChain(chainId: string): boolean {
  return getKnownChains().some(
    (c) => c.chainId.toLowerCase() === chainId.toLowerCase()
  );
}

/**
 * Get the primary chain ID
 */
export function getPrimaryChainId(): string {
  return process.env.NEXT_PUBLIC_CHAIN_ID || '';
}

/**
 * Truncate a chain ID for display
 */
export function truncateChainId(chainId: string, chars = 8): string {
  if (!chainId || chainId.length <= chars * 2 + 3) return chainId;
  return `${chainId.slice(0, chars)}...${chainId.slice(-chars)}`;
}

/**
 * Validate chain ID format (64 hex characters)
 */
export function isValidChainId(chainId: string): boolean {
  const normalized = chainId.trim().replace(/^0x/i, '');
  return /^[a-fA-F0-9]{64}$/.test(normalized);
}

/**
 * Normalize chain ID (remove 0x prefix if present)
 */
export function normalizeChainId(chainId: string): string {
  let normalized = chainId.trim();
  if (normalized.toLowerCase().startsWith('0x')) {
    normalized = normalized.slice(2);
  }
  return normalized.toLowerCase();
}
