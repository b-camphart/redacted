<script lang="ts">
	import { getValidWordRanges } from "../../../../usecases/story/wordRanges";

    export let gameId: string;
    export let storyIndex: number;
    export let content: string;

    let continuation: string = "";

    $: cannotContinue = getValidWordRanges(continuation).length < 2

    async function continueStory() {
        if (cannotContinue) return;
        await fetch(location.protocol + `/api/v1/game/${gameId}/story/${storyIndex}/entry`, { method: 'POST', body: JSON.stringify({ content: continuation }) })
    }
</script>

<main>
    <h2>Continue Story</h2>
    <article>{content}</article>
    <textarea bind:value={continuation}></textarea>
    <button disabled={cannotContinue} aria-disabled={cannotContinue} on:click={continueStory}>Continue</button>
</main>