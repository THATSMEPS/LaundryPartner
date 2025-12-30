import { useState, useEffect, useCallback } from 'react';
import { orderSSEService, OrderSSEEvent } from '@/utils/orderSSE';
import { getPartnerOrders } from '@/utils/api';
import { Order } from '@/components/OrderCard';

export const useRealTimeOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Fetch orders from API (fallback and initial load)
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
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
      
      setOrders(mappedOrders);
      setLastUpdate(new Date());
      return mappedOrders;
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle real-time SSE events
  const handleSSEEvent = useCallback((event: OrderSSEEvent) => {
    console.log('Real-time order event:', event);
    
    switch (event.type) {
      case 'new_order':
        // Add new order to the list
        if (event.data.order) {
          const newOrder = mapBackendOrderToFrontend(event.data.order);
          setOrders(prev => [newOrder, ...prev]);
          setLastUpdate(new Date());
        }
        break;
        
      case 'order_updated':
        // Update existing order
        if (event.data.order) {
          const updatedOrder = mapBackendOrderToFrontend(event.data.order);
          setOrders(prev => 
            prev.map(order => 
              order.fullId === event.data.orderId 
                ? updatedOrder 
                : order
            )
          );
          setLastUpdate(new Date());
        }
        break;
        
      case 'order_cancelled':
        // Remove cancelled order
        setOrders(prev => 
          prev.filter(order => order.fullId !== event.data.orderId)
        );
        setLastUpdate(new Date());
        break;
        
      default:
        console.warn('Unknown SSE event type:', event.type);
    }
  }, []);

  // Map backend order to frontend Order interface
  const mapBackendOrderToFrontend = (backendOrder: any): Order => {
    return {
      id: backendOrder.id?.includes('-') ? backendOrder.id.split('-')[0] : (backendOrder.id || 'N/A'),
      fullId: backendOrder.id || '',
      customerId: backendOrder.customerId || '',
      customerName: backendOrder.customer?.name || 'Unknown',
      phoneNumber: backendOrder.customer?.mobile || '',
      pickupAddress: `${backendOrder.address?.pickup?.street || ''}, ${backendOrder.address?.pickup?.landmark || ''}, ${backendOrder.address?.pickup?.city || ''}`.trim() || 'No address',
      pickupDate: backendOrder.placedAt ? new Date(backendOrder.placedAt).toLocaleDateString() : '',
      pickupTime: backendOrder.placedAt ? new Date(backendOrder.placedAt).toLocaleTimeString() : '',
      itemCount: `${backendOrder.items?.length || 0} items`,
      status: backendOrder.status || 'pending',
      paymentType: backendOrder.paymentType || 'COD',
      paymentStatus: backendOrder.paymentStatus || 'pending',
      totalAmount: parseFloat(backendOrder.totalAmount || '0'),
      gst: parseFloat(backendOrder.gst || '0'),
      deliveryFee: parseFloat(backendOrder.deliveryFee || '0'),
      deliveryPartnerId: backendOrder.deliveryPartnerId || '',
      distance: parseFloat(backendOrder.distance || '0'),
      items: backendOrder.items?.map((item: any) => ({
        id: item.id || '',
        name: item.laundryItem?.name || item.name || 'Unknown Item',
        quantity: item.quantity || 1,
        price: parseFloat(item.price || item.laundryItem?.price || '0'),
      })) || [],
      itemsAmount: parseFloat(backendOrder.itemsAmount || '0'),
    };
  };

  // Initialize real-time connection
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const initializeRealTime = async () => {
      try {
        // First, load initial orders
        await fetchOrders();
        
        // Then subscribe to real-time updates
        unsubscribe = orderSSEService.subscribe(handleSSEEvent);
        
        // Monitor connection status
        const statusInterval = setInterval(() => {
          setConnectionStatus(orderSSEService.getConnectionState() as any);
        }, 1000);

        return () => {
          clearInterval(statusInterval);
        };
      } catch (error) {
        console.error('Failed to initialize real-time orders:', error);
      }
    };

    const cleanup = initializeRealTime();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
      cleanup?.then(cleanupFn => cleanupFn?.());
    };
  }, [handleSSEEvent, fetchOrders]);

  // Manual refresh function (for pull-to-refresh)
  const refreshOrders = useCallback(async () => {
    try {
      return await fetchOrders();
    } catch (error) {
      console.error('Error refreshing orders:', error);
      throw error;
    }
  }, [fetchOrders]);

  // Update order optimistically and sync with backend
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

  return {
    orders,
    loading,
    connectionStatus,
    lastUpdate,
    fetchOrders,
    refreshOrders,
    updateOrderOptimistically,
    isConnected: connectionStatus === 'connected',
  };
};
