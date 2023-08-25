import type { Page } from '@playwright/test'

export const join_the_game = async (page: Page, gameUrl: string) => {
    await page.goto(gameUrl)
}

export const another_player_joins_the_game = async (page: Page) => {
    const response = await fetch(page.url(), { credentials: 'omit' });
    const otherPlayerCookies = response.headers.get('set-cookie');
    if (otherPlayerCookies == null) throw new Error('No cookies received!');
    return otherPlayerCookies;
}