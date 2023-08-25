import type { Page } from '@playwright/test';


export async function censor_the_story(page: Page, wordIndices: number[]) {
    const options = await page.getByRole('option').all();
    for (const index of wordIndices) {
        await options.at(index)!.click();
    }
    const censorRequest = page.waitForRequest(`/api/v1/game/**/story/**/entry`);
    await page.getByRole('button').click();
    await censorRequest;
}
export async function another_player_censors_a_story(page: Page, storyIndex: number, playerId: string, wordIndices: number[]) {
    const url = page.url();
    const gameId = url.substring(url.lastIndexOf('/') + 1);
    const urlObj = new URL(url);

    const origin = `${urlObj.protocol}//${urlObj.host}`;
    const gameApi = `${origin}/api/v1/game/${gameId}`;

    await fetch(gameApi + '/story/' + storyIndex + '/entry', { method: 'PATCH', headers: { cookie: playerId, origin }, body: JSON.stringify({ wordIndices }) });
}

export async function repair_the_story(page: Page, replacements: string[] = []) {
    const textBoxes = await page.getByRole('textbox').all();        
    for (let i = 0; i < textBoxes.length; i++) {
        const textBox = textBoxes[i];
        const replacement = replacements.at(i) || `Replacement${i+1}`;
        await textBox.type(replacement);
    }
    const repairRequest = page.waitForRequest(`/api/v1/game/**/story/**/entry`);
    await page.getByRole('button').click();     
    await repairRequest;
}

export async function another_player_repairs_a_story(page: Page, storyIndex: number, playerId: string, replacements: string[]) {
    const url = page.url();
    const gameId = url.substring(url.lastIndexOf('/') + 1);
    const urlObj = new URL(url);

    const origin = `${urlObj.protocol}//${urlObj.host}`;
    const gameApi = `${origin}/api/v1/game/${gameId}`;

    await fetch(gameApi + '/story/' + storyIndex + '/entry', { method: 'PATCH', headers: { cookie: playerId, origin }, body: JSON.stringify({ replacements }) });
}
