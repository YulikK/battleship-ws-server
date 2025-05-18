import {
  CommandType,
  User,
  RegResponse,
  CustomWebSocket,
  ErrorMsg,
  CommandHandler,
} from '../types/index';
import { UsersStore } from '../models/UsersStore';
import { checkPassword } from '../helpers/passwords';
import { sendResponse } from '../helpers/helpers';
import { RoomStore } from '../models/RoomStore';
import { wss } from '../index';
import { v4 as uuidv4 } from 'uuid';
import { GameStore } from '../models/GameStore';
import { RegistrationHandler } from './handlers/RegistrationHandler';
import { CreateRoomHandler } from './handlers/CreateRoomHandler';
import { AddUserToRoomHandler } from './handlers/AddUserToRoomHandler';
import { AddShipsHandler } from './handlers/AddShipsHandler';

class GameController {
  private static instance: GameController;
  private readonly usersStore = UsersStore.getInstance();
  private readonly roomStore = RoomStore.getInstance();
  private readonly gameStore = GameStore.getInstance();
  private readonly handlers: Partial<Record<CommandType, CommandHandler>> = {};

  private constructor() {
    this.handlers[CommandType.REG] = new RegistrationHandler(this.usersStore);
    this.handlers[CommandType.CREATE_ROOM] = new CreateRoomHandler(this.usersStore, this.roomStore);
    this.handlers[CommandType.ADD_USER_TO_ROOM] = new AddUserToRoomHandler(
      this.usersStore,
      this.roomStore,
      this.gameStore
    );
    this.handlers[CommandType.ADD_SHIPS] = new AddShipsHandler(this.gameStore);
  }

  public static getInstance(): GameController {
    if (!GameController.instance) {
      GameController.instance = new GameController();
    }
    return GameController.instance;
  }

  public handleCommand(ws: CustomWebSocket, command: CommandType, data: any, userId: string): void {
    const handler = this.handlers[command];
    if (handler) {
      try {
        const result = handler.handle(ws, data, userId);
        if (result instanceof Promise) {
          result.catch((error) => {
            console.error(`Error while processing command ${command} for user ${userId}:`, error);
          });
        }
      } catch (error) {
        console.error(`Error when processing command ${command} for user ${userId}:`, error);
      }
    } else {
      console.log(`No handler for command ${command}`);
    }
  }

  public handleDisconnect(userId: string): void {
    const user = this.usersStore.getUserById(userId);
    if (user) {
      this.usersStore.updateUser(userId, { ...user, isLoggedIn: false });
      console.log(`User ${user.name} (${userId}) disconnected`);
    }
  }
}

export const gameController = GameController.getInstance();
