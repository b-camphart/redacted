import { test, expect } from '@playwright/test'
import { another_player_creates_a_game } from './CreateGame.fixtures'
import { join_the_game } from './JoinGame.fixtures';

test.describe('Joining a Game', () => {

    test('join a game', async ({ page }) => {
        const gameUrl = await another_player_creates_a_game(page);

        await join_the_game(page, gameUrl);

        await expect(page.locator('h2')).toHaveText('Waiting for Game to Start');
        await expect(page.locator('#numberOfPlayers')).toHaveText('2')
    })

})