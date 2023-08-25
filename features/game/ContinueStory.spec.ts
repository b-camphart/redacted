import { test, expect, Page } from "@playwright/test";
import { create_a_game } from "../CreateGame.fixtures";
import { another_player_joins_the_game } from "../JoinGame.fixtures";
import { another_player_starts_a_story, start_a_story } from "./StartStory.fixtures";
import { another_player_censors_a_story, another_player_repairs_a_story, censor_the_story, repair_the_story } from "./CensorStory.fixtures";
import { start_the_game } from "../StartGame.fixtures";


test.describe('Continuing a Story', () => {

    test.describe('Rule: A story can only be continued if there are more entries to be added', () => {

        test('Case: The game only requires one entry per story', async ({ page }) => {
            await create_a_game(page, 1);
            const player2 = await another_player_joins_the_game(page);
            const player3 = await another_player_joins_the_game(page);
            const player4 = await another_player_joins_the_game(page);
            
            await start_the_game(page);

            await start_a_story(page, 'My initial story content - story 0')
            await another_player_starts_a_story(page, player2, 'Player two initial story content - story 1')
            await another_player_starts_a_story(page, player3, 'Player three initial story content - story 2')
            await another_player_starts_a_story(page, player4, 'Player four initial story content - story 3')

            await another_player_censors_a_story(page, 0, player2, [1])
            await another_player_censors_a_story(page, 1, player3, [2])
            await another_player_censors_a_story(page, 2, player4, [2])
            await censor_the_story(page, [2])

            await another_player_repairs_a_story(page, 0, player3, ['repaired'])
            await another_player_repairs_a_story(page, 1, player4, ['repaired'])
            await repair_the_story(page, ['repaired'])
            await another_player_repairs_a_story(page, 3, player2, ['repaired'])

            await expect(page.locator('h2')).toHaveText('Finished Stories');

        })

        test('Case: the game requires more than one entry per story', async ({page}) => {
            await create_a_game(page, 2);
            const player2 = await another_player_joins_the_game(page);
            const player3 = await another_player_joins_the_game(page);
            const player4 = await another_player_joins_the_game(page);

            await start_the_game(page);

            await start_a_story(page, 'My initial story content - story 0')
            await another_player_starts_a_story(page, player2, 'Player two initial story content - story 1')
            await another_player_starts_a_story(page, player3, 'Player three initial story content - story 2')
            await another_player_starts_a_story(page, player4, 'Player four initial story content - story 3')

            await another_player_censors_a_story(page, 0, player2, [1])
            await another_player_censors_a_story(page, 1, player3, [2])
            await another_player_censors_a_story(page, 2, player4, [2])
            await censor_the_story(page, [2])

            await another_player_repairs_a_story(page, 0, player3, ['repaired'])
            await another_player_repairs_a_story(page, 1, player4, ['repaired'])
            await repair_the_story(page, ['repaired'])
            await another_player_repairs_a_story(page, 3, player2, ['repaired'])

            await expect(page.locator('h2')).toHaveText('Continue Story');
            await expect(page.getByText('Player two repaired story content - story 1')).toBeVisible();
        })

    })

    test.describe('when a story is continued', () => {

        let player2: string;
        let player4: string;

        test.beforeEach(async ({page}) => {
            await create_a_game(page, 2)
            player2 = await another_player_joins_the_game(page);
            const player3 = await another_player_joins_the_game(page);
            player4 = await another_player_joins_the_game(page);

            await start_the_game(page);

            await start_a_story(page, 'My initial story content - story 0')
            await another_player_starts_a_story(page, player2, 'Player two initial story content - story 1')
            await another_player_starts_a_story(page, player3, 'Player three initial story content - story 2')
            await another_player_starts_a_story(page, player4, 'Player four initial story content - story 3')

            await another_player_censors_a_story(page, 0, player2, [1])
            await another_player_censors_a_story(page, 1, player3, [2])
            await another_player_censors_a_story(page, 2, player4, [2])
            await censor_the_story(page, [2])

            await another_player_repairs_a_story(page, 0, player3, ['repaired'])
            await another_player_repairs_a_story(page, 1, player4, ['repaired'])
            await repair_the_story(page, ['repaired'])
            await another_player_repairs_a_story(page, 3, player2, ['repaired'])

        })

        test('the story goes to the next player', async ({page}) => {
            await another_player_continues_a_story(page, player2, 2, 'Player two continuation of story 2');

            await continue_the_story(page, 'Player one continuation of story 1')

            const player2Response = await fetch(page.url(), { headers: { cookie: player2 } });

            await expect(player2Response.text()).resolves.toContain('Player one continuation of story 1');
        })

        test.describe('given I have been waiting for a new assignment', () => {

            test.beforeEach(async ({page}) => {
                await continue_the_story(page, 'Player one continuation of story 1')

                await expect(page.locator('h2')).toHaveText('Waiting for New Story...')
            })

            test('I receive the continued story from the previous player', async ({page}) => {
                await another_player_continues_a_story(page, player4, 0, 'Player two continuation of story 2');

                await expect(page.locator('h2')).toHaveText('Redact this Story')
                await expect(page.getByText('Player two continuation of story 2')).toBeVisible();
            })

        })

    })

})

async function continue_the_story(page: Page, content: string) {
    await page.getByRole('textbox').type(content)

    const continueRequest = page.waitForRequest('/api/v1/game/**/story/**/entry')
    await page.getByRole('button').click();
    await continueRequest;

}

async function another_player_continues_a_story(page: Page, player: string, storyIndex: number, content: string) {
    const url = page.url();
    const gameId = url.substring(url.lastIndexOf('/') + 1);
    const urlObj = new URL(url);

    const origin = `${urlObj.protocol}//${urlObj.host}`;
    const gameApi = `${origin}/api/v1/game/${gameId}`;

    await fetch(gameApi + '/story/' + storyIndex + '/entry', { method: 'POST', headers: { cookie: player, origin }, body: JSON.stringify({ content }) });

}