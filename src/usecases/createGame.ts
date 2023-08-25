import type { Games } from '../games/Repository'

export interface GameCreation {
    createGame(numberOfStoryEntries?: number): Promise<string>
}

class GameCreationImpl implements GameCreation {
    constructor(private games: Games) {}

    async createGame(numberOfStoryEntries: number = 6): Promise<string> {
        const game = await this.games.createGame(numberOfStoryEntries);
        return game.id
    }
}

export const gameCreation = (games: Games): GameCreation => {
    return new GameCreationImpl(games);
}