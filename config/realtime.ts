// Real-time configuration for order updates

export type RealTimeConfig = {
  // Real-time strategy: 'sse' for Server-Sent Events, 'polling' for regular API polling
  strategy: 'sse' | 'polling';
  
  // Polling interval in milliseconds (only used when strategy is 'polling')
  pollingInterval: number;
  
  // SSE reconnection settings
  sse: {
    maxReconnectAttempts: number;
    initialReconnectDelay: number;
    maxReconnectDelay: number;
    heartbeatInterval: number;
  };
};

export const defaultRealTimeConfig: RealTimeConfig = {
  // Use SSE by default for better performance, fallback to polling if SSE fails
  strategy: 'sse',
  
  // Poll every 30 seconds when using polling strategy
  pollingInterval: 30000,
  
  sse: {
    // Try to reconnect up to 5 times
    maxReconnectAttempts: 5,
    // Start with 1 second delay
    initialReconnectDelay: 1000,
    // Max 30 seconds between reconnection attempts
    maxReconnectDelay: 30000,
    // Send heartbeat every 30 seconds
    heartbeatInterval: 30000,
  },
};

// Environment-specific configurations
export const developmentConfig: RealTimeConfig = {
  ...defaultRealTimeConfig,
  // Use polling in development for easier debugging
  strategy: 'polling',
  pollingInterval: 10000, // Poll every 10 seconds in development
};

export const productionConfig: RealTimeConfig = {
  ...defaultRealTimeConfig,
  // Use SSE in production for optimal performance
  strategy: 'sse',
  pollingInterval: 60000, // Fallback polling every 60 seconds
};

// Get configuration based on environment
export function getRealTimeConfig(): RealTimeConfig {
  // In a real app, you might check environment variables or feature flags
  const isDevelopment = __DEV__;
  
  return isDevelopment ? developmentConfig : productionConfig;
}

// Feature flags for gradual rollout
export const featureFlags = {
  // Enable SSE for specific partners (can be controlled by backend)
  enableSSEForPartner: (partnerId: string): boolean => {
    // Example: Enable for specific partners or percentage rollout
    // return partnerId.endsWith('1') || partnerId.endsWith('2'); // 20% rollout
    return true; // Enable for all partners
  },
  
  // Fallback to polling if SSE fails
  enablePollingFallback: true,
  
  // Enable optimistic updates
  enableOptimisticUpdates: true,
  
  // Enable connection status indicator
  showConnectionStatus: true,
};
