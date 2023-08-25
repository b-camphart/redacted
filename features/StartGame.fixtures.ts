import type { Page } from '@playwright/test'

export const start_the_game = async (page: Page) => {
    await page.getByRole('button', { name: 'Start Game' }).click();
}

export const another_player_starts_the_game = async (page: Page, player: string) => {
    const url = page.url();
    const gameId = url.substring(url.lastIndexOf('/')+1)
    const urlObj = new URL(url)

    const fetchLocation = `${urlObj.protocol}${urlObj.host}/api/v1/game/${gameId}`

    await fetch(fetchLocation, { method: 'PATCH', headers: { cookie: player } });
}