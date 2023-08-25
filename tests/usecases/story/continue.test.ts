import { describe, it, expect, beforeEach, vi } from 'vitest'
import { redacted } from '../../../src/usecases'
import { assign, onlyDefinedAssignments, type Assignment, type AssignmentVisitor } from '../../../src/games/assignments'

describe('Continuing a Story', () => {
    // the game has to exist
    // the player has to be assigned to continue that story
    // the content must have at least two words
    
    // the game should be saved afterward
    // the new assignment for the player should be emitted
    // if there is a new assignment for the next player, it should be emitted

    let gameId: string;
    beforeEach(async () => {
        gameId = await redacted.createGame();
        await redacted.joinGame(gameId, 'player-1');
        await redacted.joinGame(gameId, 'player-2');
        await redacted.joinGame(gameId, 'player-3');
        await redacted.joinGame(gameId, 'player-4');

        await redacted.startGame(gameId);

        await redacted.startStory(gameId, 'player-1', 'Story one initial content by player one')
        await redacted.startStory(gameId, 'player-2', 'Story two initial content by player two')
        await redacted.startStory(gameId, 'player-3', 'Story three initial content by player three')
        await redacted.startStory(gameId, 'player-4', 'Story four initial content by player four')

        await redacted.censorStory(gameId, 0, 'player-2', [2])
        await redacted.censorStory(gameId, 1, 'player-3', [2])
        await redacted.censorStory(gameId, 2, 'player-4', [2])
        await redacted.censorStory(gameId, 3, 'player-1', [2])

        await redacted.repairCensoredStory(gameId, 0, 'player-3', ['repaired'])
        await redacted.repairCensoredStory(gameId, 1, 'player-4', ['repaired'])
        await redacted.repairCensoredStory(gameId, 2, 'player-1', ['repaired'])
        await redacted.repairCensoredStory(gameId, 3, 'player-2', ['repaired'])

        await redacted.continueStory(gameId, 1, 'player-1', 'Story two continued content by player one')
    })

    it('assigns the next player to redact the continued content', async () => {
        await redacted.continueStory(gameId, 0, 'player-4', 'Story one continued content by player four')
        
        await redacted.continueStory(gameId, 3, 'player-3', 'Story four continued content by player three')

        const { playerAssignment } = await redacted.joinGame(gameId, 'player-4')
        expect(playerAssignment).toEqual(assign.redactingStory('Story four continued content by player three', 3))
    })

    it('emits the next player\'s assignment', async () => {
        await redacted.continueStory(gameId, 0, 'player-4', 'Story one continued content by player four')

        let emittedAssignment: Assignment | null | undefined = undefined;
        await redacted.watchForAssignment(gameId, 'player-4', (assignment) => {
            emittedAssignment = assignment
        })

        await redacted.continueStory(gameId, 3, 'player-3', 'Story four continued content by player three')

        expect(emittedAssignment).toEqual(assign.redactingStory('Story four continued content by player three', 3))
    })

    describe('given the next player is currently assigned to another story', () => {

        it('does not emit the next player\'s assignment', async () => {
            let emittedAssignment: Assignment | null | undefined = undefined;
            await redacted.watchForAssignment(gameId, 'player-4', (assignment) => {
                emittedAssignment = assignment
            })

            await redacted.continueStory(gameId, 3, 'player-3', 'Story four continued content by player three')

            expect(emittedAssignment).toBeUndefined();   
        })

    })

    it('emits the current player\'s new assignment', async () => {
        await redacted.continueStory(gameId, 2, 'player-2', 'Story three continued content by player two')

        let emittedAssignment: Assignment | null | undefined = undefined;
        await redacted.watchForAssignment(gameId, 'player-3', (assignment) => {
            emittedAssignment = assignment
        })

        await redacted.continueStory(gameId, 3, 'player-3', 'Story four continued content by player three')

        expect(emittedAssignment).toEqual(assign.redactingStory('Story three continued content by player two', 2))
    })
    
    it('must be done in a game that exists', async () => {
        const action = redacted.continueStory('some-game', 3, 'player-3', 'Attempted continued content')

        await expect(action).rejects.toThrow()
    })

    it('must be done by a player in the game', async () => {
        const action = redacted.continueStory(gameId, 3, 'other-player', 'Attempted continued content');

        await expect(action).rejects.toThrow()
    })

    it('must be done on a story that exists in the game', async () => {
        const action = redacted.continueStory(gameId, 15, 'player-3', 'Attempted continued content');

        await expect(action).rejects.toThrow();
    })   

    describe('the content', () => {

        it('must have at least two words', async () => {
            const action = redacted.continueStory(gameId, 3, 'player-3', 'One')

            await expect(action).rejects.toThrow()
        })

    })

    it('must be done by the player assigned to continue the story', async () => {
        assertAssignment((await redacted.joinGame(gameId, 'player-2')).playerAssignment, {
            continuingStory() {}
        })

        const action = redacted.continueStory(gameId, 3, 'player-2', 'Attempted continued content');

        await expect(action).rejects.toThrow()
    })

    it('must be done when the story is ready to be continued', async () => {
        await redacted.continueStory(gameId, 0, 'player-4', 'Story one continued content by player four')
        await redacted.continueStory(gameId, 3, 'player-3', 'Story four continued content by player three')

        assertAssignment((await redacted.joinGame(gameId, 'player-4')).playerAssignment, {
            redactingStory(content, storyIndex) {
                expect(storyIndex).toEqual(3)
            },
        })

        const action = redacted.continueStory(gameId, 3, 'player-4', 'Another continuation?')

        await expect(action).rejects.toThrow();
    })

    function assertAssignment<T>(assignment: Assignment, visitor: Partial<AssignmentVisitor<T>>) {
        assignment.accept(onlyDefinedAssignments(visitor))
    }

})