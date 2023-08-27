import { getValidWordRanges, type NumberRange } from "../usecases/story/wordRanges";
import { assign, onlyDefinedAssignments as definedAssignmentsOrThrow, type Assignment, onlyDefinedAssignments } from "./assignments";

export interface Game {
    readonly id: string
    readonly numberOfPlayers: number;
    readonly hasStarted: boolean;
    readonly hasEnded: boolean;
    start(): boolean;

    hasPlayer(playerId: string): boolean;
    addPlayer(playerId: string): PlayerInGame;
    player(playerId: string): PlayerInGame | null;
    playerAssignments(): [playerId: string, assignment: Assignment | null][];

    story(index: number): Story | null;

    history(): GameHistory;
}

export type GameHistory = [GameCreated, ...GameModification[]];

export interface GameModification {
    applyTo(game: Game): void;
}
export class GameCreated {
    constructor(public gameId: string, public entriesPerStory: number) {}
}
export class PlayerAdded implements GameModification { 
    constructor(public playerId: string) {}

    applyTo(game: Game): void {
        game.addPlayer(this.playerId);
    }
}
export class GameStarted implements GameModification {
    applyTo(game: Game): void {
        game.start();
    }
}
export class StoryStarted implements GameModification { 
    constructor(public playerId: string, public content: string) {}

    applyTo(game: Game): void {
        game.player(this.playerId)!.startStory(this.content);
    }
}
export class StoryCensored implements GameModification { 
    constructor(public playerId: string, public storyIndex: number, public wordIndices: number[]) {}

    applyTo(game: Game): void {
        game.story(this.storyIndex)!.censor(game.player(this.playerId)!, this.wordIndices);
    }
}
export class StoryCensorRepaired implements GameModification { 
    constructor(public playerId: string, public storyIndex: number, public replacements: string[]) {}

    applyTo(game: Game): void {
        game.story(this.storyIndex)!.repairCensorship(game.player(this.playerId)!, this.replacements)
    }
}
export class StoryContinued implements GameModification { 
    constructor(public playerId: string, public storyIndex: number, public content: string) {} 

    applyTo(game: Game): void {
        game.story(this.storyIndex)!.continue(game.player(this.playerId)!, this.content)
    }
}

export function canGameByStarted(numberOfPlayers: number, started: boolean): boolean {
    return !started && numberOfPlayers >= 4;
}

interface PlayerInGame {
    game: Game;
    assignment(): Assignment;
    /**
     * Starts a story for the given player within the game.  If another player
     * receives a new assignment as a result of this, their new {@link PlayerAssignment} 
     * will be returned.
     *  
     * @param playerId 
     * @param content 
     */
    startStory(content: string): PlayerAssignment | null;
}

interface Story {
    game: Game; 

    censor(player: PlayerInGame, wordIndices: number[]): PlayerAssignment | null;
    repairCensorship(player: PlayerInGame, replacements: string[]): PlayerAssignment | null;
    continue(player: PlayerInGame, content: string): PlayerAssignment | null;
}

interface PlayerAssignment {
    playerId: string;
    assignment: Assignment;
}

class GameImpl implements Game {

    private modifications = new Array<GameModification>();
    private playerIds = new Array<string>();
    private started = false;
    private assignments = new Map<string, Assignment[]>();
    private stories = new Array<StoryImpl>();

    constructor(
        public id: string,
        public numberOfStoryEntries: number = 6,
    ) {
    }

    copyFrom(otherGame: GameImpl) {
        this.modifications = Array.from(otherGame.modifications);
        this.numberOfStoryEntries = otherGame.numberOfStoryEntries;
        this.playerIds = [...otherGame.playerIds];
        this.started = otherGame.started;
        this.assignments = new Map();
        for (const playerId of otherGame.assignments.keys()) {
            this.assignments.set(playerId, Array.from(otherGame.assignments.get(playerId)!))
        }
        this.stories = otherGame.stories.map(story => story._copy(this));
    }

    get numberOfPlayers() {
        return this.playerIds.length;
    }

    get hasStarted() { return this.started }

    get hasEnded() { 
        return this.started && this.stories.length === this.playerIds.length && this.stories.every(story => story.isFinished); 
    }

    hasPlayer(playerId: string): boolean {
        return this.playerIds.includes(playerId)
    }

    addPlayer(playerId: string): PlayerInGame {
        this.modifications.push(new PlayerAdded(playerId))
        this.playerIds.push(playerId);
        return new PlayerInGameImpl(this, playerId);
    }

    player(playerId: string): PlayerInGame | null {
        if (! this.hasPlayer(playerId)) return null;

        return new PlayerInGameImpl(this, playerId);
    }

    _playerAssignment(playerId: string): Assignment {
        if (! this.hasStarted) {
            return assign.awaitingGameStart();
        }
        if (this.hasEnded) {
            return assign.readingStories(this.readingStories());
        }
        return this.assignments.get(playerId)!.at(0) ?? assign.nothing();
    }

