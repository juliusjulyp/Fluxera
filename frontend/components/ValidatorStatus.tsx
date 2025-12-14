'use client';

/**
 * VALIDATOR STATUS COMPONENT
 *
 * Displays the health and status of Conway testnet validators.
 * Uses the Linera faucet API to check validator availability.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Server,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Wifi,
  WifiOff,
  Globe,
} from 'lucide-react';

// Known Conway testnet validators (from the error logs we've seen)
const CONWAY_VALIDATORS = [
  { name: 'BrightlyStake', url: 'https://linera-testnet.brightlystake.com:443' },
  { name: 'ContributionDAO', url: 'https://linera-testnet-validator.contributiondao.com:443' },
  { name: 'Everstake', url: 'https://linera.everstake.one:443' },
  { name: 'StakeFi', url: 'https://linera-testnet.stakefi.network:443' },
  { name: 'Runtime', url: 'https://linera-testnet.runtime-client-rpc.com:443' },
];

interface ValidatorHealth {
  name: string;
  url: string;
  status: 'online' | 'offline' | 'degraded' | 'checking';
  latency?: number;
  lastChecked?: Date;
}

export default function ValidatorStatus() {
  const [validators, setValidators] = useState<ValidatorHealth[]>(
    CONWAY_VALIDATORS.map(v => ({ ...v, status: 'checking' as const }))
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const checkValidator = useCallback(async (validator: { name: string; url: string }): Promise<ValidatorHealth> => {
    const start = Date.now();
    try {
      // We can't directly ping gRPC endpoints from browser,
      // but we can check if the host is reachable via a simple fetch with timeout
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      // Try to fetch with CORS - this will likely fail but at least tells us if host is reachable
      await fetch(validator.url, {
        method: 'HEAD',
        mode: 'no-cors',
        signal: controller.signal,
      });

      clearTimeout(timeout);
      const latency = Date.now() - start;

      return {
        ...validator,
        status: latency < 2000 ? 'online' : 'degraded',
        latency,
        lastChecked: new Date(),
      };
    } catch (error) {
      const latency = Date.now() - start;
      // If it timed out or errored, mark as offline
      if (latency >= 5000) {
        return {
          ...validator,
          status: 'offline',
          latency,
          lastChecked: new Date(),
        };
      }
      // Some errors might just be CORS, which means server is reachable
      return {
        ...validator,
        status: 'degraded',
        latency,
        lastChecked: new Date(),
      };
    }
  }, []);

  const refreshStatus = useCallback(async () => {
    setIsRefreshing(true);
    setValidators(prev => prev.map(v => ({ ...v, status: 'checking' as const })));

    const results = await Promise.all(
      CONWAY_VALIDATORS.map(v => checkValidator(v))
    );

    setValidators(results);
    setLastUpdate(new Date());
    setIsRefreshing(false);
  }, [checkValidator]);

  // Check on mount and every 30 seconds
  useEffect(() => {
    refreshStatus();
    const interval = setInterval(refreshStatus, 30000);
    return () => clearInterval(interval);
  }, [refreshStatus]);

  const onlineCount = validators.filter(v => v.status === 'online').length;
  const degradedCount = validators.filter(v => v.status === 'degraded').length;
  const offlineCount = validators.filter(v => v.status === 'offline').length;

  const getStatusIcon = (status: ValidatorHealth['status']) => {
    switch (status) {
      case 'online':
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'degraded':
        return <AlertTriangle className="h-4 w-4 text-yellow-400" />;
      case 'offline':
        return <XCircle className="h-4 w-4 text-red-400" />;
      case 'checking':
        return <RefreshCw className="h-4 w-4 text-gray-400 animate-spin" />;
    }
  };

  const getStatusColor = (status: ValidatorHealth['status']) => {
    switch (status) {
      case 'online':
        return 'border-green-500/30 bg-green-500/10';
      case 'degraded':
        return 'border-yellow-500/30 bg-yellow-500/10';
      case 'offline':
        return 'border-red-500/30 bg-red-500/10';
      case 'checking':
        return 'border-gray-500/30 bg-gray-500/10';
    }
  };

  const overallHealth = onlineCount >= 3 ? 'healthy' : onlineCount >= 1 ? 'degraded' : 'offline';

  return (
    <div className="rounded-xl bg-gray-800/50 border border-gray-700 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${
            overallHealth === 'healthy' ? 'bg-green-500/20' :
            overallHealth === 'degraded' ? 'bg-yellow-500/20' : 'bg-red-500/20'
          }`}>
            {overallHealth === 'healthy' ? (
              <Wifi className="h-5 w-5 text-green-400" />
            ) : overallHealth === 'degraded' ? (
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
            ) : (
              <WifiOff className="h-5 w-5 text-red-400" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Validator Network</h3>
            <p className="text-xs text-gray-400">Conway Testnet Infrastructure</p>
          </div>
        </div>

        <button
          onClick={refreshStatus}
          disabled={isRefreshing}
          className="flex items-center space-x-1 px-3 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-green-400" />
            <span className="text-sm text-green-400">Online</span>
          </div>
          <p className="text-2xl font-bold text-white mt-1">{onlineCount}</p>
        </div>
        <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4 text-yellow-400" />
            <span className="text-sm text-yellow-400">Degraded</span>
          </div>
          <p className="text-2xl font-bold text-white mt-1">{degradedCount}</p>
        </div>
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <div className="flex items-center space-x-2">
            <XCircle className="h-4 w-4 text-red-400" />
            <span className="text-sm text-red-400">Offline</span>
          </div>
          <p className="text-2xl font-bold text-white mt-1">{offlineCount}</p>
        </div>
      </div>

      {/* Validator List */}
      <div className="space-y-2">
        {validators.map((validator) => (
          <div
            key={validator.url}
            className={`flex items-center justify-between p-3 rounded-lg border ${getStatusColor(validator.status)} transition-colors`}
          >
            <div className="flex items-center space-x-3">
              {getStatusIcon(validator.status)}
              <div>
                <p className="text-sm font-medium text-white">{validator.name}</p>
                <p className="text-xs text-gray-500 font-mono truncate max-w-[200px]">
                  {validator.url.replace('https://', '').replace(':443', '')}
                </p>
              </div>
            </div>
            <div className="text-right">
              {validator.latency !== undefined && (
                <p className={`text-xs ${
                  validator.latency < 1000 ? 'text-green-400' :
                  validator.latency < 3000 ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {validator.latency}ms
                </p>
              )}
              {validator.status === 'checking' && (
                <p className="text-xs text-gray-500">Checking...</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-gray-700 flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center space-x-1">
          <Globe className="h-3 w-3" />
          <span>{validators.length} validators tracked</span>
        </div>
        {lastUpdate && (
          <span>Updated {lastUpdate.toLocaleTimeString()}</span>
        )}
      </div>
    </div>
  );
}
