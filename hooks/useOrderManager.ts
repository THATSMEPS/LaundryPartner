import { useState, useEffect, useCallback } from 'react';
import { useRealTimeOrders } from './useRealTimeOrders';
import { usePollingOrders } from './usePollingOrders';
import { getRealTimeConfig, featureFlags } from '@/config/realtime';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useOrderManager = () => {
  const [strategy, setStrategy] = useState<'sse' | 'polling'>('sse');
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const config = getRealTimeConfig();

  // Get partner ID for feature flag checks
  useEffect(() => {
    const getPartnerId = async () => {
      try {
        const partner = await AsyncStorage.getItem('partner');
        if (partner) {
          const partnerData = JSON.parse(partner);
          setPartnerId(partnerData.id || null);
        }
      } catch (error) {
        console.error('Failed to get partner ID:', error);
      }
    };
    getPartnerId();
  }, []);

  // Determine which strategy to use
  useEffect(() => {
    if (partnerId) {
      const shouldUseSSE = featureFlags.enableSSEForPartner(partnerId) && config.strategy === 'sse';
      setStrategy(shouldUseSSE ? 'sse' : 'polling');
    } else {
      setStrategy(config.strategy);
    }
  }, [partnerId, config.strategy]);

  // Use the appropriate hook based on strategy
  const sseResults = useRealTimeOrders();
  const pollingResults = usePollingOrders(config.pollingInterval);

  // Select results based on current strategy
  const currentResults = strategy === 'sse' ? sseResults : pollingResults;

  // Handle SSE connection failures - fallback to polling
  useEffect(() => {
    if (
      strategy === 'sse' && 
      featureFlags.enablePollingFallback &&
      sseResults.connectionStatus === 'disconnected' &&
      !sseResults.loading
    ) {
      console.warn('SSE connection failed, falling back to polling');
      setStrategy('polling');
    }
  }, [strategy, sseResults.connectionStatus, sseResults.loading]);

  // Enhanced refresh that works with both strategies
  const refreshOrders = useCallback(async () => {
    try {
      return await currentResults.refreshOrders();
    } catch (error) {
      console.error('Failed to refresh orders:', error);
      throw error;
    }
  }, [currentResults]);

  // Enhanced optimistic updates (if enabled)
  const updateOrderOptimistically = useCallback((orderId: string, updates: any) => {
    if (featureFlags.enableOptimisticUpdates) {
      currentResults.updateOrderOptimistically(orderId, updates);
    }
  }, [currentResults]);

  return {
    ...currentResults,
    refreshOrders,
    updateOrderOptimistically,
    strategy,
    config,
    // Additional metadata
    connectionInfo: {
      strategy,
      isRealTime: strategy === 'sse' && currentResults.isConnected,
      lastUpdate: currentResults.lastUpdate,
      connectionStatus: currentResults.connectionStatus,
    },
  };
};
