import { assign, type Assignment, type AssignmentVisitor } from "$lib/assignments";
import type { StoryEntry } from "../../../../games/assignments";
import type { NumberRange } from "../../../../usecases/story/wordRanges";

interface AwaitingAssignment {
    readonly type: 'awaitingAssignment';
}

interface ReadingStories {
    readonly type: 'readingStories';
    readonly stories: StoryEntry[][];
}

interface StartingStory {
    readonly type: 'startingStory';
}

interface AwaitingGameStart {
    readonly type: 'awaitingGameStart';
}
interface RedactingStory {
    readonly type: 'redactingStory';
    readonly content: string;
    readonly storyIndex: number;
}
interface RepairingCensoredStory {
    readonly type: 'repairingCensoredStory';
    readonly storyIndex: number;
    readonly content: string;
    readonly censoredRanges: NumberRange[];
}
interface ContinuingStory {
    readonly type: 'continuingStory';
    readonly content: string;
    readonly storyIndex: number;
}

type SerializedAssignment = AwaitingGameStart | AwaitingAssignment | ReadingStories | StartingStory | ContinuingStory | RedactingStory | RepairingCensoredStory;

class AssignmentSerializer implements AssignmentVisitor<SerializedAssignment> {
   
    awaitingGameStart(): AwaitingGameStart {
        return {
            type: 'awaitingGameStart',
        } 
    }

    awaitingAssignment(): AwaitingAssignment {
        return {
            type: 'awaitingAssignment',
        }
    }

    readingStories(stories: StoryEntry[][]): SerializedAssignment {
        return {
            type: 'readingStories',
            stories,
        }
    }



    startingStory(): StartingStory {
        return {
            type: 'startingStory',
        }
    }

    redactingStory(content: string, storyIndex: number): RedactingStory {
        return {
            type: 'redactingStory',
            content,
            storyIndex,
        }
    }

    repairingCensoredStory(content: string, storyIndex: number, censoredRanges: NumberRange[]): RepairingCensoredStory {
        return {
            type: 'repairingCensoredStory',
            content,
            storyIndex,
            censoredRanges,
        }
    }

    continuingStory(content: string, storyIndex: number): ContinuingStory {
        return {
            type: 'continuingStory',
            content,
            storyIndex,
        }
    }
}

let assignmentSerializer: AssignmentSerializer | undefined;

export const serialize = (assignment: Assignment): SerializedAssignment => {
    assignmentSerializer = assignmentSerializer || new AssignmentSerializer();
    return assignment.accept<SerializedAssignment>(assignmentSerializer);
}

export const deserialize = (serializedAssignment: SerializedAssignment): Assignment => {
    switch (serializedAssignment.type) {
        case 'awaitingGameStart':
            return assign.awaitingGameStart();
        case 'startingStory':
            return assign.startingStory(); 
        case 'redactingStory':
            return assign.redactingStory(serializedAssignment.content, serializedAssignment.storyIndex);
        case 'repairingCensoredStory':
            return assign.repairingCensoredStory(serializedAssignment.content, serializedAssignment.storyIndex, serializedAssignment.censoredRanges)
        case 'continuingStory':
            return assign.continuingStory(serializedAssignment.content, serializedAssignment.storyIndex);
        case 'awaitingAssignment':
            return assign.nothing();
        case 'readingStories':
            return assign.readingStories(serializedAssignment.stories);
    }
}