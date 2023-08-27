import type { Handle } from '@sveltejs/kit';
import { kv } from '@vercel/kv';

const cookieName = 'sid' // could we regenerate this every time the server starts?

const vercelSessionStore = () => {
    return {
        get(sessionId: string) { return kv.get<{ userId: string }>(`s${sessionId}`) },
        set(sessionId: string, session: { userId: string }) { return kv.set(`s${sessionId}`, session) }
    }
}

const sessionStore = process.env.host === 'vercel' ? vercelSessionStore() : new Map<string, { userId: string }>();

export const handle: Handle = async ({ event, resolve }) => {
    let sessionId = event.cookies.get(cookieName)
    if (sessionId == null) {
        sessionId = Math.random().toString(36).slice(2)
    }

    let session = await sessionStore.get(sessionId)
    if (session == null) {
        session = {
            userId: Math.random().toString(36).slice(2)
        }
        await sessionStore.set(sessionId, session);
    }

    event.cookies.set(cookieName, sessionId);

    event.locals = {
        session: { id: sessionId, ...session }
    }

    return resolve(event)
}