<script lang='ts'>
	import { replacementsAreValid } from "../../../../usecases/story/repair/censored";
	import type { NumberRange } from "../../../../usecases/story/wordRanges";

    export let gameId: string;
    export let storyIndex: number;
    export let content: string;
    export let censoredRanges: NumberRange[];

    const textRanges: { content: string, censored: boolean }[] = [];
    for (let i = 0; i < censoredRanges.length; i++) {
        const range = censoredRanges[i];
        const start = range[0];
        const end = range[1];
        if (i === 0 && start > 0) {
            textRanges.push({ content: content.substring(0, start), censored: false });
        }
        textRanges.push({ content: content.substring(start, end), censored: true });
        if (end < content.length) {
            const nextStart = censoredRanges.at(i + 1)?.[0] ?? content.length;
            textRanges.push({ content: content.substring(end, nextStart), censored: false });
        }
    }

    let replacements = censoredRanges.map(() => '');
    let cannotRepair = true;

    function updateValue(index: number) {
        return function (event: Event & { currentTarget: EventTarget & HTMLInputElement; }) {
            replacements[index] = event.currentTarget.value;
            cannotRepair = !replacementsAreValid(censoredRanges.length, replacements);
        }
    }

    async function repairStory() {
        if (cannotRepair) return;
        await fetch(location.protocol + `/api/v1/game/${gameId}/story/${storyIndex}/entry`, { method: 'PATCH', body: JSON.stringify({ replacements }) })
    }

</script>

<main>
    <h2>Repair this Story</h2>
    <blockquote>
        {#each textRanges as { content: rangeContent, censored }}
            {#if censored}
                <span role='deletion'>{rangeContent}</span>
            {:else}
                <span>{rangeContent}</span>
            {/if}
        {/each}
    </blockquote>
    {#each replacements as replacement, index}
        <input type="text" value={replacement} on:input={updateValue(index)}/>
    {/each}
    <button disabled={cannotRepair} aria-disabled={cannotRepair} on:click={repairStory}>Repair</button>
</main>

<style>
    span {
        font-family: monospace;
        white-space: pre;
    }
    span[role="deletion"] {
        background-color: black;
    }
</style>