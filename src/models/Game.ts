import { Ship, Position, AttackStatus, AttackResult } from '../types/index';

export class Game {
  public ships: Map<string, Ship[]> = new Map();
  public currentPlayerId: string;
  private hitsByPlayer: Map<string, Position[]> = new Map();
  private missesByPlayer: Map<string, Position[]> = new Map();
  private killedByPlayer: Map<string, Position[]> = new Map();

  constructor(
    public id: string,
    public players: string[]
  ) {
    this.currentPlayerId = this.players[0];
    this.players.forEach((playerId) => {
      this.hitsByPlayer.set(playerId, []);
      this.missesByPlayer.set(playerId, []);
      this.killedByPlayer.set(playerId, []);
    });
  }

  public addShips(playerId: string, ships: Ship[]): void {
    this.ships.set(playerId, ships);
  }

  public isReady(): boolean {
    return this.players.every((playerId) => this.ships.has(playerId));
  }

  public getPlayerShips(playerId: string): Ship[] {
    return this.ships.get(playerId) || [];
  }

  private getShipCells(ship: Ship): Position[] {
    const cells: Position[] = [];
    for (let i = 0; i < ship.length; i++) {
      if (ship.direction) {
        cells.push({ x: ship.position.x, y: ship.position.y + i });
      } else {
        cells.push({ x: ship.position.x + i, y: ship.position.y });
      }
    }
    return cells;
  }

  public performAttack(attackerId: string, coords: Position): AttackResult {
    const defenderId = this.players.find((p) => p !== attackerId);
    if (!defenderId) {
      console.error(`Game ${this.id}: Defender not found for attacker ${attackerId}.`);
      return { status: AttackStatus.MISS, isGameOver: false };
    }

    const defenderShips = this.ships.get(defenderId);
    if (!defenderShips || defenderShips.length === 0) {
      console.error(`Game ${this.id}: Ships for defender ${defenderId} not found or empty.`);
      return { status: AttackStatus.MISS, isGameOver: false };
    }

    const defenderHits = this.hitsByPlayer.get(defenderId)!;
    const defenderMisses = this.missesByPlayer.get(defenderId)!;
    const defenderKilled = this.killedByPlayer.get(defenderId)!;

    const alreadyHit = defenderHits.some((p) => p.x === coords.x && p.y === coords.y);
    if (alreadyHit) {
      return { status: AttackStatus.SHOT, isGameOver: false, isSwitchPlayer: true };
    }

    const alreadyKill = defenderKilled.some((p) => p.x === coords.x && p.y === coords.y);
    if (alreadyKill) {
      return { status: AttackStatus.KILLED, isGameOver: false, isSwitchPlayer: true };
    }

    for (const ship of defenderShips) {
      const shipCells = this.getShipCells(ship);
      const isHitOnThisShip = shipCells.some((cell) => cell.x === coords.x && cell.y === coords.y);

      if (isHitOnThisShip) {
        defenderHits.push(coords);

        const isSunk = shipCells.every((cell) =>
          defenderHits.some((hit) => hit.x === cell.x && hit.y === cell.y)
        );

        if (isSunk) {
          shipCells.forEach((cell) => {
            defenderHits.splice(
              defenderHits.findIndex((hit) => hit.x === cell.x && hit.y === cell.y),
              1
            );
            if (!defenderKilled.some((killed) => killed.x === cell.x && killed.y === cell.y)) {
              defenderKilled.push(cell);
            }
          });

          const allDefenderShipsSunk = defenderShips.every((s) =>
            this.getShipCells(s).every((cell) =>
              defenderKilled.some((killed) => killed.x === cell.x && killed.y === cell.y)
            )
          );

          if (allDefenderShipsSunk) {
            return {
              status: AttackStatus.KILLED,
              isGameOver: true,
              winnerId: attackerId,
            };
          }
          return { status: AttackStatus.KILLED, isGameOver: false };
        }
        return { status: AttackStatus.SHOT, isGameOver: false };
      }
    }

    defenderMisses.push(coords);
    return { status: AttackStatus.MISS, isGameOver: false };
  }

  public switchPlayer(): void {
    const currentPlayerIndex = this.players.indexOf(this.currentPlayerId);
    const nextPlayerIndex = (currentPlayerIndex + 1) % this.players.length;
    this.currentPlayerId = this.players[nextPlayerIndex];
  }
}
