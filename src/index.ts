import WebSocket from 'ws';
import dotenv from 'dotenv';
import { parseCommand, parseData } from './helpers/helpers';
import { gameController } from './controllers/GameController';
import { v4 as uuidv4 } from 'uuid';
import { CustomWebSocket, CustomWebSocketServer } from './types/index';

dotenv.config();

const PORT = process.env.PORT || 3000;

export const wss = new WebSocket.Server({ port: Number(PORT) }) as CustomWebSocketServer;

wss.on('connection', (ws: WebSocket) => {
  const customWs = ws as CustomWebSocket;
  const connectionId = uuidv4();
  customWs.connectionId = ws.protocol ? ws.protocol : connectionId;
  console.log('New connection:', connectionId);

  customWs.on('message', (message: string) => {
    try {
      const parsedData = JSON.parse(message.toString());
      const command = parseCommand(parsedData);
      const data = parsedData.data ? parseData(parsedData.data) : null;
      if (command) {
        gameController.handleCommand(customWs, command, data, connectionId);
      } else {
        console.error('Unknown command', command);
      }
    } catch (error) {
      console.error(error);
    }
  });

  customWs.on('close', () => {
    gameController.handleDisconnect(connectionId);
  });
});

console.log(`WebSocket start on the port ${PORT}`);
