import { createGame } from '$lib/games';
import { gamesRepository, type Games } from '../../src/games/Repository';
import { describe, test, expect } from 'vitest';

describe('GamesRepository', () => { 

    const games: Games = gamesRepository();

    describe('creating a game', () => {

        test('games have unique ids', async () => {
            const game1 = await games.createGame();
            const game2 = await games.createGame();

            expect(game1.id).not.toEqual(game2.id);
        })

    })

    describe('finding a game', () => {

        test('games can be found by their id', async () => {
            const game = await games.createGame();

            expect(await games.findGameById(game.id)).toEqual(game);
            expect(await games.findGameByIdOrThrow(game.id)).toEqual(game);
        })

        test('cannot find games that do not exist', async () => {
            expect(await games.findGameById('bloop')).toBeNull();
            await expect(games.findGameByIdOrThrow('bloop')).rejects.toThrow();
        })

    })

    describe('saving a game', () => {

        test('mutating a game has no affect on the saved game', async () => {
            const game = await games.createGame();
            game.addPlayer('1');

            const savedGame = await games.findGameById(game.id);
            expect(savedGame?.hasPlayer('1')).toBe(false);
        })

        test('contributing to a story has no affect unless the game is saved', async () => {
            const gameId = (await games.createGame()).id;
            const game = await games.findGameByIdOrThrow(gameId);

            game.addPlayer('1')
            game.addPlayer('2')
            game.addPlayer('3')
            game.addPlayer('4')

            game.start()

            game.player('1')!.startStory('Initial content')

            const savedGame = await games.findGameByIdOrThrow(game.id);
            expect(savedGame.hasStarted).toBeFalsy();
            expect(savedGame.numberOfPlayers).toEqual(0)
            expect(savedGame.playerAssignments).toHaveLength(0)

        })

        test('only games that exist can be saved', async () => {
            await games.saveGame(createGame('bloop'))
            
            expect(await games.findGameById('bloop')).toBeNull();
            await expect(games.findGameByIdOrThrow('bloop')).rejects.toThrow();
        })

    })
    
});