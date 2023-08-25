import type { EventEmitter } from '$lib/updates';
import type { Games } from '../games/Repository'
import { newAssignment } from './watchForAssignment';

export interface GameStart {
    startGame(gameId: string): Promise<void>
}

class GameStartImpl implements GameStart {
    constructor(
        private games: Games,
        private emitter: EventEmitter,
    ) {}

    async startGame(gameId: string): Promise<void> {
        const game = await this.games.findGameByIdOrThrow(gameId);

        if (! game.start()) throw new Error("Cannot start game");
    
        await this.games.saveGame(game);

        game.playerAssignments().forEach(([playerId, assignment]) => this.emitter.emit(newAssignment(game.id, playerId, assignment)));
    }
}

export const gameStart = (games: Games, emitter: EventEmitter): GameStart => {
    return new GameStartImpl(games, emitter);
}