import { CommandType, User, CustomWebSocket, CommandHandler } from '../types/index';
import { UsersStore } from '../models/UsersStore';
import { RoomStore } from '../models/RoomStore';
import { GameStore } from '../models/GameStore';
import { RegistrationHandler } from './handlers/RegistrationHandler';
import { CreateRoomHandler } from './handlers/CreateRoomHandler';
import { AddUserToRoomHandler } from './handlers/AddUserToRoomHandler';
import { AddShipsHandler } from './handlers/AddShipsHandler';
import { AttackHandler } from './handlers/AttackHandler';
import { RandomAttackHandler } from './handlers/RandomAttackHandler';

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
    this.handlers[CommandType.ATTACK] = new AttackHandler(this.gameStore, this.usersStore);
    this.handlers[CommandType.RANDOM_ATTACK] = new RandomAttackHandler(
      this.gameStore,
      this.usersStore
    );
  }

  public static getInstance(): GameController {
    if (!GameController.instance) {
      GameController.instance = new GameController();
    }
    return GameController.instance;
  }

  public handleCommand(
    ws: CustomWebSocket,
    command: CommandType,
    data: any,
    connectionId: string
  ): void {
    const handler = this.handlers[command];
    if (handler) {
      try {
        const result = handler.handle(ws, data, connectionId);
        if (result instanceof Promise) {
          result.catch((error) => {
            console.error(
              `Error while processing command ${command} for connection ${connectionId}:`,
              error
            );
          });
        }
      } catch (error) {
        console.error(
          `Error when processing command ${command} for connection ${connectionId}:`,
          error
        );
      }
    } else {
      console.log(`No handler for command ${command}`);
    }
  }

  public handleDisconnect(connectionId: string): void {
    const user = this.usersStore.getUserById(connectionId);
    if (user) {
      this.usersStore.updateUser(connectionId, { ...user, isLogin: false });
      console.log(`User ${user.name} (${connectionId}) disconnected`);
    }
  }
}

export const gameController = GameController.getInstance();
