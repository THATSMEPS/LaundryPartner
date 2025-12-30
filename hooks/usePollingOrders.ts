import { useState, useEffect, useCallback, useRef } from 'react';
import { getPartnerOrders } from '@/utils/api';
import { Order } from '@/components/OrderCard';

export const usePollingOrders = (intervalMs: number = 30000) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const intervalRef = useRef<number | null>(null);
  const isActiveRef = useRef(true);

  // Fetch orders from API
  const fetchOrders = useCallback(async () => {
    try {
      const response = await getPartnerOrders();
      const backendOrders = response.data?.orders || response.orders || [];
      
      const mappedOrders = backendOrders.map((order: any) => ({
        id: order.id?.includes('-') ? order.id.split('-')[0] : (order.id || 'N/A'),
        fullId: order.id || '',
        customerId: order.customerId || '',
        customerName: order.customer?.name || 'Unknown',
        phoneNumber: order.customer?.mobile || '',
        pickupAddress: `${order.address?.pickup?.street || ''}, ${order.address?.pickup?.landmark || ''}, ${order.address?.pickup?.city || ''}`.trim() || 'No address',
        pickupDate: order.placedAt ? new Date(order.placedAt).toLocaleDateString() : '',
        pickupTime: order.placedAt ? new Date(order.placedAt).toLocaleTimeString() : '',
        itemCount: `${order.items?.length || 0} items`,
        status: order.status || 'pending',
        paymentType: order.paymentType || 'COD',
        paymentStatus: order.paymentStatus || 'pending',
        totalAmount: parseFloat(order.totalAmount || '0'),
        gst: parseFloat(order.gst || '0'),
        deliveryFee: parseFloat(order.deliveryFee || '0'),
        deliveryPartnerId: order.deliveryPartnerId || '',
        distance: parseFloat(order.distance || '0'),
        items: order.items?.map((item: any) => ({
          id: item.id || '',
          name: item.laundryItem?.name || item.name || 'Unknown Item',
          quantity: item.quantity || 1,
          price: parseFloat(item.price || item.laundryItem?.price || '0'),
        })) || [],
        itemsAmount: parseFloat(order.itemsAmount || '0'),
      }));
      
      if (isActiveRef.current) {
        setOrders(mappedOrders);
        setLastUpdate(new Date());
        setError(null);
      }
      
      return mappedOrders;
    } catch (err) {
      if (isActiveRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to fetch orders');
      }
      throw err;
    } finally {
      if (isActiveRef.current) {
        setLoading(false);
      }
    }
  }, []);

  // Start polling
  const startPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Fetch immediately
    fetchOrders();

    // Set up interval
    intervalRef.current = setInterval(() => {
      if (isActiveRef.current) {
        fetchOrders().catch(console.error);
      }
    }, intervalMs);
  }, [fetchOrders, intervalMs]);

  // Stop polling
  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Refresh orders manually
  const refreshOrders = useCallback(async () => {
    try {
      return await fetchOrders();
    } catch (error) {
      console.error('Error refreshing orders:', error);
      throw error;
    }
  }, [fetchOrders]);

  // Update order optimistically
  const updateOrderOptimistically = useCallback((orderId: string, updates: Partial<Order>) => {
    setOrders(prev => 
      prev.map(order => 
        order.fullId === orderId 
          ? { ...order, ...updates }
          : order
      )
    );
    setLastUpdate(new Date());
  }, []);

  // Initialize polling
  useEffect(() => {
    isActiveRef.current = true;
    startPolling();

    return () => {
      isActiveRef.current = false;
      stopPolling();
    };
  }, [startPolling, stopPolling]);

  return {
    orders,
    loading,
    error,
    lastUpdate,
    fetchOrders,
    refreshOrders,
    updateOrderOptimistically,
    startPolling,
    stopPolling,
    connectionStatus: 'connected' as const, // Always connected for polling
    isConnected: true,
  };
};
