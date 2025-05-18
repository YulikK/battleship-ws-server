import { checkPassword, hashPassword } from '../helpers/passwords';
import { User } from '../types/types';

export class UsersStore {
  private users: User[] = [];

  public async addUser(name: string, password: string, userId: string): Promise<User | null> {
    if (this.users.find((user) => user.name === name)) {
      return null;
    }

    const hash = await hashPassword(password);
    const newUser: User = {
      name,
      hash,
      index: userId,
      wins: 0,
      isLoggedIn: true,
    };

    this.users.push(newUser);
    return newUser;
  }

  public async validateUser(name: string, password: string): Promise<User | null> {
    const user = this.users.find((u) => u.name === name);
    if (!user) {
      return null;
    }

    const isValid = await checkPassword(password, user.hash);
    return isValid ? user : null;
  }

  public getAllUsers(): User[] {
    return this.users;
  }

  public getUserByName(name: string): User | null {
    return this.users.find((u) => u.name === name) || null;
  }

  public getUserById(userId: string): User | null {
    return this.users.find((user) => user.index === userId) || null;
  }

  public updateUser(userId: string, updatedUser: User): User | null {
    const index = this.users.findIndex((user) => user.index === userId);
    if (index !== -1) {
      this.users[index] = updatedUser;
      return this.users[index];
    }
    return null;
  }
  public updateWins(name: string): void {
    const user = this.users.find((u) => u.name === name);
    if (user) {
      user.wins++;
    }
  }

  public isAlreadyLogin(name: string): boolean {
    return this.users.some((u) => u.name === name && u.isLoggedIn);
  }
}
