import { WebSocket as WS } from 'ws';

export enum CommandType {
  REG = 'reg',
  UPDATE_WINNERS = 'update_winners',
  CREATE_ROOM = 'create_room',
  ADD_USER_TO_ROOM = 'add_user_to_room',
  CREATE_GAME = 'create_game',
  UPDATE_ROOM = 'update_room',
  ADD_SHIPS = 'add_ships',
  START_GAME = 'start_game',
  ATTACK = 'attack',
  RANDOM_ATTACK = 'randomAttack',
  TURN = 'turn',
  FINISH = 'finish'
}

export interface CustomWebSocket extends WS {
  userId?: string;
}
export interface ErrorMsg{
  error: boolean;
  errorText: string;
}

export type ShipType = 'small' | 'medium' | 'large' | 'huge';
export type AttackStatus = 'miss' | 'killed' | 'shot';

export interface Position {
  x: number;
  y: number;
}

export interface Ship {
  position: Position;
  direction: boolean;
  length: number;
  type: ShipType;
}

export interface BaseCommand {
  type: CommandType;
  id: number;
  data: string;
}

export interface RegRequest extends BaseCommand {
  type: CommandType.REG;
  // data: {
  //   name: string;
  //   password: string;
  // };
}

export interface RegResponse extends BaseCommand {
  type: CommandType.REG;
  // data: {
  //   name: string;
  //   index: number | string;
  //   error: boolean;
  //   errorText: string;
  // };
}

export interface UpdateWinnersResponse extends BaseCommand {
  type: CommandType.UPDATE_WINNERS;
  // data: Array<{
  //   name: string;
  //   wins: number;
  // }>;
}

export interface CreateRoomRequest extends BaseCommand {
  type: CommandType.CREATE_ROOM;
  data: string;
}

export interface AddUserToRoomRequest extends BaseCommand {
  type: CommandType.ADD_USER_TO_ROOM;
  // data: {
  //   indexRoom: number | string;
  // };
}

export interface CreateGameResponse extends BaseCommand {
  type: CommandType.CREATE_GAME;
  // data: {
  //   idGame: number | string;
  //   idPlayer: number | string;
  // };
}

export interface UpdateRoomResponse extends BaseCommand {
  type: CommandType.UPDATE_ROOM;
  // data: Array<{
  //   roomId: number | string;
  //   roomUsers: Array<{
  //     name: string;
  //     index: number | string;
  //   }>;
  // }>;
}

export interface AddShipsRequest extends BaseCommand {
  type: CommandType.ADD_SHIPS;
  // data: {
  //   gameId: number | string;
  //   ships: Ship[];
  //   indexPlayer: number | string;
  // };
}

export interface StartGameResponse extends BaseCommand {
  type: CommandType.START_GAME;
  // data: {
  //   ships: Ship[];
  //   currentPlayerIndex: number | string;
  // };
}

export interface AttackRequest extends BaseCommand {
  type: CommandType.ATTACK;
  // data: {
  //   gameId: number | string;
  //   x: number;
  //   y: number;
  //   indexPlayer: number | string;
  // };
}

export interface AttackResponse extends BaseCommand {
  type: CommandType.ATTACK;
  // data: {
  //   position: Position;
  //   currentPlayer: number | string;
  //   status: AttackStatus;
  // };
}

export interface RandomAttackRequest extends BaseCommand {
  type: CommandType.RANDOM_ATTACK;
  // data: {
  //   gameId: number | string;
  //   indexPlayer: number | string;
  // };
}

export interface TurnResponse extends BaseCommand {
  type: CommandType.TURN;
  // data: {
  //   currentPlayer: number | string;
  // };
}

export interface FinishResponse extends BaseCommand {
  type: CommandType.FINISH;
  // data: {
  //   winPlayer: number | string;
  // };
}

export interface User {
  name: string;
  hash: string;
  index: string;
  wins: number;
  isLoggedIn: boolean;
}