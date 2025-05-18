import { CommandType, User, RegResponse, CustomWebSocket, ErrorMsg } from '../types/types';
import { UsersStore } from '../models/Users';
import { checkPassword } from '../helpers/passwords';
import { sendResponse } from '../helpers/helpers';
import { RoomStore } from '../models/RoomStore';
import { wss } from '../index';
import { v4 as uuidv4 } from 'uuid';

class GameController {
  private static instance: GameController;
  private readonly usersStore = new UsersStore();
  private readonly roomStore = RoomStore.getInstance();
  public static getInstance(): GameController {
    if (!GameController.instance) {
      GameController.instance = new GameController();
    }
    return GameController.instance;
  }

  public handleCommand(ws: CustomWebSocket, command: CommandType, data: any, userId: string): void {
    switch (command) {
      case CommandType.REG:
        this.handleRegistration(ws, data, userId);
        break;
      case CommandType.CREATE_ROOM:
        this.handleCreateRoom(ws, userId);
        break;
      case CommandType.ADD_USER_TO_ROOM:
        this.handleAddUserToRoom(ws, data, userId);
        break;
      default:
        console.log(`Don't have handler for ${command} command`);
        break;
    }
  }

  public handleDisconnect(userId: string): void {
    const user = this.usersStore.getUserById(userId);
    if (user) {
      this.usersStore.updateUser(userId, { ...user, isLoggedIn: false });
      console.log(`User ${user.name} (${userId}) disconnected`);
    }
  }

  private async handleRegistration(ws: CustomWebSocket, data: any, userId: string): Promise<void> {
    const { name, password } = data;
    const errorMsg: ErrorMsg = {
      error: false,
      errorText: '',
    };
    const user = this.usersStore.getUserByName(name);

    if (!user) {
      const newUser = await this.usersStore.addUser(name, password, userId);
      console.log(`New user registered: ${newUser}`);
      const response: RegResponse = {
        type: CommandType.REG,
        data: JSON.stringify({
          ...newUser,
          ...errorMsg,
        }),
        id: 0,
      };

      sendResponse(ws, response);
      return;
    }

    const isPasswordCorrect = await checkPassword(password, user.hash);

    if (isPasswordCorrect && !user.isLoggedIn) {
      const updatedUser = this.usersStore.updateUser(user.index, {
        ...user,
        index: userId,
        isLoggedIn: true,
      });

      const response: RegResponse = {
        type: CommandType.REG,
        data: JSON.stringify({
          ...updatedUser,
          ...errorMsg,
        }),
        id: 0,
      };

      sendResponse(ws, response);
      return;
    }

    errorMsg.error = true;

    if (isPasswordCorrect && this.usersStore.isAlreadyLogin(user.name)) {
      errorMsg.errorText = 'User already exists';
    }

    if (!isPasswordCorrect) {
      errorMsg.errorText = 'Incorrect password';
    }

    const response: RegResponse = {
      type: CommandType.REG,
      data: JSON.stringify({
        ...errorMsg,
      }),
      id: 0,
    };

    sendResponse(ws, response);
  }

  private handleCreateRoom(ws: CustomWebSocket, userId: string): void {
    const user = this.usersStore.getUserById(userId);
    if (!user) {
      console.log('User not found');
      return;
    }

    const room = this.roomStore.createRoom(user);

    this.broadcastRoomUpdate();
  }

  private broadcastRoomUpdate(): void {
    const availableRooms = this.roomStore.getAvailableRooms().map((room) => room.toRoomResponse());

    const response = {
      type: CommandType.UPDATE_ROOM,
      data: JSON.stringify(availableRooms),
      id: 0,
    };

    wss.clients.forEach((client) => {
      sendResponse(client, response);
    });
  }

  private handleAddUserToRoom(ws: CustomWebSocket, data: any, userId: string): void {
    const { indexRoom } = data;
    const user = this.usersStore.getUserById(userId);

    if (!user) {
      console.log('User not found');
      return;
    }

    const room = this.roomStore.getRoom(indexRoom);

    if (room && room.players[0].index === userId) {
      console.log(`You are already in the room ${indexRoom}`);
      return;
    }

    const updatedRoom = this.roomStore.addUserToRoom(indexRoom, user);
    if (updatedRoom) {
      const gameId = uuidv4();

      updatedRoom.players.forEach((player) => {
        const playerConnection = Array.from(wss.clients).find(
          (client) => client.userId === player.index
        );
        if (playerConnection) {
          const response = {
            type: CommandType.CREATE_GAME,
            data: JSON.stringify({
              idGame: gameId,
              idPlayer: player.index,
            }),
            id: 0,
          };
          sendResponse(playerConnection, response);
        }
      });

      this.roomStore.removeRoom(indexRoom);
      this.broadcastRoomUpdate();
    }
  }
}

export const gameController = GameController.getInstance();
