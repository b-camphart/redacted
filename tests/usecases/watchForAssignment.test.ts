import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { gameEvents, redacted } from '../../src/usecases';
import type { Assignment } from '../../src/games/assignments';
import { newAssignment } from '../../src/usecases/watchForAssignment';

describe('Watch for Assignment', () => {

    let gameId: string;
    beforeEach(async () => {
        gameId = await redacted.createGame();
        await redacted.joinGame(gameId, 'player-1');
    });

    let assignmentReceived: Assignment | null | undefined;
    afterEach(() => {
        assignmentReceived = undefined;
    })

    const watchForAssignment = async (gameId: string, playerId: string) => {
        return redacted.watchForAssignment(gameId, playerId, (assignment) => {
            assignmentReceived = assignment;
        });
    }

    const emitNewAssignment = (gameId: string, playerId: string) => {
        return gameEvents.emit(newAssignment(
            gameId,
            playerId,
            {
                accept(visitor) {
                    return visitor.awaitingAssignment();
                },
            }
        ));
    }

    it('notifies the player of a new assignment', async () => {
        await watchForAssignment(gameId, 'player-1');

        await emitNewAssignment(gameId, 'player-1');

        expect(assignmentReceived).toBeDefined();
    });

    it('does not notify the player of assignments from other games', async () => {
        await watchForAssignment(gameId, 'player-1');

        await emitNewAssignment('other-game-id', 'player-1');

        expect(assignmentReceived).toBeUndefined();
    });

    it('does not notify the player of assignments for other players', async () => {
        await watchForAssignment(gameId, 'player-1');

        await emitNewAssignment(gameId, 'player-2');

        expect(assignmentReceived).toBeUndefined();
    });

    describe('given the game does not exist', () => {
        it('does not allow the player to watch for an assignment', async () => {
            const action = watchForAssignment('fake-game-id', 'player-1');

            await expect(action).rejects.toThrow();
            expect(assignmentReceived).toBeUndefined();
        });
    });

    describe('given the player has not yet joined the game', () => {
        it('does not allow the player to watch for an assignment', async () => {
            const action = watchForAssignment(gameId, 'player-2');

            await expect(action).rejects.toThrow();
            expect(assignmentReceived).toBeUndefined();
        });
    });

})