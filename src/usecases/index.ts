import { events } from "$lib/updates";
import { gamesRepository, vercelGamesRepository } from "../games/Repository";
import { gameCreation, type GameCreation } from "./createGame";
import { gameJoining, type GameJoining } from "./joinGame";
import { gameStart, type GameStart } from "./startGame";
import { storyStart, type StoryStart } from "./story/start";
import { getValidWordRanges } from "./story/wordRanges";
import { assignmentWatch, newAssignment, type AssignmentWatch } from "./watchForAssignment";

interface Redacted extends 
    GameCreation, 
    GameJoining,
    GameStart ,
    StoryStart,
    AssignmentWatch
{

    censorStory(gameId: string, storyIndex: number, userId: string, wordIndices: [number, ...number[]]): Promise<void>;
    repairCensoredStory(gameId: string, storyIndex: number, playerId: string, replacements: string[]): Promise<void>;
    continueStory(gameId: string, storyIndex: number, playerId: string, content: string): Promise<void>;
}

const games = process.env.host === 'vercel' ? vercelGamesRepository() : gamesRepository();
export const gameEvents = events();

const map = <T, R>(obj: T, block: (it: T) => R) => {
    return block(obj);
}

const joinGameUseCase = gameJoining(games, gameEvents)

export const redacted: Redacted = {
    createGame: map(gameCreation(games), (it) => it.createGame.bind(it)),
    startGame: map(gameStart(games, gameEvents), (it) => it.startGame.bind(it)),
    joinGame: joinGameUseCase.joinGame.bind(joinGameUseCase),
    watchForOtherPlayers: joinGameUseCase.watchForOtherPlayers.bind(joinGameUseCase),
    startStory: map(storyStart(games, gameEvents), it => it.startStory.bind(it)),
    censorStory: async (gameId: string, storyIndex: number, userId: string, wordIndices: [number, ...number[]]) => {
        const game = await games.findGameByIdOrThrow(gameId);
        const player = game.player(userId);
        if(!player) throw new Error('Player not found in game');

        const story = game.story(storyIndex);
        if(!story) throw new Error('Story not found for given index');

        if (wordIndices.length === 0) {
            throw new Error('At least one word index is required.');
        }
        if (wordIndices.length > 3) {
            throw new Error('Maximum of 3 word indices allowed.');
        }
        
        const otherPlayerNewAssignment = story.censor(player, wordIndices);
        games.saveGame(game);
        await gameEvents.emit(newAssignment(gameId, userId, player.assignment()));
        if (otherPlayerNewAssignment !== null) {
            await gameEvents.emit(newAssignment(gameId, otherPlayerNewAssignment.playerId, otherPlayerNewAssignment.assignment));
        }
    },
    repairCensoredStory: async (gameId: string, storyIndex: number, playerId: string, replacements: string[]) => {
        const game = await games.findGameByIdOrThrow(gameId);
        const player = game.player(playerId);
        if (player === null) {
            return;
        }

        const story = game.story(storyIndex);
        if (story === null) {
            return;
        }

        const otherPlayerNewAssignment = story.repairCensorship(player, replacements);
        games.saveGame(game);
        if (game.hasEnded) {
            for (const playerAssignment of game.playerAssignments()) {
                await gameEvents.emit(newAssignment(gameId, playerAssignment[0], playerAssignment[1]));
            }
            return;
        }
        await gameEvents.emit(newAssignment(gameId, playerId, player.assignment()));
        if (otherPlayerNewAssignment !== null) {
            await gameEvents.emit(newAssignment(gameId, otherPlayerNewAssignment.playerId, otherPlayerNewAssignment.assignment));
        }
    },
    async continueStory(gameId, storyIndex, playerId, content) {
        const game = await games.findGameByIdOrThrow(gameId);
        const player = game.player(playerId);
        if (player == null) {
            throw new Error(`Cannot find player ${playerId} in game ${gameId}`);
        }

        const story = game.story(storyIndex);
        if (story === null) {
            throw new Error(`Cannot find story ${storyIndex} in game ${gameId}`);
        }

        if (getValidWordRanges(content).length < 2) {
            throw new Error('Not enough words in received content')
        }

        const otherPlayerNewAssignment = story.continue(player, content);
        games.saveGame(game);
        await gameEvents.emit(newAssignment(gameId, playerId, player.assignment()));
        if (otherPlayerNewAssignment !== null) {
            await gameEvents.emit(newAssignment(gameId, otherPlayerNewAssignment.playerId, otherPlayerNewAssignment.assignment));
        }
    },
    watchForAssignment: map(assignmentWatch(games, gameEvents), it => it.watchForAssignment.bind(it)),
}