    playerAssignments(): [playerId: string, assignment: Assignment | null][] {
        if (this.hasEnded) {
            const readingStoriesAssignment = assign.readingStories(this.readingStories());
            return Array.from(this.playerIds, (playerId) => {
                return [playerId, readingStoriesAssignment]
            });
        }
        return Array.from(this.playerIds, (playerId) => [playerId, this.assignments.get(playerId)?.at(0) ?? assign.nothing()])
    }

    private readingStories() {
        return this.stories.map(story => {
            return story.entries.map(entry => {
                const wordRanges = getValidWordRanges(entry.repairedContent!);
                return {
                    content: entry.repairedContent!,
                    censors: entry.redaction!.wordIndices.map(index => wordRanges[index]),
                    players: [...entry.contributors],
                }
            })
        })
    }
    
    start(): boolean {
        if (!canGameByStarted(this.playerIds.length, this.started)) return false;
        this.modifications.push(new GameStarted())
        this.started = true;
        this.playerIds.forEach(playerId => this.assignments.set(playerId, [assign.startingStory()]))
        return true;
    }   

    private getNextPlayerId(playerId: string): string {
        const nextPlayerIndex = this.playerIds.indexOf(playerId) + 1;
        return this.playerIds[nextPlayerIndex === this.playerIds.length ? 0 : nextPlayerIndex];
    }

    private getCurrentAssignmentOrThrow(playerId: string): Assignment {
        const assignment = this._playerAssignment(playerId);
        if (assignment === undefined) {
            throw new Error('Illegal State: Player has no assignment within the game')
        }
        return assignment;
    }

    _startStory(playerId: string, content: string): PlayerAssignment | null {
        const assignment = this._playerAssignment(playerId);
        const nextAssignmentInStory = assignment.accept(onlyDefinedAssignments({
            startingStory: () => {
                const storyIndex = this.stories.length;
                this.stories.push(new StoryImpl(this, storyIndex, [{ initialContent: content, contributors: [playerId] }]));
                this.modifications.push(new StoryStarted(playerId, content))
                return assign.redactingStory(content, storyIndex)
            },
        }))

        return this.updatePlayerAssignmentInStory(playerId, nextAssignmentInStory);
    }

    story(index: number): Story | null {
        const story = this.stories.at(index);
        if (story == null) return null;
        return story;
    }

    private addAssignment(playerId: string, assignment: Assignment) {
        this.assignments.get(playerId)?.push(assignment)
    }

    private updatePlayerAssignmentInStory(playerId: string, assignment: Assignment) {
        this.assignments.get(playerId)!.shift();
            
        const nextPlayerId = this.getNextPlayerId(playerId);
        this.addAssignment(nextPlayerId, assignment);
        if (this._playerAssignment(nextPlayerId) === assignment) {
            return {
                playerId: nextPlayerId,
                assignment: assignment
            }
        }
        return null;
    }

    _censorStory(playerId: string, storyIndex: number, wordIndices: number[]): PlayerAssignment | null {
        const assignment = this.getCurrentAssignmentOrThrow(playerId);

        const nextAssignmentInStory = assignment.accept(definedAssignmentsOrThrow({
            redactingStory: (content, assignedStoryIndex) => {
                if (storyIndex !== assignedStoryIndex) {
                    throw new Error('Illegal State: Incorrect story index.')
                }
                const wordRanges = getValidWordRanges(content);
                if (wordIndices.some(index => index >= wordRanges.length)) {
                    throw new Error('Illegal Argument: Word index out of bounds.'); 
                }
                let censoredContent = '';
                let lastIndex = 0;
                for (let i = 0; i < wordRanges.length; i++) {
                    const range = wordRanges[i];
                    if (wordIndices.includes(i)) {
                        censoredContent += content.slice(lastIndex, range[0]);
                        censoredContent += ' '.repeat(range[1] - range[0]);
                        lastIndex = range[1];
                    }
                }
                censoredContent += content.slice(lastIndex);

                this.stories[storyIndex].entries.at(-1)!.redaction = { type: 'censor', wordIndices }
                this.stories[storyIndex].entries.at(-1)!.contributors.push(playerId)

                return assign.repairingCensoredStory(
                    censoredContent, storyIndex, wordIndices.map(index => wordRanges[index])
                );
            },
        }))

        this.modifications.push(new StoryCensored(playerId, storyIndex, wordIndices))

        return this.updatePlayerAssignmentInStory(playerId, nextAssignmentInStory)
    }

