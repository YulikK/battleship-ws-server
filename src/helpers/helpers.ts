import { CommandType, CustomWebSocket } from '../types/types';

export function parseCommand(data: any): CommandType | null {
  if (
    data &&
    typeof data.type === 'string' &&
    Object.values(CommandType).includes(data.type as CommandType)
  ) {
    return data.type as CommandType;
  }
  return null;
}

export function parseData(data: string): any {
  try {
    return typeof data === 'string' ? JSON.parse(data) : data;
  } catch (error) {
    return data;
  }
}

export const sendResponse = (ws: CustomWebSocket, data: unknown) => {
  ws.send(JSON.stringify(data));
  console.log(`Send response for ${ws.userId}: ${JSON.stringify(data)}`);
};
