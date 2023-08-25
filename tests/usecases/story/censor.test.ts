import { beforeEach, describe, it, expect } from 'vitest';
import { redacted } from '../../../src/usecases';
import { assign, onlyDefinedAssignments, type Assignment } from '../../../src/games/assignments';

describe('Censoring a Story', () => {

    let gameId: string;
    let playerAssignment: () => Assignment | null | undefined;
    beforeEach(async () => {
        gameId = await redacted.createGame(1);
        await redacted.joinGame(gameId, 'player-1');
        await redacted.joinGame(gameId, 'player-2');
        await redacted.joinGame(gameId, 'player-3');
        await redacted.joinGame(gameId, 'player-4');
        await redacted.startGame(gameId);

        playerAssignment = await watchForAssignment(gameId, 'player-1');

        await redacted.startStory(gameId, 'player-4', 'Player four initial story content');
        await redacted.startStory(gameId, 'player-1', 'Player one initial story content');
        await redacted.startStory(gameId, 'player-2', 'Player two initial story content');
        await redacted.startStory(gameId, 'player-3', 'Player three initial story content');
    })

    const watchForAssignment = async (gameId: string, playerId: string) => {
        let newAssignment: Assignment | null | undefined;
        await redacted.watchForAssignment(gameId, playerId, assignment => {
            newAssignment = assignment;
        });
        return () => newAssignment;
    }

    it('assigns the next player to fix the story', async () => {
        await redacted.censorStory(gameId, 1, 'player-2', [0]);

        const nextPlayerAssignment = await watchForAssignment(gameId, 'player-2');

        await redacted.censorStory(gameId, 0, 'player-1', [1]);
        
        expect(nextPlayerAssignment()).toEqual(assign.repairingCensoredStory('Player      initial story content', 0, [[7, 11]]));
    });

    it('assigns the player a new assignment', async () => {
        const currentAssignment = playerAssignment();

        await redacted.censorStory(gameId, 0, 'player-1', [1]);
       
        expect(playerAssignment()).toBeDefined();
        expect(playerAssignment()).not.toEqual(currentAssignment);

    });

    it('must be done by a player in the game', async () => {
        const action = redacted.censorStory(gameId, 0, 'player-5', [0]);

        await expect(action).rejects.toThrow();
    })

    describe('given the next player is not yet ready for a new assignment', () => {

        it('does not assign the next player to fix the story yet', async () => {
            const nextPlayerAssignment = await watchForAssignment(gameId, 'player-2');

            await redacted.censorStory(gameId, 0, 'player-1', [1]);
            
            expect(nextPlayerAssignment()).toBeUndefined();
        });

    });

    describe('given the previous player has censored a story', () => {

        beforeEach(async () => {
            await redacted.censorStory(gameId, 3, 'player-4', [2]);
        });

        it('assigns the player to repair the story censored by the previous player', async () => {
            const newPlayerAssignment = await watchForAssignment(gameId, 'player-1');

            await redacted.censorStory(gameId, 0, 'player-1', [1]);
        
            expect(newPlayerAssignment()).toEqual(assign.repairingCensoredStory('Player three         story content', 3, [[13, 20]]));
        });

    });

    describe('the provided word indices', () => {

        it('does not accept no indices', async () => {
            const action = redacted.censorStory(gameId, 0, 'player-1', [] as number[] as [number, ...number[]]);

            await expect(action).rejects.toThrow();
        });

        it('does not accept more than three indices', async () => {
            const action = redacted.censorStory(gameId, 0, 'player-1', [0, 1, 2, 3]);

            await expect(action).rejects.toThrow();
        });

        [
            [0] as [number, ...number[]],
            [0, 1] as [number, ...number[]],
            [0, 1, 2] as [number, ...number[]],
        ].forEach(wordIndices => {
            it(`accepts ${wordIndices.length} index(ices)`, async () => {
                await redacted.censorStory(gameId, 0, 'player-1', wordIndices);
            });
        });

        it('does not accept indices out of range of the number of words in the story entry', async () => {
            const action = redacted.censorStory(gameId, 0, 'player-1', [5]);

            await expect(action).rejects.toThrow();
        });

    });

    describe('given the player is not assigned to censor the story', () => {

        describe('Case: the story isn\'t in the game', () => {
            
            it('rejects censoring the story', async () => {
                const action = redacted.censorStory(gameId, 5, 'player-1', [0]);

                await expect(action).rejects.toThrow();
            });
        });

        describe('Case: the story isn\'t ready to be censored', () => {

            beforeEach(async () => {
                await redacted.censorStory(gameId, 0, 'player-1', [0]);
            })

            it('rejects censoring the story', async () => {
                const action = redacted.censorStory(gameId, 0, 'player-1', [0]);

                await expect(action).rejects.toThrow();
            });

        });

        describe('Case: the story is assigned to be censored by a different player', () => {

            it('rejects censoring the story', async () => {
                const action = redacted.censorStory(gameId, 1, 'player-1', [0]);

                await expect(action).rejects.toThrow();
            });

        })

    })

    describe('post-conditions', () => {

        beforeEach(async () => {
            await redacted.censorStory(gameId, 0, 'player-1', [2])
        })

        describe('the end of the game', () => {

            beforeEach(async () => {
                await redacted.censorStory(gameId, 1, 'player-2', [0])
                await redacted.censorStory(gameId, 2, 'player-3', [0])
                await redacted.censorStory(gameId, 3, 'player-4', [0])
            
                await redacted.repairCensoredStory(gameId, 0, 'player-2', ['replacement1'])
                await redacted.repairCensoredStory(gameId, 1, 'player-3', ['replacement2'])
                await redacted.repairCensoredStory(gameId, 2, 'player-4', ['replacement3'])
                await redacted.repairCensoredStory(gameId, 3, 'player-1', ['replacement4'])
            })

            it('presents which words were censored', async () => {
                const assignment = (await redacted.joinGame(gameId, 'player-1')).playerAssignment
                
                assignment.accept(onlyDefinedAssignments({
                    readingStories(stories) {
                        expect(stories[0][0].censors).toContainEqual(
                            ['Player four '.length, 'Player four '.length + 'replacement1'.length]
                        )
                    },
                }))
            })

            it('presents who censored the story', async () => {
                const assignment = (await redacted.joinGame(gameId, 'player-1')).playerAssignment

                assignment.accept(onlyDefinedAssignments({
                    readingStories(stories) {
                        expect(stories[0][0].players[1]).toEqual('player-1')
                    },
                }))
            })

        })

    })

})