    _repairCensoredStory(playerId: string, storyIndex: number, replacements: string[]): PlayerAssignment | null {
        const assignment = this.getCurrentAssignmentOrThrow(playerId);
        
        const nextAssignmentInStory = assignment.accept(definedAssignmentsOrThrow({
            repairingCensoredStory: (content, assignedStoryIndex, censoredRanges) => {
                if (assignedStoryIndex !== storyIndex) {
                    throw new Error(`${playerId} is not assigned to repair story ${storyIndex}.`)
                }
                if (replacements.length !== censoredRanges.length) {
                    throw new Error('Number of replacements does not match number of censored ranges.');
                }
                let repairedContent = '';
                let lastIndex = 0;
                for (let index = 0; index < censoredRanges.length; index++) {
                    const range = censoredRanges[index];
                    repairedContent += content.slice(lastIndex, range[0]);
                    repairedContent += replacements[index]
                    lastIndex = range[1]
                }
                repairedContent += content.slice(lastIndex)

                const story = this.stories[storyIndex];
                story._repairCensorship(repairedContent, playerId);

                let nextAssignment = assign.continuingStory(repairedContent, storyIndex);
                if (story.isFinished) {
                    if (this.hasEnded) {
                        return assign.readingStories(this.readingStories())
                    }
                    nextAssignment = assign.nothing();
                }

                return nextAssignment;          
            },
        }))

        this.modifications.push(new StoryCensorRepaired(playerId, storyIndex, replacements))
        
        return this.updatePlayerAssignmentInStory(playerId, nextAssignmentInStory)
    }

    _continueStory(playerId: string, storyIndex: number, content: string): PlayerAssignment | null {
        const assignment = this.getCurrentAssignmentOrThrow(playerId);
        
        const nextAssignmentInStory = assignment.accept(definedAssignmentsOrThrow({
            continuingStory: (_, assignedStoryIndex) => {
                if (assignedStoryIndex !== storyIndex) {
                    throw new Error(`${playerId} is not assigned to continue story ${storyIndex}`);
                }

                const story = this.stories[storyIndex];
                story.entries.push({
                    initialContent: content,
                    contributors: [playerId],
                })
                
                return assign.redactingStory(content, storyIndex);
            },
        }))

        this.modifications.push(new StoryContinued(playerId, storyIndex, content))

        return this.updatePlayerAssignmentInStory(playerId, nextAssignmentInStory)
    }

    history(): [GameCreated, ...GameModification[]] {
        const created = new GameCreated(this.id, this.numberOfStoryEntries)
        return [created, ...this.modifications];
    }

}

class PlayerInGameImpl implements PlayerInGame {
    constructor(
        public game: GameImpl,
        public playerId: string,
    ) {}
        
    assignment(): Assignment {
        return this.game._playerAssignment(this.playerId);
    }
        
    startStory(content: string): PlayerAssignment | null {
        return this.game._startStory(this.playerId, content);
    }

}

class StoryImpl implements Story {
    constructor(
        public game: GameImpl,
        public index: number,
        public entries: StoryEntry[],
    ) {}

    get isFinished(): boolean {
        return this.entries.length === this.game.numberOfStoryEntries && this.entries.every(entry => entry.repairedContent !== undefined);
    }

    censor(player: PlayerInGame, wordIndices: number[]): PlayerAssignment | null {
        if (! (player instanceof PlayerInGameImpl)) {
            throw new Error('Unexpected type of player')
        }
        if (this.game !== player.game) {
            // return null;
        }
        
        return this.game._censorStory(player.playerId, this.index, wordIndices);
    }

    repairCensorship(player: PlayerInGame, replacements: string[]): PlayerAssignment | null {
        if (! (player instanceof PlayerInGameImpl)) {
            throw new Error('Unexpected type of player')
        }
        // if (player.game !== this.game) return null;

        return this.game._repairCensoredStory(player.playerId, this.index, replacements);
    }

    continue(player: PlayerInGame, content: string): PlayerAssignment | null {
        if (! (player instanceof PlayerInGameImpl)) {
            throw new Error('Unexpected type of player')
        }
        return this.game._continueStory(player.playerId, this.index, content);
    }

    _repairCensorship(content: string, playerId: string) {
        const entry = this.entries[this.entries.length - 1]
        entry.repairedContent = content
        entry.contributors.push(playerId)
    }

    _copy(differentGame: GameImpl): StoryImpl {
        return new StoryImpl(
            differentGame,
            this.index,
            this.entries.map(entry => {
                return {
                    ...entry,
                    redaction: entry.redaction == null ? undefined : { ...entry.redaction },
                    contributors: Array.from(entry.contributors)
                }
            }),
        )
    }

}

type StoryEntry = {
    initialContent: string,
    redaction?: { type: 'censor', wordIndices: number[] },
    repairedContent?: string,
    contributors: string[],
}

export const createGame = (id: string, numberOfStoryEntries?: number): Game => new GameImpl(id, numberOfStoryEntries);
export const copyGame = (game: Game): Game => {
    const copy = new GameImpl(game.id);
    if (game instanceof GameImpl) {
        copy.copyFrom(game);
    }
    return copy;
}
export const replayGame = (mods: [GameCreated, ...GameModification[]]): Game => {
    const created = mods[0]
    const game = new GameImpl(created.gameId, created.entriesPerStory);
    for (const mod of mods.slice(1) as GameModification[]) {
        mod.applyTo(game);
    }
    return game;
}