import { WebSocketServer, WebSocket } from 'ws';

export interface CustomWebSocket extends WebSocket {
  userId?: string;
}

export interface CustomWebSocketServer extends Omit<WebSocketServer, 'clients'> {
  clients: Set<CustomWebSocket>;
}
