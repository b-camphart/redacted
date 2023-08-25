import { redirect } from '@sveltejs/kit';
import { redacted } from '../../usecases';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async function({ request }) {
    let formData: FormData | undefined;
    try {
        formData = await request.formData();
    } catch (error: unknown) {
    }
    
    let numberOfStoryEntries = 6;
    if (formData !== undefined && formData.has('numberOfStoryEntries')) {
        numberOfStoryEntries = Number.parseInt(formData.get('numberOfStoryEntries')!.toString());
    }
    
    const id = await redacted.createGame(numberOfStoryEntries);

    throw redirect(302, `/game/${id}`);
}