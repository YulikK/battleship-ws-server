import { Ship } from '../types/index';

export class Game {
  public ships: Map<string, Ship[]> = new Map();

  constructor(
    public id: string,
    public players: string[]
  ) {}

  public addShips(playerId: string, ships: Ship[]): void {
    this.ships.set(playerId, ships);
  }

  public isReady(): boolean {
    return this.players.every((playerId) => this.ships.has(playerId));
  }

  public getPlayerShips(playerId: string): Ship[] {
    return this.ships.get(playerId) || [];
  }
}
