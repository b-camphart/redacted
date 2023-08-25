import { describe, it, expect, beforeEach } from "vitest";
import { redacted } from "../../../../src/usecases";
import { assign, onlyDefinedAssignments, type Assignment } from "../../../../src/games/assignments";

describe('Repairing a Censored Story', () => {

    let gameId: string;
    let players: string[] = [
        'player-1',
        'player-2',
        'player-3',
        'player-4',
    ];
    beforeEach(async () => {
        gameId = await redacted.createGame();
        for (const playerId of players) {
            await redacted.joinGame(gameId, playerId);
        }
        await redacted.startGame(gameId);
    })

    const repairCensoredStory = (storyIndex: number, playerId: string, replacements: string[]) => {        
        return redacted.repairCensoredStory(gameId, storyIndex, playerId, replacements);
    }

    const watchForAssignment = async (playerId: string) => {
        let assignment: Assignment | null | undefined;

        await redacted.watchForAssignment(gameId, playerId, newAssignment => {
            assignment = newAssignment;
        })
        return () => assignment;
    }

    it('assigns the next player to continue the story with the repaired text', async () => {
        await redacted.startStory(gameId, 'player-3', 'Player three initial story content');
        await redacted.startStory(gameId, 'player-4', 'Player four initial story content');
        await redacted.censorStory(gameId, 0, 'player-4', [0]);

        await redacted.startStory(gameId, 'player-1', 'Player one initial story content');
        await redacted.censorStory(gameId, 1, 'player-1', [0]);

        await redacted.startStory(gameId, 'player-2', 'Player two initial story content');
        await redacted.censorStory(gameId, 2, 'player-2', [0]);
        await redacted.repairCensoredStory(gameId, 1, 'player-2', ['Replacement']);

        const nextPlayerAssignment = await watchForAssignment('player-2');

        await repairCensoredStory(0, 'player-1', ['Replacement']);

        expect(nextPlayerAssignment()).toEqual(assign.continuingStory('Replacement three initial story content', 0));
    });
    
    it('replaces the corresponding words', async () => {
        await redacted.startStory(gameId, 'player-3', 'Player three initial story content');
        await redacted.startStory(gameId, 'player-4', 'Player four initial story content');
        await redacted.censorStory(gameId, 0, 'player-4', [2, 3, 4]);

        await redacted.startStory(gameId, 'player-1', 'Player one initial story content');
        await redacted.censorStory(gameId, 1, 'player-1', [0]);

        await redacted.startStory(gameId, 'player-2', 'Player two initial story content');
        await redacted.censorStory(gameId, 2, 'player-2', [0]);
        await redacted.repairCensoredStory(gameId, 1, 'player-2', ['Replacement']);

        const nextPlayerAssignment = await watchForAssignment('player-2');

        await repairCensoredStory(0, 'player-1', ['Replacement1', 'Replacement2', 'Replacement3']);

        expect(nextPlayerAssignment()).toEqual(assign.continuingStory('Player three Replacement1 Replacement2 Replacement3', 0));
    });

    describe('given this is the last entry for the story in the game', () => {

        beforeEach(async () => {
            gameId = await redacted.createGame(1);
            for (const playerId of players) {
                await redacted.joinGame(gameId, playerId);
            }
            await redacted.startGame(gameId);

            await redacted.startStory(gameId, 'player-3', 'Player three initial story content');
            await redacted.startStory(gameId, 'player-4', 'Player four initial story content');
            await redacted.censorStory(gameId, 0, 'player-4', [0]);

            await redacted.startStory(gameId, 'player-1', 'Player one initial story content');
            await redacted.censorStory(gameId, 1, 'player-1', [0]);

            await redacted.startStory(gameId, 'player-2', 'Player two initial story content');
            await redacted.censorStory(gameId, 2, 'player-2', [0]);
            await redacted.repairCensoredStory(gameId, 1, 'player-2', ['Replacement']);   
        })

        it('awaits the end of the game', async () => {
            const nextPlayerAssignment = await watchForAssignment('player-2');

            await repairCensoredStory(0, 'player-1', ['Replacement']);

            expect(nextPlayerAssignment()).toEqual(assign.nothing());
        })

        describe('given all the other stories have been completed', () => {

            beforeEach(async () => {
                await redacted.censorStory(gameId, 3, 'player-3', [0]);
                await redacted.repairCensoredStory(gameId, 2, 'player-3', ['Replacement']);
                await redacted.repairCensoredStory(gameId, 3, 'player-4', ['Replacement']);
            })

            it('assigns all players to read the finished stories', async () => {
                const allPlayerAssignments = [];
                for (const playerId of players) {
                    allPlayerAssignments.push(await watchForAssignment(playerId));
                }

                await repairCensoredStory(0, 'player-1', ['Replacement']);

                for (const assignment of allPlayerAssignments) {
                    const currentAssignment = assignment()!;
                    currentAssignment.accept(onlyDefinedAssignments({
                        readingStories(stories) {
                            expect(stories[0][0].content).toEqual('Replacement three initial story content')
                            expect(stories[1][0].content).toEqual('Replacement four initial story content')
                            expect(stories[2][0].content).toEqual('Replacement one initial story content')
                            expect(stories[3][0].content).toEqual('Replacement two initial story content')
                        },
                    }))
                }
            })

            it('shows who repaired the story', async () => {
                const allPlayerAssignments = [];
                for (const playerId of players) {
                    allPlayerAssignments.push(await watchForAssignment(playerId));
                }

                await repairCensoredStory(0, 'player-1', ['Replacement']);

                for (const assignment of allPlayerAssignments) {
                    const currentAssignment = assignment()!;
                    currentAssignment.accept(onlyDefinedAssignments({
                        readingStories(stories) {
                            expect(stories[0][0].players).toContain('player-1')
                        },
                    }))
                }

            })

        })

    })

})