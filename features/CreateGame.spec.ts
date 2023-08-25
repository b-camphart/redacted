import { test, expect } from '@playwright/test'
import { create_a_game } from './CreateGame.fixtures'

test.describe('Creating a Game', () => {

    test('create a game', async ({ page }) => {
        await create_a_game(page);

        await expect(page.locator('#numberOfPlayers')).toHaveText('1');
    })

})