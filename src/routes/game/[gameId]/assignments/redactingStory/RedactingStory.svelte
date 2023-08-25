<script lang='ts'>
	import CensorOption from "./CensorOption.svelte";

    export let gameId: string;
    export let storyIndex: number;
    export let content: string;
    let selectedOptions: number[] = [];

    function select(event: { detail: { index: number } }) {
        selectedOptions = selectedOptions.concat(event.detail.index);
    }

    const optionRanges = content.split(' ');
    $: canCensorStory = selectedOptions.length > 0;
    
    async function censor() {
        if (!canCensorStory) return;
        await fetch(location.protocol + `/api/v1/game/${gameId}/story/${storyIndex}/entry`, { method: 'PATCH', body: JSON.stringify({ wordIndices: selectedOptions }) });
    }
</script>

<svelte:head>
    <meta name="storyIndex" content={storyIndex?.toString()} />
</svelte:head>
<main>
    <h2>Redact this Story</h2>
    <blockquote>
        {#each optionRanges as optionRange, index}
            <CensorOption word={optionRange} {index} selected={selectedOptions.includes(index)} on:select={select} />
            {#if index !== optionRanges.length}
                <span> </span>
            {/if}
        {/each}
    </blockquote>
    <button disabled={!canCensorStory} aria-disabled={!canCensorStory} on:click={censor}>Censor</button>
</main>