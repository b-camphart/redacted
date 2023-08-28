export interface SessionStore {

    getSessionById(sessionId: string): Promise<App.Session | null>;
    startNewSession(userId: string): Promise<App.Session>

}

class SessionCache {

    private cache = new Map<string, string>();

    getSessionById(sessionId: string): App.Session | null {
        const userId = this.cache.get(sessionId);
        if (userId == null) return null
        return { id: sessionId, userId };
    }

    saveSession(session: App.Session) {
        this.cache.set(session.id, session.userId);
    }

}

function generateSessionId(): string {
    return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
}

class InMemorySessionStore implements SessionStore {

    private cache = new SessionCache();

    async getSessionById(sessionId: string): Promise<App.Session | null> {
        return this.cache.getSessionById(sessionId);
    }

    async startNewSession(userId: string): Promise<App.Session> {
        const id = generateSessionId();

        const session = { id, userId }
        this.cache.saveSession(session);

        return session

    }
}

export async function inMemorySessionStore(): Promise<SessionStore> {
    return new InMemorySessionStore();
}