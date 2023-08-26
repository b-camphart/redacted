<script></script>

<svelte:head>
    <title>Redacted</title>
</svelte:head>

<h1>Welcome to Redacted</h1>
<p>Collaborate in writing, tampering, and repairing stories one line at a time.</p>
<p>Inspired from the open source project <a href="https://outofcontext.party/">out of context</a>.</p>
<details>
    <summary>More Info</summary>
    <p>
        Players contribute to a story one line at a time, and can censor what other players have written.
    </p>
</details>
<details>
    <summary>How to Play</summary>

        <ul>
            <li>Every player will be given a line in a story</li>
            <li>The next player will choose to edit the story by censoring words</li>
            <li>Another player will fill in what information was lost</li>
            <li>Players will then continue the story, one line at a time</li>
            <li>At the end, players can enjoy the crazy stories they wrote</li>
        </ul>
</details>
<form method="POST">
    <label for="numberOfStoryEntries">Number of Story Entries</label>
    <input role="textbox" type="number" name="numberOfStoryEntries" value="1" />
    <button type="submit" formaction="/game">Create Game</button>
</form>