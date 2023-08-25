import { redacted } from '../../../../../../usecases/index.js';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async function({ params, locals, request }) {
    await redacted.startStory(
        params.gameId,
        locals.session.userId,
        await request.text()
    )
    return new Response(null, { status: 201 })
}