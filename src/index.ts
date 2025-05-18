import WebSocket from 'ws';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 3000;

const wss = new WebSocket.Server({ port: Number(PORT) });

wss.on('connection', (ws: WebSocket) => {
  console.log('New connection');

  ws.on('message', (message: string) => {
    try {
      const data = JSON.parse(message.toString());
      console.log('Get command:', data);
      
    } catch (error) {
      console.error(error);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

console.log(`WebSocket start on the port ${PORT}`);