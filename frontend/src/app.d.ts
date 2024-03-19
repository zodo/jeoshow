// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
	namespace App {
		interface Platform {
			env: {
				JEOSHOW_PACKS: R2Bucket
			}
			cf: CfProperties
			ctx: ExecutionContext
		}
	}
}

export {}
