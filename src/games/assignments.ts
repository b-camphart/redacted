import type { NumberRange } from "../usecases/story/wordRanges";

export interface Assignment {
    accept<T>(visitor: AssignmentVisitor<T>): T;
}

export interface AssignmentVisitor<T> {
    awaitingGameStart(): T;
    startingStory(): T;
    readingStories(stories: StoryEntry[][]): T
    redactingStory(content: string, storyIndex: number): T
    repairingCensoredStory(content: string, storyIndex: number, censoredRanges: [number, number][]): T
    continuingStory(content: string, storyIndex: number): T
    awaitingAssignment(): T;
}

export const onlyDefinedAssignments = <T>(definedAssignments: Partial<AssignmentVisitor<T>>): AssignmentVisitor<T> => {
    return {
        awaitingGameStart() {
            throw new Error('Illegal State: AwaitingGameStart');
        },
        startingStory() {
            throw new Error('Illegal State: StartingStory');
        },
        readingStories() {
            throw new Error('Illegal State: ReadingStories');
        },
        redactingStory() {
            throw new Error('Illegal State: RedactingStory');
        },
        repairingCensoredStory() {
            throw new Error('Illegal State: RepairingCensoredStory');
        },
        continuingStory(content, storyIndex) {
            throw new Error(`Illegal State: ContinuingStory { storyIndex: ${storyIndex}, content: ${content} }`);
        },
        awaitingAssignment() {
            throw new Error('Illegal State: AwaitingAssignment');
        },
        ...definedAssignments,
    }
}

class AwaitingGameStart implements Assignment {
    accept<T>(visitor: AssignmentVisitor<T>): T {
        return visitor.awaitingGameStart();
    }
}
const AwaitingGameStartInstance = new AwaitingGameStart();


class StartingStory implements Assignment {
    accept<T>(visitor: AssignmentVisitor<T>): T {
        return visitor.startingStory();
    }
}
const StartingStoryInstance = new StartingStory();

class RedactingStory implements Assignment {
    constructor(
        private readonly content: string,
        private readonly storyIndex: number,
    ) {}
    accept<T>(visitor: AssignmentVisitor<T>): T {
        return visitor.redactingStory(this.content, this.storyIndex);
    }
}

class RepairingCensoredStory implements Assignment {
    constructor(
        private readonly content: string,
        private readonly storyIndex: number,
        private readonly censoredRanges: [number, number][]
    ) {}
    accept<T>(visitor: AssignmentVisitor<T>): T {
        return visitor.repairingCensoredStory(this.content, this.storyIndex, this.censoredRanges);
    }
}

class ContinuingStory implements Assignment {
    constructor(
        private readonly content: string,
        private readonly storyIndex: number,
    ) {}

    accept<T>(visitor: AssignmentVisitor<T>): T {
        return visitor.continuingStory(this.content, this.storyIndex);
    }
}

class ReadingStories implements Assignment {
    constructor(private readonly stories: StoryEntry[][]) {}

    accept<T>(visitor: AssignmentVisitor<T>): T {
        return visitor.readingStories(this.stories.map(story => [...story]));
    }
}

export type StoryEntry = {
    readonly content: string,
    readonly censors: NumberRange[],
    readonly players: string[]
}

class AwaitingAssignment implements Assignment {
    accept<T>(visitor: AssignmentVisitor<T>): T {
        return visitor.awaitingAssignment();
    }
}
const AwaitingAssignmentInstance = new AwaitingAssignment();

export const assign = {
    awaitingGameStart: (): Assignment => AwaitingGameStartInstance,
    startingStory: (): Assignment => StartingStoryInstance,
    readingStories: (stories: StoryEntry[][]): Assignment => new ReadingStories(stories),
    redactingStory: (content: string, storyIndex: number): Assignment => new RedactingStory(content, storyIndex),
    repairingCensoredStory: (content: string, storyIndex: number, censoredRanges: [number, number][]): Assignment => new RepairingCensoredStory(content, storyIndex, censoredRanges),
    continuingStory: (content: string, storyIndex: number): Assignment => new ContinuingStory(content, storyIndex),
    nothing: (): Assignment => AwaitingAssignmentInstance,
}