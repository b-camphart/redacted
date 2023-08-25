import type { Assignment } from "$lib/assignments";
import type { Events, Subscription } from "$lib/updates";
import type { Games } from "../games/Repository"

export type GameJoined = {
    gameId: string,
    playerId: string,
    numberOfPlayers: number,
    hasStarted: boolean,
    playerAssignment: Assignment
}

const PlayerJoinedGameTypeName = 'PlayerJoinedGame' as const;
export type PlayerJoinedGame = {
    type: typeof PlayerJoinedGameTypeName,
    gameId: string,
    playerId: string,
    numberOfPlayers: number,
}

export const playerJoinedGame = (
    gameId: string,
    playerId: string,
    numberOfPlayers: number,
): PlayerJoinedGame => {
    return {
        type: PlayerJoinedGameTypeName, gameId, playerId, numberOfPlayers
    }
}

export interface GameJoining {
    joinGame(gameId: string, playerId: string): Promise<GameJoined>
    watchForOtherPlayers(gameId: string, playerId: string, onJoined: (event: PlayerJoinedGame) => void): Promise<Subscription>
}

class GameJoiningImpl implements GameJoining {

    constructor(
        private games: Games,
        private events: Events
    ) {}

    async joinGame(gameId: string, playerId: string): Promise<GameJoined> {
        
        const game = await this.games.findGameByIdOrThrow(gameId);

        let player = game.player(playerId);
        if (player === null) {
            player = game.addPlayer(playerId);
            await this.games.saveGame(game);

            await this.events.emit(playerJoinedGame(game.id, playerId, game.numberOfPlayers));
        }

        const playerAssignment = player.assignment();

        return {
            gameId,
            playerId,
            numberOfPlayers: game.numberOfPlayers,
            hasStarted: game.hasStarted,
            playerAssignment,
        }
    }

    async watchForOtherPlayers(gameId: string, playerId: string, onJoined: (event: PlayerJoinedGame) => void): Promise<Subscription> {
        const game = await this.games.findGameByIdOrThrow(gameId);
        
        if (!game.hasPlayer(playerId)) throw new Error('Player not in this game.');

        return this.events.subscribe(PlayerJoinedGameTypeName, async (event: PlayerJoinedGame) => {
            if (event.gameId != gameId) return;
            onJoined(event);
        });
    }
}

export const gameJoining = (games: Games, events: Events): GameJoining => {
    return new GameJoiningImpl(games, events);
}