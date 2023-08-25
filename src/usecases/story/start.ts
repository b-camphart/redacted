import type { EventEmitter } from "$lib/updates";
import type { Games } from "../../games/Repository"
import { newAssignment } from "../watchForAssignment";

export interface StoryStart {
    startStory(gameId: string, playerId: string, content: string): Promise<void>
}

class StoryStartImpl implements StoryStart {

    constructor(
        private games: Games,
        private emitter: EventEmitter,
    ) {}

    async startStory(gameId: string, playerId: string, content: string): Promise<void> {
        const game = await this.games.findGameByIdOrThrow(gameId);

        const player = game.player(playerId);
        if (player === null) throw new Error('Player not in game')

        const result = player.startStory(content);

        await this.games.saveGame(game);

        this.emitter.emit(newAssignment(game.id, playerId, player.assignment()));
        if (result !== null) {
            this.emitter.emit(newAssignment(game.id, result.playerId, result.assignment));
        }
        
    }
}

export const storyStart = (
    games: Games,
    emitter: EventEmitter
): StoryStart => new StoryStartImpl(games, emitter);