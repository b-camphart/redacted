// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Session {
			id: string;
			userId: string;
		}
		interface Locals {
			session: Session;
		}
		// interface PageData {}
		// interface Platform {}
	}
}

export {};
