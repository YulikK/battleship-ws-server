import { CommandType, User, RegResponse, CustomWebSocket, ErrorMsg } from '../types/types';
import { UsersStore } from '../models/Users';
import { checkPassword } from '../helpers/passwords';
import { sendResponse } from '../helpers/helpers';

class GameController {
  private static instance: GameController;
  private readonly usersStore = new UsersStore();
  private readonly rooms: Map<string, any> = new Map();

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
}

export const gameController = GameController.getInstance();
