import { test, expect } from '@playwright/test';
import { create_a_game } from './CreateGame.fixtures';
import { another_player_joins_the_game } from './JoinGame.fixtures';
import { start_the_game } from './StartGame.fixtures';
import { another_player_starts_a_story, start_a_story } from './game/StartStory.fixtures';
import { another_player_censors_a_story, another_player_repairs_a_story, censor_the_story, repair_the_story } from './game/CensorStory.fixtures';

test.describe('Reading all the Stories', () => {

    let player2: string;
    let player3: string;
    let player4: string;

    test.beforeEach(async ({ page }) => {
        await create_a_game(page, 1);

        player2 = await another_player_joins_the_game(page);
        player3 = await another_player_joins_the_game(page);
        player4 = await another_player_joins_the_game(page);

        await start_the_game(page);
    });

    test('Waiting for End of Game', async ({ page }) => {
        await start_a_story(page, 'Initial story content');
        
        await expect(page.locator('h2')).toHaveText('Waiting for New Story...');

    });

    test('End of the Game', async ({ page }) => {
        await start_a_story(page, 'My initial story content');

        await another_player_starts_a_story(page, player2, 'Player two story content');
        await another_player_starts_a_story(page, player3, 'Player three story content');
        await another_player_starts_a_story(page, player4, 'Player four story content');

        await censor_the_story(page, [2]);
        await another_player_censors_a_story(page, 0, player2, [1]);
        await another_player_censors_a_story(page, 1, player3, [2]);
        await another_player_censors_a_story(page, 2, player4, [2]);

        await repair_the_story(page, ["replacement"])
        await another_player_repairs_a_story(page, 3, player2, ["replacement"])
        await another_player_repairs_a_story(page, 0, player3, ["replacement"])
        await another_player_repairs_a_story(page, 1, player4, ["replacement"])

        await expect(page.locator('h2')).toHaveText('Finished Stories');
    
        await expect(page.getByText('My replacement story content')).toBeVisible();
        await expect(page.getByText('Player two replacement content')).toBeVisible();
        await expect(page.getByText('Player three replacement content')).toBeVisible();
        await expect(page.getByText('Player four replacement content')).toBeVisible();
    });

})