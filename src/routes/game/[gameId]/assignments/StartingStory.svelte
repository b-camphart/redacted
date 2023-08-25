<script>
	import { getValidWordRanges } from "../../../../usecases/story/wordRanges";

    /** @type {string} */
    export let gameId = '';

    let storyContent = '';
    $: cannotStartStory = getValidWordRanges(storyContent).length < 2;
       
    async function onStartStory() {
        if (cannotStartStory) return
        await fetch(location.protocol + `/api/v1/game/${gameId}/story`, { method: 'POST', body: storyContent });
    }
</script>

<main>
    <h2>Start a Story</h2>
    <textarea bind:value={storyContent}></textarea>
    <button disabled={cannotStartStory} aria-disabled={cannotStartStory} on:click={onStartStory} id="startStory">Start Story</button>
</main>