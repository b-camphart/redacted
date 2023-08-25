import type { Page } from "@playwright/test";

export const create_a_game = async (page: Page, numberOfStoryEntries?: number) => {
    await page.goto('/');
    if (numberOfStoryEntries !== undefined) {
        const numberInput = page.getByRole('textbox')
        await numberInput.clear()    
        await numberInput.type(numberOfStoryEntries.toString());
    }
    const ssePromise = page.waitForResponse('/api/v1/game/**')
    await page.getByRole('button').click();
    await ssePromise;
}

export const another_player_creates_a_game = async (page: Page) => {
    await page.goto('/')

    const response = await fetch(page.url() + 'game', { method: 'POST', credentials: 'omit' });
    const otherPlayerCookies = response.headers.get('set-cookie');
    if (otherPlayerCookies == null) throw new Error('No cookies received!');

    await fetch(response.url, { headers: { cookie: otherPlayerCookies } });

    return response.url;
}

