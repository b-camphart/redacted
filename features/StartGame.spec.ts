import { test, expect } from "@playwright/test";
import { another_player_joins_the_game } from "./JoinGame.fixtures";
import { create_a_game } from "./CreateGame.fixtures";
import { another_player_starts_the_game, start_the_game } from "./StartGame.fixtures";

test.describe('Starting a Game', () => {

    test('a game cannot be started until 4 or players have joined', async ({ page }) => {
        create_a_game(page);

        await expect(page.getByRole('button')).toBeDisabled();
    })

    test.describe('monitor number of players in the game', () => {

        test('receive incremental count when new players join', async ({ page }) => {
            await create_a_game(page);
            await expect(page.locator('#numberOfPlayers')).toHaveText('1');
    
            await another_player_joins_the_game(page);
            await expect(page.locator('#numberOfPlayers')).toHaveText('2');
    
            await another_player_joins_the_game(page);
            await expect(page.locator('#numberOfPlayers')).toHaveText('3');
    
            await another_player_joins_the_game(page);
            await expect(page.locator('#numberOfPlayers')).toHaveText('4');
        })

    })

    test('can start the game once 4 players have joined', async ({ page }) => {
        await create_a_game(page);

        await another_player_joins_the_game(page);
        await another_player_joins_the_game(page);
        await another_player_joins_the_game(page);

        await expect(page.getByRole('button', { name: 'Start Game' })).toBeEnabled();
    })

    test('start the game', async ({ page }) => {
        await create_a_game(page);

        await another_player_joins_the_game(page);
        await another_player_joins_the_game(page);
        await another_player_joins_the_game(page);

        await start_the_game(page);

        await expect(page.getByRole('heading', { name: 'Start a Story' })).toBeVisible();
    })

    test('another player starts the game', async ({ page }) => {
        await create_a_game(page);

        await another_player_joins_the_game(page);
        await another_player_joins_the_game(page);
        const fourthPlayer = await another_player_joins_the_game(page);

        await another_player_starts_the_game(page, fourthPlayer);

        await expect(page.getByRole('heading', { name: 'Start a Story' })).toBeVisible();
    })

})