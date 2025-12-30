import AsyncStorage from '@react-native-async-storage/async-storage';

export type OrderSSEEvent = {
  type: 'new_order' | 'order_updated' | 'order_cancelled';
  data: {
    orderId: string;
    order?: any;
    message?: string;
  };
};

export class OrderSSEService {
  private eventSource: any = null;
  private listeners: Set<(event: OrderSSEEvent) => void> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second
  private isConnecting = false;
  private connectionState: 'disconnected' | 'connecting' | 'connected' = 'disconnected';
  private abortController: AbortController | null = null;

  constructor(private baseUrl: string) {}

  async connect(): Promise<void> {
    if (this.eventSource || this.isConnecting) {
      return;
    }

    this.isConnecting = true;
    this.connectionState = 'connecting';
    
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Create SSE connection using fetch with proper Authorization header
      const url = `${this.baseUrl}/partner/orders/sse`;
      
      console.log('Connecting to SSE:', url);
      
      this.abortController = new AbortController();
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache'
        },
        signal: this.abortController.signal
      });

      if (!response.ok) {
        throw new Error(`SSE connection failed: ${response.status} ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error('No response body available for SSE');
      }

      this.eventSource = response;
      this.connectionState = 'connected';
      this.isConnecting = false;
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000;

      console.log('SSE connection opened');

      // Process the stream
      this.processStream(response.body);

    } catch (error) {
      console.error('Failed to connect to SSE:', error);
      this.isConnecting = false;
      this.connectionState = 'disconnected';
      this.handleConnectionError();
    }
  }

  private async processStream(stream: ReadableStream<Uint8Array>): Promise<void> {
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          console.log('SSE stream ended');
          this.connectionState = 'disconnected';
          this.handleConnectionError();
          break;
        }

        // Decode and process the chunk
        buffer += decoder.decode(value, { stream: true });
        
        // Split by double newlines to get complete events
        const events = buffer.split('\n\n');
        
        // Keep the last incomplete event in buffer
        buffer = events.pop() || '';
        
        // Process complete events
        for (const eventData of events) {
          if (eventData.trim()) {
            this.parseAndHandleEvent(eventData);
          }
        }
      }
    } catch (error) {
      console.error('Error processing SSE stream:', error);
      this.connectionState = 'disconnected';
      this.handleConnectionError();
    } finally {
      reader.releaseLock();
    }
  }

  private parseAndHandleEvent(eventData: string): void {
    try {
      const lines = eventData.split('\n');
      let eventType = '';
      let data = '';

      for (const line of lines) {
        if (line.startsWith('event:')) {
          eventType = line.substring(6).trim();
        } else if (line.startsWith('data:')) {
          data = line.substring(5).trim();
        }
      }

      if (eventType === 'connected' || eventType === 'heartbeat') {
        // Handle connection and heartbeat events
        console.log(`SSE ${eventType} event received`);
        return;
      }

      if (data) {
        const parsedData = JSON.parse(data);
        
        // Convert backend event format to frontend format
        const orderEvent: OrderSSEEvent = {
          type: eventType as any,
          data: {
            orderId: parsedData.order?.id || '',
            order: parsedData.order,
            message: parsedData.message
          }
        };

        console.log('SSE event received:', orderEvent);
        this.notifyListeners(orderEvent);
      }
    } catch (error) {
      console.error('Error parsing SSE event:', error);
    }
  }

  private handleConnectionError(): void {
    this.disconnect();

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff
      
      console.log(`Attempting to reconnect SSE in ${delay}ms (attempt ${this.reconnectAttempts})`);
      
      setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      console.warn('Max SSE reconnection attempts reached');
    }
  }

  disconnect(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    if (this.eventSource) {
      this.eventSource = null;
    }
    this.isConnecting = false;
    this.connectionState = 'disconnected';
  }

  subscribe(listener: (event: OrderSSEEvent) => void): () => void {
    this.listeners.add(listener);
    
    // Auto-connect when first listener is added
    if (this.listeners.size === 1) {
      this.connect();
    }

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
      
      // Auto-disconnect when no listeners remain
      if (this.listeners.size === 0) {
        this.disconnect();
      }
    };
  }

  private notifyListeners(event: OrderSSEEvent): void {
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in SSE listener:', error);
      }
    });
  }

  isConnected(): boolean {
    return this.connectionState === 'connected' && this.eventSource !== null;
  }

  getConnectionState(): string {
    return this.connectionState;
  }
}

// Singleton instance
// @ts-ignore
const API_BASE = process.env.API_BASE || 'https://laundrybackend-js2r.onrender.com/api';
export const orderSSEService = new OrderSSEService(API_BASE);
