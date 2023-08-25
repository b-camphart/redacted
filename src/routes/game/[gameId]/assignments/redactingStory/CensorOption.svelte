<script lang='ts'>
    import { createEventDispatcher } from "svelte";

    export let word: string;
    export let index: number;
    export let selected: boolean;

    const dispatch = createEventDispatcher<{ select: { index: number } }>();

    function select() {
        dispatch('select', { index });
    }

    function keydown(event: KeyboardEvent) {
        if (event.key === 'Enter') {
            select()
        }
    }

</script>


<span 
    role="option"
    aria-selected={selected} 
    on:click={select} 
    tabindex={index}
    on:keydown={keydown}
>
    {word}
</span>

<style>
    span {
        text-decoration: underline;
        cursor: pointer;
    }
    span[aria-selected='true'] {
        text-decoration: none;
        color: white;
        background-color: black;
    }
</style>