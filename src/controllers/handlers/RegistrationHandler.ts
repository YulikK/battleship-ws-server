import {
  CommandHandler,
  CommandType,
  CustomWebSocket,
  ErrorMsg,
  RegResponse,
} from '../../types/index';
import { UsersStore } from '../../models/UsersStore';
import { checkPassword } from '../../helpers/passwords';
import { sendResponse } from '../../helpers/helpers';

export class RegistrationHandler implements CommandHandler {
  constructor(private readonly usersStore: UsersStore) {}

  public async handle(ws: CustomWebSocket, data: any, userId: string): Promise<void> {
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
        data: {
          ...newUser,
          ...errorMsg,
        },
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
        data: {
          ...updatedUser,
          ...errorMsg,
        },
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
      data: {
        ...errorMsg,
      },
      id: 0,
    };
    sendResponse(ws, response);
  }
}
