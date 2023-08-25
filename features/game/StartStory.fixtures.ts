import type { Page } from '@playwright/test'

export const start_a_story = async (page: Page, content: string) => {
    await page.getByRole('textbox').type('My initial story content');
    const ssePromise = page.waitForResponse('/api/v1/game/**');
    await page.getByRole('button', { name: 'Start Story' }).click();
    await ssePromise;
}

export const another_player_starts_a_story = async (page: Page, player: string, content: string) => {
    const url = page.url();
    const gameId = url.substring(url.lastIndexOf('/')+1)
    const urlObj = new URL(url)

    const origin = `${urlObj.protocol}//${urlObj.host}`
    const gameApi = `${origin}/api/v1/game/${gameId}`

    await fetch(gameApi + '/story', { method: 'POST', headers: { cookie: player, origin }, body: content })
}