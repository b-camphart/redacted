import type { Database } from 'sqlite';
import { createFile } from './files';

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

class SQLiteSessionStore implements SessionStore {

    private cache: SessionCache | undefined;
    private _filename: string;

    constructor(private database: Database, disableCache: boolean = false) {
        this._filename = database.config.filename;
        if (! disableCache) {
            this.cache = new SessionCache();
        }
    }

    get filename(): string {
        return this._filename;
    }

    async getSessionById(sessionId: string): Promise<App.Session | null> {
        if (this.cache !== undefined) {
            const cached = this.cache.getSessionById(sessionId)
            if (cached != null) return cached;
        }

        const result: { userId: string } | undefined = await this.database.get('SELECT userId from Sessions WHERE id=?', sessionId);
        if (result === undefined) return null;
        const session = { id: sessionId, userId: result.userId };
        if (this.cache !== undefined) {
            this.cache.saveSession(session);
        }

        return session;

    }

    async startNewSession(userId: string): Promise<App.Session> {
        const id = generateSessionId();
        await this.database.run('INSERT INTO Sessions (id, userId) VALUES (?, ?)', id, userId);
        const session = { id, userId }
        if (this.cache !== undefined) {
            this.cache.saveSession(session);
        }

        return session;
    }

    async release(): Promise<void> {
        await this.database.close();
    }

}

export async function createSQLiteSessionDatabase(parentDir: string, filename: string): Promise<Database> {
    const sqlite3 = (await import('sqlite3'));
    const dbWrapper = await import('sqlite');

    const path = await createFile(parentDir, filename)

    const database = await dbWrapper.open({
        filename: path,
        driver: sqlite3.Database
    })

    await database.run('CREATE TABLE Sessions (id TEXT PRIMARY KEY, userId TEXT) WITHOUT ROWID')

    return database;

}

export async function sqliteSessionStore(database: Database, disableCache: boolean = false): Promise<SessionStore & { readonly filename: string, release: () => Promise<void> }> {

    return new SQLiteSessionStore(database, disableCache);
}