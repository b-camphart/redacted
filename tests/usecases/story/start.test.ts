import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { redacted } from '../../../src/usecases';
import { onlyDefinedAssignments, type Assignment } from '../../../src/games/assignments';

describe('Starting a Story', () => {

    let gameId: string;

    beforeEach(async () => {
        gameId = await redacted.createGame();
        await redacted.joinGame(gameId, 'player-1');
        await redacted.joinGame(gameId, 'player-2');
        await redacted.joinGame(gameId, 'player-3');
        await redacted.joinGame(gameId, 'player-4');
        await redacted.startGame(gameId);
    });

    const watchForAssignment = async (gameId: string, playerId: string) => {
        let receivedAssignment: Assignment | null | undefined;
        await redacted.watchForAssignment(gameId, playerId, assignment => {
            receivedAssignment = assignment;
        });
        return () => receivedAssignment;
    }

    it('assigns the player a new assignment', async () => {
        const newAssignment = await watchForAssignment(gameId, 'player-1');
        
        await redacted.startStory(gameId, 'player-1', 'Initial story content');

        expect(newAssignment()).toBeDefined();
    });

    describe('given the player has already started a story', () => {

        beforeEach(async () => {
            await redacted.startStory(gameId, 'player-1', 'Initial story content')
        })

        it('does not allow the player to start another story', async () => {
            const action = redacted.startStory(gameId, 'player-1', 'Another story to start')

            await expect(action).rejects.toThrow();
        })

    })

    describe('given the game requires two entries in each story', () => {

        beforeEach(async () => {
            gameId = await redacted.createGame(2);
            await redacted.joinGame(gameId, 'player-1');
            await redacted.joinGame(gameId, 'player-2');
            await redacted.joinGame(gameId, 'player-3');
            await redacted.joinGame(gameId, 'player-4');
            await redacted.startGame(gameId);
        });

        it('assigns the next player to advance the story', async () => {  
            const nextPlayerAssignment = await watchForAssignment(gameId, 'player-2');

            await redacted.startStory(gameId, 'player-2', 'Initial story content 2');
            await redacted.startStory(gameId, 'player-1', 'Initial story content');

            expectAssignmentToBeRedactingStory(nextPlayerAssignment(), 'Initial story content');
        });

        describe('given the next player is assigned to something else', () => {

            it('does not change the next player\'s assignment', async () => {
                const nextPlayerAssignment = await watchForAssignment(gameId, 'player-2');
    
                await redacted.startStory(gameId, 'player-1', 'Initial story content');
    
                expect(nextPlayerAssignment()).toBeUndefined();
            });

        });

        describe('given the previous player started a story', () => {

            beforeEach(async () => {
                await redacted.startStory(gameId, 'player-4', 'Initial story content 4');
            })

            it('assigns the previous player\'s story to the player', async () => {
                const playerAssignment = await watchForAssignment(gameId, 'player-1');
    
                await redacted.startStory(gameId, 'player-1', 'Initial story content');
   
                expectAssignmentToBeRedactingStory(playerAssignment(), 'Initial story content 4'); 
            })

        })

    })

})

function expectAssignmentToBeRedactingStory(possibleAssignment: Assignment | null | undefined, expectedContent: string) {
    expect(possibleAssignment).toBeDefined();
    const contentWasChecked = possibleAssignment!.accept(onlyDefinedAssignments({
        redactingStory(content) { 
            expect(content).toEqual(expectedContent);
            return true;
        },
    }));
    expect(contentWasChecked).toBe(true);
}
