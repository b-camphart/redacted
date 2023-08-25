import type { Handle } from '@sveltejs/kit';

const cookieName = 'sid' // could we regenerate this every time the server starts?

const sessionStore = new Map<string, { id: string, userId: string }>();

export const handle: Handle = async ({ event, resolve }) => {
    let sessionId = event.cookies.get(cookieName)
    if (sessionId == null) {
        sessionId = Math.random().toString(36).slice(2)
    }

    let session = sessionStore.get(sessionId)
    if (session == null) {
        session = {
            id: sessionId,
            userId: Math.random().toString(36).slice(2)
        }
        sessionStore.set(sessionId, session);
    }

    event.cookies.set(cookieName, sessionId);

    event.locals = {
        session
    }

    return resolve(event)
}