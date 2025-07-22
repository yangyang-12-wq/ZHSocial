import { WebsocketMessage, User, PrivateMessagePayload } from './types';

class ChatService {
  private ws: WebSocket | null = null;
  private token: string | null = null;
  
  // Callbacks for UI updates
  public onMessageReceived: ((message: any) => void) | null = null;
  public onConnectionOpen: (() => void) | null = null;
  public onConnectionClose: (() => void) | null = null;
  public onError: ((error: Event) => void) | null = null;

  constructor() {
    this.loadToken();
  }

  private loadToken(): void {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('token');
    }
  }

  public connect(): void {
    this.loadToken(); // Always get the latest token before connecting

    if (this.ws) {
      console.log('WebSocket already has a connection attempt in progress.');
      return;
    }
    
    if (!this.token) {
      console.error('WebSocket connection failed: no token found.');
      // Optionally, trigger a re-authentication flow
      return;
    }

    // Adjust the WebSocket URL based on the environment
    const wsScheme = window.location.protocol === "https:" ? "wss:" : "ws:";
    // In dev, browser connects to localhost:3000, which proxies to backend's 8080
    const wsHost = process.env.NODE_ENV === 'development' ? window.location.host : process.env.NEXT_PUBLIC_API_HOST;
    const wsUrl = `${wsScheme}//${wsHost}/api/v1/ws/chat?token=${this.token}`;

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('WebSocket connection established');
      this.onConnectionOpen?.();
    };

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('Message received:', message);
        this.onMessageReceived?.(message);
      } catch (error) {
        console.error('Error parsing received message:', error);
      }
    };

    this.ws.onclose = () => {
      console.log('WebSocket connection closed');
      this.ws = null;
      this.onConnectionClose?.();
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.onError?.(error);
    };
  }

  public disconnect(): void {
    if (this.ws) {
      this.ws.close();
    }
  }

  public sendPrivateMessage(recipientId: number, content: string): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('WebSocket is not connected.');
      return;
    }

    const message: WebsocketMessage = {
      type: 'private_message',
      payload: {
        recipientId: recipientId,
        content: content,
      },
      timestamp: new Date().toISOString(),
    };

    this.ws.send(JSON.stringify(message));
    console.log('Message sent:', message);
  }

  public isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// Create a singleton instance
const chatService = new ChatService();

export default chatService; 