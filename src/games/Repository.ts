import { createGame, copyGame, type Game } from '$lib/games';
import { kv } from '@vercel/kv'
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

export const vercelGamesRepository = (): Games => new VercelGamesImpl();

class VercelGamesImpl implements Games {

    async createGame(numberOfStoryEntries?: number | undefined): Promise<Game> {
        const id = Math.random().toString(36).substring(2) + '_' + await kv.dbsize()
        const game: Game = createGame(id, numberOfStoryEntries);
        kv.set(game.id, [{ type: 'GameCreated', entriesPerStory: numberOfStoryEntries }])
        return copyGame(game);
    }

    async findGameById(id: string): Promise<Game | null> {
        const serializedMods = await kv.get<{ type: string, [key: string]: any }[]>(id);
        if (serializedMods == null) return null;

        const mods = serializedMods.map(serialized => {
            switch (serialized.type) {
                case "GameCreated": {
                    return new GameCreated(id, serialized["entriesPerStory"])
                }
                case "PlayerAdded": {
                    return new PlayerAdded(serialized["playerId"])
                }
                case "GameStarted": {
                    return new GameStarted()
                }
                case "StoryStarted": {
                    return new StoryStarted(serialized["playerId"], serialized["content"])
                }
                case "StoryCensored": {
                    return new StoryCensored(serialized["playerId"], serialized["storyIndex"], serialized["wordIndices"])
                }
                case "StoryCensorRepaired": {
                    return new StoryCensorRepaired(serialized["playerId"], serialized["storyIndex"], serialized["replacements"])
                }
                case "StoryContinued": {
                    return new StoryContinued(serialized["playerId"], serialized["storyIndex"], serialized["content"])
                }
                default: {
                    throw new Error(`Unrecognized game event: ${serialized.type}`)
                }
            }
        })

        return replayGame(mods as GameHistory)
    }

    async findGameByIdOrThrow(id: string): Promise<Game> {
        const game = await this.findGameById(id);
        if (game == null) throw new Error('Game does not exist');
        return game;
    }

    async saveGame(game: Game): Promise<void> {
        if (await kv.exists(game.id)) {

            const mods = game.history();

            const serializedMods: { type: string, [key: string]: any }[] = [{ type: 'GameCreated', entriesPerStory: mods[0].entriesPerStory }]

            for (const mod of mods.slice(1) as GameModification[]) {
                const serialized: { type: string, applyTo?: GameModification["applyTo"] } = { type: mod.constructor.name, ...mod }
                delete serialized.applyTo;
                serializedMods.push(serialized)
            }

            await kv.set(game.id, serializedMods);
        }
    }

    async watch(id: string, onChange: (game: Game) => void): Promise<GameListener | null> {
        return null;        
    }

}

