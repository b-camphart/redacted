import { redacted } from '../../../../../../../../usecases/index.js';
import type { RequestHandler } from './$types';

export const PATCH: RequestHandler = async function({ params, locals, request }) {
    const { gameId, storyIndex } = params;
    const { userId } = locals.session;
    const body = await request.json();

    if (typeof body !== 'object') throw new Error('Unexpected type of body.');

    if ('wordIndices' in body) {
        if (! Array.isArray(body.wordIndices)) throw new Error('Unexpected type of word indices');
        await redacted.censorStory(gameId, Number.parseInt(storyIndex), userId, body.wordIndices);
    } else if ('replacements' in body) {
        if (! Array.isArray(body.replacements)) throw new Error('Unexpected type for repairs');
        await redacted.repairCensoredStory(gameId, Number.parseInt(storyIndex), userId, body.replacements);
    } else {
        throw new Error('Missing expected parameters in ' + JSON.stringify(body))
    }

    return new Response(null, { status: 200 });
}

export const POST: RequestHandler = async function({ params, locals, request }) {
    const { gameId, storyIndex } = params;
    const { userId } = locals.session;
    const body = await request.json();

    try {
    await redacted.continueStory(gameId, Number.parseInt(storyIndex), userId, body.content);
    } catch (failure: unknown) {
        console.error(failure)
        throw failure;
    }

    return new Response(null, { status: 201 });

}