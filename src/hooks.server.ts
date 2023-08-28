import { inMemorySessionStore, type SessionStore } from '$lib/sessions';
import type { Handle } from '@sveltejs/kit';

const cookieName = 'sid' // could we regenerate this every time the server starts?

const sessionStore = await inMemorySessionStore()

async function startNewSession(store: SessionStore): Promise<App.Session> {
    const userId = Math.random().toString(36).slice(2);
    return await store.startNewSession(userId);
}

export const handle: Handle = async ({ event, resolve }) => {
    let sessionId = event.cookies.get(cookieName)



    let session: App.Session;
    if (sessionId == null) {
        session = await startNewSession(sessionStore)
    } else {
        const maybeSession = await sessionStore.getSessionById(sessionId);
        if (maybeSession == null) {
            session = await startNewSession(sessionStore)
        } else { 
            session = maybeSession;
        }
    }

    event.cookies.set(cookieName, session.id);

    event.locals = {
        session
    }

    return resolve(event)
}