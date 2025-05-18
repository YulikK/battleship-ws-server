import {
  CommandHandler,
  CommandType,
  CustomWebSocket,
  AttackRequest,
  AttackRequestData,
  AttackResponse,
  AttackResponseData,
  TurnResponse,
  TurnResponseData,
  FinishResponse,
  FinishResponseData,
  AttackStatus,
} from '../../types/index';
import { GameStore } from '../../models/GameStore';
import { UsersStore } from '../../models/UsersStore';
import { sendResponse } from '../../helpers/helpers';
import { wss } from '../../index';

export class AttackHandler implements CommandHandler {
  constructor(
    private readonly gameStore: GameStore,
    private readonly usersStore: UsersStore
  ) {}

  public handle(ws: CustomWebSocket, data: AttackRequestData, userId: string): void {
    const { gameId, x, y, indexPlayer } = data;

    const game = this.gameStore.getGame(gameId.toString());

    if (!game) {
      // TODO send error to client
      console.error(`AttackHandler: Game ${gameId} not found.`);
      return;
    }

    if (game.currentPlayerId !== indexPlayer) {
      console.error(`AttackHandler: Not player ${indexPlayer}'s turn in game ${gameId}.`);
      return;
    }

    const attackResult: { status: AttackStatus; isGameOver: boolean; winnerId?: string } =
      game.performAttack(indexPlayer, { x, y });

    game.players.forEach((playerId) => {
      const playerConnection = Array.from(wss.clients).find((client) => client.userId === playerId);
      if (playerConnection) {
        const attackResponseData: AttackResponseData = {
          position: { x, y },
          currentPlayer: indexPlayer,
          status: attackResult.status,
        };
        const response: AttackResponse = {
          type: CommandType.ATTACK,
          id: 0,
          data: attackResponseData,
        };
        sendResponse(playerConnection, response);
      }
    });

    if (attackResult.isGameOver && attackResult.winnerId) {
      const winnerId = attackResult.winnerId;
      this.usersStore.updateWins(winnerId);

      game.players.forEach((playerId) => {
        const playerConnection = Array.from(wss.clients).find(
          (client) => client.userId === playerId
        );
        if (playerConnection) {
          const finishResponseData: FinishResponseData = {
            winPlayer: winnerId,
          };
          const finishResponse: FinishResponse = {
            type: CommandType.FINISH,
            id: 0,
            data: finishResponseData,
          };
          sendResponse(playerConnection, finishResponse);
        }
      });
      this.gameStore.removeGame(gameId.toString());
      console.log(`Game ${gameId} finished. Winner: ${winnerId}`);
      return;
    }

    let nextPlayerId: string;
    if (attackResult.status === AttackStatus.MISS) {
      game.switchPlayer();
      nextPlayerId = game.currentPlayerId;
      console.log(`Game ${game.id}: Turn switched to player ${nextPlayerId} after a miss.`);
    } else {
      nextPlayerId = indexPlayer as string;
      console.log(
        `Game ${game.id}: Player ${nextPlayerId} continues turn after a ${attackResult.status}.`
      );
    }

    game.players.forEach((playerId) => {
      const playerConnection = Array.from(wss.clients).find((client) => client.userId === playerId);
      if (playerConnection) {
        const turnResponseData: TurnResponseData = {
          currentPlayer: nextPlayerId,
        };
        const turnResponse: TurnResponse = {
          type: CommandType.TURN,
          id: 0,
          data: turnResponseData,
        };
        sendResponse(playerConnection, turnResponse);
      }
    });
    console.log(`Game ${gameId}: Turn switched to player ${nextPlayerId}`);
  }
}
