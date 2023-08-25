<script></script>

<svelte:head>
    <title>Redacted</title>
</svelte:head>

<h1>Welcome to Redacted</h1>
<form method="POST">
    <label for="numberOfStoryEntries">Number of Story Entries</label>
    <input role="textbox" type="number" name="numberOfStoryEntries" value="1" />
    <button type="submit" formaction="/game">Create Game</button>
</form>