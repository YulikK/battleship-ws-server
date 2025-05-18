import WebSocket from 'ws';
import dotenv from 'dotenv';
import { parseCommand, parseData } from './helpers/helpers';
import { gameController } from './controllers/GameController';
import { v4 as uuidv4 } from 'uuid';
import { CustomWebSocket, CustomWebSocketServer } from './types/types';

dotenv.config();

const PORT = process.env.PORT || 3000;

export const wss = new WebSocket.Server({ port: Number(PORT) }) as CustomWebSocketServer;

wss.on('connection', (ws: WebSocket) => {
  const customWs = ws as CustomWebSocket;
  const userId = uuidv4();
  customWs.userId = userId;
  console.log('New connection:', userId);

  customWs.on('message', (message: string) => {
    try {
      const parsedData = JSON.parse(message.toString());
      const command = parseCommand(parsedData);
      const data = parsedData.data ? parseData(parsedData.data) : null;
      if (command) {
        gameController.handleCommand(customWs, command, data, userId);
      } else {
        console.error('Unknown command');
      }
    } catch (error) {
      console.error(error);
    }
  });

  customWs.on('close', () => {
    gameController.handleDisconnect(userId);
  });
});

console.log(`WebSocket start on the port ${PORT}`);
