<script>
    import { onMount } from 'svelte';
	import { deserialize } from './assignments/serializer';
    import { getAssignmentCompoment } from './assignments/assignmentView';

    /** @type {import('./$types').PageData}*/
    export let data;

    const gameId = data.gameId
    let numberOfPlayers = data.numberOfPlayers

    /** @type {import('$lib/assignments').Assignment} */
    let assignment = deserialize(data.assignment);

    onMount(() => {

        const events = new EventSource(location.protocol + `/api/v1/game/${gameId}`);

        events.addEventListener('PlayerJoinedGame', (event) => {
            /** @type {import('../../../usecases/joinGame').PlayerJoinedGame}*/
            const update = JSON.parse(event.data);
            numberOfPlayers = update.numberOfPlayers;
        })

        events.addEventListener('NewAssignment', (event) => {
            const update = deserialize(JSON.parse(event.data));
            assignment = update;
        })

        return () => events.close();
    })

    $: dynamicComponent = getAssignmentCompoment(assignment);
</script>


<svelte:head>
    <title>Redacted - Game {gameId}</title>
</svelte:head>

<h1>Redacted</h1>
<h6>{gameId}</h6>

<svelte:component this={dynamicComponent.component} {...dynamicComponent.componentParams} {gameId} {numberOfPlayers} />