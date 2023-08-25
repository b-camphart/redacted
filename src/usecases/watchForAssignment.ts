import type { Assignment } from "$lib/assignments"
import type { EventSubscriber, Subscription } from "$lib/updates"
import type { Games } from "../games/Repository"

export type NewAssignment = {
    type: 'NewAssignment',
    gameId: string,
    playerId: string,
    assignment: Assignment | null
}

export const newAssignment = (
    gameId: string,
    playerId: string,
    assignment: Assignment | null
): NewAssignment => {
    return {
        type: 'NewAssignment', gameId, playerId, assignment
    }
}

export interface AssignmentWatch {
    watchForAssignment(gameId: string, playerId: string, onAssignment: (assignment: Assignment | null) => void): Promise<Subscription>;
}

class AssignmentWatchImpl implements AssignmentWatch {

    constructor(
        private games: Games,
        private subscriber: EventSubscriber
    ) {}

    async watchForAssignment(gameId: string, playerId: string, onAssignment: (assignment: Assignment | null) => void): Promise<Subscription> {
        const game = await this.games.findGameByIdOrThrow(gameId);
        
        if (!game.hasPlayer(playerId)) throw new Error('Player not in this game.');

        return this.subscriber.subscribe('NewAssignment', async (event: NewAssignment) => {
            if (event.gameId != gameId) return;
            if (event.playerId != playerId) return;
            onAssignment(event.assignment);
        });
    }
}

export const assignmentWatch = (
    games: Games,
    subscriber: EventSubscriber
): AssignmentWatch => new AssignmentWatchImpl(games, subscriber);