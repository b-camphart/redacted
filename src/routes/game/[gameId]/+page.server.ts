import { redacted } from '../../../usecases';
import type { GameJoined } from '../../../usecases/joinGame';
import { serialize } from './assignments/serializer';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async function({ params, locals }) {
    const joined: GameJoined = await redacted.joinGame(params.gameId, locals.session.userId);

    return {
        ...joined,
        playerAssignment: undefined,
        assignment: joined.playerAssignment && serialize(joined.playerAssignment),
     };
}