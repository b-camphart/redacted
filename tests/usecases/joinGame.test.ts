import { beforeEach, describe, expect, it } from "vitest";
import { redacted, gameEvents } from "../../src/usecases";
import type { PlayerJoinedGame } from "../../src/usecases/joinGame";


describe('GameJoining', () => {

    let gameId: string;
    beforeEach(async () => {
        gameId = await redacted.createGame();
    })

    describe('joinGame', () => {

        it('increases the number of players in the game', async () => {
            const { numberOfPlayers } = await redacted.joinGame(gameId, '');
            
            expect(numberOfPlayers).toBe(1);
        });

        it('emits an event about the player having joined', async () => {
            let playerJoinedGameEvent: PlayerJoinedGame | undefined;

            gameEvents.subscribe('PlayerJoinedGame', async (event: PlayerJoinedGame) => {
                playerJoinedGameEvent = event;
            });

            await redacted.joinGame(gameId, 'player-id');

            expect(playerJoinedGameEvent).not.toBeUndefined();
            expect(playerJoinedGameEvent?.gameId).toEqual(gameId);
            expect(playerJoinedGameEvent?.playerId).toEqual('player-id');
            expect(playerJoinedGameEvent?.numberOfPlayers).toEqual(1);
        });

        describe('given the game does not exist', () => {

            it('does not allow a player to join', async () => {
                const action = redacted.joinGame('nonexistant-game-id', 'player-id');

                await expect(action).rejects.toThrow();
            });

        });

        describe('given the player has already joined the game', () => {

            const playerId = 'player-in-game-id';
            beforeEach(async () => {
                await redacted.joinGame(gameId, playerId);
            });

            it('does not increase the number of players', async () => {
                const { numberOfPlayers } = await redacted.joinGame(gameId, playerId);

                expect(numberOfPlayers).toEqual(1);
            });

            it('does not emit an event', async  () => {
                let playerJoinedGameEvent: PlayerJoinedGame | undefined;
                gameEvents.subscribe('PlayerJoinedGame', async (event: PlayerJoinedGame) => {
                    playerJoinedGameEvent = event;
                });
    
                await redacted.joinGame(gameId, playerId);
    
                expect(playerJoinedGameEvent).toBeUndefined();
            });

        });

        describe('given other players have joined the game', () => {

            const otherPlayers = ['player-1', 'player-2']
            beforeEach(async () => {
                for (const playerId of otherPlayers) {
                    await redacted.joinGame(gameId, playerId);
                }
            });

            it('increases the number of players each time', async () => {
                const { numberOfPlayers } = await redacted.joinGame(gameId, 'player-3');

                expect(numberOfPlayers).toEqual(3);
            });
        })

    });

    describe('watch for other players', () => {

        it('emits an event when another player joins', async () => {
            await redacted.joinGame(gameId, 'player-1');

            let playerJoinedGame: PlayerJoinedGame | undefined;

            await redacted.watchForOtherPlayers(gameId, 'player-1', async (event) => {
                playerJoinedGame = event;
            });

            await redacted.joinGame(gameId, 'player-2');

            expect(playerJoinedGame).not.toBeUndefined();
            expect(playerJoinedGame?.gameId).toEqual(gameId);
            expect(playerJoinedGame?.playerId).toEqual('player-2');
            expect(playerJoinedGame?.numberOfPlayers).toEqual(2);
        });

        it('does not allow players that have not joined to watch for other players', async () => {
            await redacted.joinGame(gameId, 'player-1');

            const action = redacted.watchForOtherPlayers(gameId, 'player-2', async () => { return; });

            await expect(action).rejects.toThrow();
        });

        it('does not emit events for other games', async () => {
            const otherGameId = await redacted.createGame();
            await redacted.joinGame(gameId, 'player-1');

            let playerJoinedGame: PlayerJoinedGame | undefined;

            await redacted.watchForOtherPlayers(gameId, 'player-1', async (event) => {
                playerJoinedGame = event;
            });

            await redacted.joinGame(otherGameId, 'player-2');

            expect(playerJoinedGame).toBeUndefined();
        })

    })

})