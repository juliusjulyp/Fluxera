'use client';

/**
 * VALIDATOR STATUS COMPONENT
 *
 * Displays the health and status of network validators.
 * - In local mode: checks local services (faucet, linera service)
 * - In testnet mode: checks official Conway validators
 */

import { useState, useEffect, useCallback } from 'react';
import { isLocalTestingMode } from '@/lib/public-client';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Wifi,
  WifiOff,
  Globe,
  Server,
} from 'lucide-react';

// Official Linera Conway testnet validators
const CONWAY_VALIDATORS = [
  { name: 'Validator 1', url: 'https://validator-1.testnet-conway.linera.net' },
  { name: 'Validator 2', url: 'https://validator-2.testnet-conway.linera.net' },
  { name: 'Validator 3', url: 'https://validator-3.testnet-conway.linera.net' },
];

// Local network services
const LOCAL_SERVICES = [
  { name: 'Faucet', url: 'http://localhost:8080' },
  { name: 'Linera Service', url: 'http://localhost:8081' },
];

interface ValidatorHealth {
  name: string;
  url: string;
  status: 'online' | 'offline' | 'degraded' | 'checking';
  latency?: number;
  lastChecked?: Date;
}

export default function ValidatorStatus() {
  const isLocal = isLocalTestingMode();

  const [localServices, setLocalServices] = useState<ValidatorHealth[]>(
    LOCAL_SERVICES.map(v => ({ ...v, status: 'checking' as const }))
  );
  const [validators, setValidators] = useState<ValidatorHealth[]>(
    CONWAY_VALIDATORS.map(v => ({ ...v, status: 'checking' as const }))
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const checkService = useCallback(async (service: { name: string; url: string }, useCorsMod: boolean): Promise<ValidatorHealth> => {
    const start = Date.now();
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      await fetch(service.url, {
        method: 'HEAD',
        mode: useCorsMod ? 'cors' : 'no-cors',
        signal: controller.signal,
      });

      clearTimeout(timeout);
      const latency = Date.now() - start;

      return {
        ...service,
        status: latency < 2000 ? 'online' : 'degraded',
        latency,
        lastChecked: new Date(),
      };
    } catch (error) {
      const latency = Date.now() - start;

      // For local services, any error means offline
      if (useCorsMod) {
        return {
          ...service,
          status: 'offline',
          latency,
          lastChecked: new Date(),
        };
      }

      // For remote: timeout means offline, other errors might be CORS (degraded)
      if (latency >= 5000) {
        return {
          ...service,
          status: 'offline',
          latency,
          lastChecked: new Date(),
        };
      }
      return {
        ...service,
        status: 'degraded',
        latency,
        lastChecked: new Date(),
      };
    }
  }, []);

  const refreshStatus = useCallback(async () => {
    setIsRefreshing(true);

    // Check local services
    setLocalServices(LOCAL_SERVICES.map(v => ({ ...v, status: 'checking' as const })));
    const localResults = await Promise.all(
      LOCAL_SERVICES.map(v => checkService(v, true))
    );
    setLocalServices(localResults);

    // Check Conway validators
    setValidators(CONWAY_VALIDATORS.map(v => ({ ...v, status: 'checking' as const })));
    const validatorResults = await Promise.all(
      CONWAY_VALIDATORS.map(v => checkService(v, false))
    );
    setValidators(validatorResults);

    setLastUpdate(new Date());
    setIsRefreshing(false);
  }, [checkService]);

  // Check on mount and every 30 seconds
  useEffect(() => {
    refreshStatus();
    const interval = setInterval(refreshStatus, 30000);
    return () => clearInterval(interval);
  }, [refreshStatus]);

  // Combined stats
  const allServices = [...localServices, ...validators];
  const onlineCount = allServices.filter(v => v.status === 'online').length;
  const degradedCount = allServices.filter(v => v.status === 'degraded').length;
  const offlineCount = allServices.filter(v => v.status === 'offline').length;

  // Local services stats
  const localOnline = localServices.filter(v => v.status === 'online').length;

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

  // Overall health based on local services (primary) and validators
  const localHealthy = localOnline === localServices.length;
  const overallHealth = localHealthy ? 'healthy' : localOnline >= 1 ? 'degraded' : 'offline';

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
            <h3 className="text-lg font-semibold text-white">Network Status</h3>
            <p className="text-xs text-gray-400">
              {isLocal ? 'Local & Testnet Infrastructure' : 'Conway Testnet Infrastructure'}
            </p>
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

      {/* Local Services Section */}
      <div className="mb-4">
        <div className="flex items-center space-x-2 mb-2">
          <Server className="h-4 w-4 text-blue-400" />
          <h4 className="text-sm font-medium text-blue-400">Local Services</h4>
        </div>
        <div className="space-y-2">
          {localServices.map((service) => (
            <div
              key={service.url}
              className={`flex items-center justify-between p-3 rounded-lg border ${getStatusColor(service.status)} transition-colors`}
            >
              <div className="flex items-center space-x-3">
                {getStatusIcon(service.status)}
                <div>
                  <p className="text-sm font-medium text-white">{service.name}</p>
                  <p className="text-xs text-gray-500 font-mono">
                    {service.url.replace('http://', '')}
                  </p>
                </div>
              </div>
              <div className="text-right">
                {service.latency !== undefined && service.status !== 'checking' && (
                  <p className={`text-xs ${
                    service.latency < 1000 ? 'text-green-400' :
                    service.latency < 3000 ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {service.latency}ms
                  </p>
                )}
                {service.status === 'checking' && (
                  <p className="text-xs text-gray-500">Checking...</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Conway Validators Section */}
      <div>
        <div className="flex items-center space-x-2 mb-2">
          <Globe className="h-4 w-4 text-purple-400" />
          <h4 className="text-sm font-medium text-purple-400">Conway Testnet Validators</h4>
        </div>
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
                    {validator.url.replace('https://', '')}
                  </p>
                </div>
              </div>
              <div className="text-right">
                {validator.latency !== undefined && validator.status !== 'checking' && (
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
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-gray-700 flex items-center justify-between text-xs text-gray-500">
        <span>{localServices.length} services + {validators.length} validators tracked</span>
        {lastUpdate && (
          <span>Updated {lastUpdate.toLocaleTimeString()}</span>
        )}
      </div>
    </div>
  );
}
