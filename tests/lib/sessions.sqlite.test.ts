import { sqliteSessionStore, type SessionStore, createSQLiteSessionDatabase } from "$lib/sessions";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import fileSystem from 'fs'
import type { Database } from "sqlite";


describe('SQLiteSessionStore', () => {

    let database: Database;
    let store: SessionStore;

    beforeAll(async () => {
        database = await createSQLiteSessionDatabase('./.data', '/sessions.db');
        store = await sqliteSessionStore(database, true);
    })

    afterAll(async () => {
        database.getDatabaseInstance().interrupt()
        await database.close()
        fileSystem.rmSync('./.data/sessions.db', { force: true, maxRetries: 4 });
    })

    it('does not have sessions that have not be created', async () => {
        const session = await store.getSessionById('non-existant-sesssion')

        expect(session).toBeNull();
    })

    it('generates new session ids when created', async () => {
        const session = await store.startNewSession('my-user-id')

        expect(session).toBeDefined();
        expect(session.userId).toEqual('my-user-id')
        expect(session.id).toBeDefined();
    })

    it('generates unique session ids', async () => {
        const session1 = await store.startNewSession('user-1');
        const session2 = await store.startNewSession('user-2');

        expect(session1.id).not.toEqual(session2.id)
    })

    it('remembers created sessions', async () => {
        const createdSession = await store.startNewSession('some-user-id')
        const storedSession = await store.getSessionById(createdSession.id);

        expect(storedSession).toBeDefined();
        expect(storedSession!.id).toEqual(createdSession.id);
        expect(storedSession!.userId).toEqual('some-user-id');

    })

})