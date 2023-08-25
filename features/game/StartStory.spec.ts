import { test, expect } from '@playwright/test'
import { create_a_game } from '../CreateGame.fixtures'
import { another_player_joins_the_game } from '../JoinGame.fixtures';
import { start_the_game } from '../StartGame.fixtures';
import { another_player_starts_a_story, start_a_story } from './StartStory.fixtures';

test.describe('Starting a Story', () => {

    let player2: string;
    let player4: string;
    test.beforeEach(async ({ page }) => {
        await create_a_game(page);
        player2 = await another_player_joins_the_game(page);
        await another_player_joins_the_game(page);
        player4 = await another_player_joins_the_game(page);

        await start_the_game(page);
    });

    test('story goes to next player', async ({ page }) => {
        await start_a_story(page, 'My initial story content');

        await another_player_starts_a_story(page, player2, 'Story two initial content');

        const player2Response = await fetch(page.url(), { headers: { cookie: player2 } });

        await expect(player2Response.text()).resolves.toContain('My initial story content');
    })

    test('I wait to receive a new assignment', async ({ page }) => {
        await start_a_story(page, 'My initial story content');
        
        await expect(page.locator('h2')).toHaveText('Waiting for New Story...');
    });

    test.describe('given the previous player has started their story', () => {

        test.beforeEach(async ({ page }) => {
            await another_player_starts_a_story(page, player4, 'Player four\'s initial story content');
        });      
        
        test('I receive the previous player\'s story', async ({ page }) => {
            await start_a_story(page, 'My initial story content');

            await expect(page.getByText('Player four\'s initial story content')).toBeVisible();
        });

    });

});