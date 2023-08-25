import { test, expect } from '@playwright/test';
import { create_a_game } from '../CreateGame.fixtures';
import { another_player_joins_the_game } from '../JoinGame.fixtures';
import { start_the_game } from '../StartGame.fixtures';
import { another_player_starts_a_story, start_a_story } from './StartStory.fixtures';
import { another_player_censors_a_story, censor_the_story, another_player_repairs_a_story, repair_the_story } from './CensorStory.fixtures';

test.describe('Censoring a Story', () => {

    let player2: string;
    let player4: string;

    test.beforeEach(async ({ page }) => {
        await create_a_game(page);
        player2 = await another_player_joins_the_game(page);
        await another_player_joins_the_game(page);
        player4 = await another_player_joins_the_game(page);
        await start_the_game(page);
    });

    test.describe('Rule: A story must be started with at least two words', () => {

        test('Cannot start story with less than two words', async ({ page }) => {
            await expect(page.locator('h2')).toHaveText('Start a Story')
            await page.getByRole('textbox').type('One')

            await expect(page.getByRole('button')).toBeDisabled();
        });

        test('Can start story with two words', async ({ page }) => {
            await page.getByRole('textbox').type('Two words')

            await expect(page.getByRole('button')).toBeEnabled();
        });

    });

    test.describe('Rule: A story must be continued with at least two words', () => {

        test.beforeEach(async ({page}) => {
            await create_a_game(page, 2)
            player2 = await another_player_joins_the_game(page);
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

        })

        test('Cannot continue a story with less than two words', async ({ page }) => {
            await page.getByRole('textbox').type('one')

            await expect(page.getByRole('button')).toBeDisabled();
        })

        test('Can continue a story with two words', async ({ page }) => {
            await page.getByRole('textbox').type('two words')

            await expect(page.getByRole('button')).toBeEnabled();
        })

    })

    test('I am prompted to censor the story from the previous player', async ({ page }) => {

        await start_a_story(page, 'My initial story content');

        await another_player_starts_a_story(page, player4, 'Player four initial story content');

        await expect(page.locator('h2')).toHaveText('Redact this Story');
        await expect(page.getByText('Player four initial story content')).toBeVisible();
        await expect(page.getByRole('option').all()).resolves.toHaveLength(5);
    });

    test.describe('Rule: At least one word must be selected to be censored', () => {

        test.beforeEach(async ({ page }) => {
            await start_a_story(page, 'My initial story content');
            await another_player_starts_a_story(page, player4, 'Player four initial story content');
        });

        test('Cannot censor without selecting at least one word', async ({ page }) => {
            await expect(page.getByRole('button')).toBeDisabled();
        });

        test('Can censor after selecting one word', async ({ page }) => {
            await page.getByRole('option').first().click();

            await expect(page.getByRole('button')).toBeEnabled();
        });
    });

    test('The next player receives the censored story to fix', async ({ page }) => {
        await start_a_story(page, 'My initial story content');
        await another_player_starts_a_story(page, player4, 'Player four initial story content');
        await another_player_starts_a_story(page, player2, 'Player four initial story content');
        await another_player_censors_a_story(page, 0, player2, [0]);
        await censor_the_story(page, [0, 2, 3]);

        const player2GameResponse = await fetch(page.url(), { credentials: 'omit', headers: { cookie: player2 } });
        const receivedHTML = await player2GameResponse.text();

        await expect(receivedHTML).not.toContain('Player four initial story content');
        await expect(receivedHTML).toContain('       four               content');
    });

});

test.describe('Repairing a Censored Story', () => {

    let player: {2: string, 3: string, 4: string};
    test.beforeEach(async ({ page }) => {
        await create_a_game(page, 2);
        player = {
            2: await another_player_joins_the_game(page),
            3: await another_player_joins_the_game(page),
            4: await another_player_joins_the_game(page),
        };
        await start_the_game(page);
        await another_player_starts_a_story(page, player[3], "Player three initial story content - story 0");
        await start_a_story(page, "My initial story content - story 1");
        await another_player_starts_a_story(page, player[4], "Player four initial story content - story 2");
        await censor_the_story(page, [0]);
    });

    test('I am prompted to replace the same number of words as were censored', async ({ page }) => {
        await another_player_censors_a_story(page, 0, player[4], [0, 2]);

        await expect(page.locator('h2')).toHaveText('Repair this Story');
        await expect(page.getByRole('blockquote')).toHaveText('       three        story content - story 0');
        await expect(page.getByRole('deletion').all()).resolves.toHaveLength(2);
        await expect(page.getByRole('textbox').all()).resolves.toHaveLength(2);
    });

    test.describe('Rule: replacements must be a single word', () => {

        test.beforeEach(async ({ page }) => {
            await another_player_censors_a_story(page, 0, player[4], [0]);   
        });

        test('cannot provide multiple words as a replacement', async ({ page }) => {
            await page.getByRole('textbox').type('Two words');

            await expect(page.getByRole('button')).toBeDisabled();
        });

        test('cannot omit the replacement', async ({ page }) => {
            await expect(page.getByRole('button')).toBeDisabled();
        });

        test('a single word is accepted', async ({ page }) => {
            await page.getByRole('textbox').type('Replacement');

            await expect(page.getByRole('button')).toBeEnabled();
        });

    });

    test.describe('Rule: must provide replacements for all censored words', () => {
        
        test.beforeEach(async ({ page }) => {
            await another_player_censors_a_story(page, 0, player[4], [0, 2, 3]);   
        });

        test('cannot provide only some replacements', async ({ page }) => {
            await page.getByRole('textbox').first().type('Replacement1');
            await (await page.getByRole('textbox').all()).at(1)!.type('Replacement2');

            await expect(page.getByRole('button')).toBeDisabled();
        });

        test('replacements for all censored words is accepted', async ({ page }) => {
            await page.getByRole('textbox').first().type('Replacement1');
            await (await page.getByRole('textbox').all()).at(1)!.type('Replacement2');
            await (await page.getByRole('textbox').all()).at(2)!.type('Replacement3');

            await expect(page.getByRole('button')).toBeEnabled();
        });

    });

    test('The next player receives the repaired story', async ({ page }) => {
        await another_player_censors_a_story(page, 0, player[4], [0, 2, 3]);   
        await another_player_starts_a_story(page, player[2], 'Player two initial story content - story 3');
        await another_player_censors_a_story(page, 1, player[2], [0]);
        await another_player_repairs_a_story(page, 2, player[2], ['Replacement'])

        await repair_the_story(page, ["Replacement1", "Replacement2", "Replacement3"]);

        const player2GameResponse = await fetch(page.url(), { credentials: 'omit', headers: { cookie: player[2] } });
        const receivedHTML = await player2GameResponse.text();

        await expect(receivedHTML).toContain('Continue Story');
        await expect(receivedHTML).not.toContain('Player three initial story content - story 0');
        await expect(receivedHTML).toContain('Replacement1 three Replacement2 Replacement3 content - story 0');
    });

})

