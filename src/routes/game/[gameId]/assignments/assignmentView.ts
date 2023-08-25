import type { Assignment, AssignmentVisitor } from "../../../../games/assignments";
import type { ComponentProps, ComponentType, SvelteComponent } from "svelte";
import AwaitingGameStart from './AwaitingGameStart.svelte';
import AwaitingAssignment from './AwaitingAssignment.svelte';
import ReadingStories from './ReadingStories.svelte';
import StartingStory from './StartingStory.svelte';
import ContinuingStory from "./ContinuingStory.svelte";
import RedactingStory from "./redactingStory/RedactingStory.svelte";
import RepairingCensoredStory from "./RepairingCensoredStory.svelte";
import type { NumberRange } from "../../../../usecases/story/wordRanges";

type AssignmentComponentPrep<T extends SvelteComponent> = {
    component: ComponentType<T>,
    componentParams: Omit<ComponentProps<T>, 'gameId' | 'numberOfPlayers'>,
}

class AssignmentView implements AssignmentVisitor<AssignmentComponentPrep<SvelteComponent>> {

    awaitingGameStart() : AssignmentComponentPrep<AwaitingGameStart> {
        return { 
            component: AwaitingGameStart, 
            componentParams: {}
        };   
    }

    awaitingAssignment(): AssignmentComponentPrep<AwaitingAssignment> {
        return {
            component: AwaitingAssignment,
            componentParams: {}
        };
    }

    redactingStory(content: string, storyIndex: number): AssignmentComponentPrep<RedactingStory> {
        return {
            component: RedactingStory,
            componentParams: {
                content,
                storyIndex
            },
        }
    }
    
    repairingCensoredStory(content: string, storyIndex: number, censoredRanges: NumberRange[]): AssignmentComponentPrep<RepairingCensoredStory> {
        return {
            component: RepairingCensoredStory,
            componentParams: {
                content,
                storyIndex,
                censoredRanges,
            },
        }
    }
    
    continuingStory(content: string, storyIndex: number): AssignmentComponentPrep<ContinuingStory> {
        return {
            component: ContinuingStory,
            componentParams: {
                content,
                storyIndex,
            },
        }
    }

    readingStories(stories: { content: string, censors: NumberRange[], players: string[] }[][]): AssignmentComponentPrep<ReadingStories> {
        return {
            component: ReadingStories,
            componentParams: {
                stories
            }
        };
    }

    startingStory(): AssignmentComponentPrep<StartingStory> {
        return {
            component: StartingStory,
            componentParams: {

            }
        }
    }
}

let assignmentView: AssignmentView | null = null;

export const getAssignmentCompoment = (assignment: Assignment): AssignmentComponentPrep<SvelteComponent> => {
    if (assignmentView === null) {
        assignmentView = new AssignmentView();
    }
    return assignment.accept(assignmentView);
}