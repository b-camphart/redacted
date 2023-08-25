<script lang="ts">
    export const gameId: string = '';
    export let stories: { content: string, censors: [number, number][], players: string[] }[][];
</script>

<h2>Finished Stories</h2>
{#each stories as story}
    <article>
        {#each story as entry}
            <p>{entry.content}</p>
            <address>
                {#each entry.players as player, playerIndex}
                    <span>{player}</span>
                    {#if playerIndex < entry.players.length - 1}
                        <span>, </span>
                    {/if}
                {/each}
            </address>
        {/each}
    </article>
{/each}

<style>
    article {
        padding: 8px;
        border: 1px solid 0x00000088;
        border-radius: 4px;
    }
</style>