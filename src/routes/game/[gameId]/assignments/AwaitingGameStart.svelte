<script lang="ts">
	import { canGameByStarted } from "../../../../games/Game";

    export let gameId: string;
    export let numberOfPlayers: number;

    $: canStartGame = canGameByStarted(numberOfPlayers, false);
    
    function onStartGame() {
        if (! canStartGame) return;
        fetch(location.protocol + `/api/v1/game/${gameId}`, { method: 'PATCH' })
    }
</script>

<main>
    <h2>Waiting for Game to Start</h2>
    <button disabled={!canStartGame} on:click={onStartGame} id="start">Start Game</button>
</main>
<aside>
    <h4>Number of Players</h4>
    <strong id="numberOfPlayers">{numberOfPlayers}</strong>
</aside>