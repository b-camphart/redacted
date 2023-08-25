import type { Subscription } from '$lib/updates';
import { redacted } from '../../../../../usecases/index';
import { serialize } from '../../../../game/[gameId]/assignments/serializer';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, locals }) => {
    const userId = locals.session.userId;

    const subscriptions: Array<Subscription> = [];

    let closed = true;

    const events = new ReadableStream({
        start: (controller) => {
            controller.enqueue('\n\n');

            return Promise.allSettled(
                [
                    redacted.watchForOtherPlayers(params.gameId, userId, playerJoined => {
                        if (closed) return;
                        controller.enqueue(`event: PlayerJoinedGame\n`)
                        controller.enqueue(`data: ${JSON.stringify(playerJoined)}\n\n`)
                    }),
                    redacted.watchForAssignment(params.gameId, userId, assignment => {
                        if (closed) return;
                        controller.enqueue(`event: NewAssignment\n`)
                        controller.enqueue(`data: ${JSON.stringify(assignment && serialize(assignment))}\n\n`)
                    })
                ]
            )
                .then((subscriptionResults) => {
                    if (subscriptionResults.some(result => result.status === 'rejected')) {
                        subscriptionResults.forEach(result => {
                            if (result.status === 'fulfilled') result.value.end();
                        })
                    } else {
                        subscriptionResults.forEach(result => {
                            if (result.status === 'fulfilled') subscriptions.push(result.value);
                        })
                        closed = false;
                    }
                 })
        },
        cancel: () => {
            closed = true;
            subscriptions.forEach(subscription => subscription.end());
        }
    })

    return new Response(events, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Keep-Alive': 'timeout=20'
        }
    })
}

export const PATCH: RequestHandler = async ({ params }) => {
    await redacted.startGame(params.gameId);

    return new Response(null, { status: 200 })
}