import { createGame, copyGame, type Game } from '$lib/games';
import { GameCreated, PlayerAdded, type GameModification, GameStarted, StoryStarted, StoryCensored, StoryCensorRepaired, StoryContinued, replayGame, type GameHistory } from './Game';

export interface GameListener {
    close(): void;
    onClosed: () => void;
}

export interface Games {
    createGame(numberOfStoryEntries?: number): Promise<Game>
    findGameById(id: string): Promise<Game | null>
    findGameByIdOrThrow(id: string): Promise<Game>
    saveGame(game: Game): Promise<void>
    watch(id: string, onChange: (game: Game) => void): Promise<GameListener | null>
}

class GamesImpl implements Games {

    #games = new Map<string, Game>();
    #watchers = new Map<string, Set<(game: Game) => void>>();

    async createGame(numberOfStoryEntries: number): Promise<Game> {
        const id = Math.random().toString(36).substring(2) + '_' + this.#games.size.toString();
        const game: Game = createGame(id, numberOfStoryEntries);
        this.#games.set(id, game);
        return copyGame(game);
    }

    async findGameById(id: string): Promise<Game | null> {
        const game = this.#games.get(id)
        if (game == null) return null;
        return copyGame(game);
    }

    async findGameByIdOrThrow(id: string): Promise<Game> {
        const game = await this.findGameById(id)
        if (game == null) throw new Error('Game does not exist')
        return game
    }

    async saveGame(game: Game): Promise<void> {
        if (this.#games.has(game.id)) {
            this.#games.set(game.id, copyGame(game));
            const watchersForGame = this.#watchers.get(game.id)
            watchersForGame?.forEach(watcher => watcher(game))
        }
    }

    async watch(id: string, onChange: (game: Game) => void): Promise<GameListener | null> {
        if (this.#games.has(id)) {
            const watchers = this.#watchers.get(id)
            const watcher = {
                onClosed: () => { return },
                close: function () {
                    watchers?.delete(onChange)
                    this.onClosed()
                },
            }
            if (watchers == null) this.#watchers.set(id, new Set([onChange]))
            else watchers.add(onChange)
            return watcher
        } else return null;
    }
}

export const gamesRepository = (): Games => new GamesImpl();


