import { Logtail } from '@logtail/edge'

interface Env extends CfEnv {}

export default {
	async tail(events: TraceItem[], env: Env, ctx: ExecutionContext) {
		const logtail = new Logtail(env.BETTERSTACK_LOGS_KEY).withExecutionContext(ctx)

		for (const event of events) {
			const context = {
				entrypoint: `${event.scriptName}#${event.entrypoint}`,
				outcome: event.outcome,
				...event.event,
			}
			for (const log of event.logs) {
				let message: string
				if (typeof log.message === 'string') {
					message = log.message
				} else if (Array.isArray(log.message)) {
					message = log.message.join(' ')
				} else {
					message = JSON.stringify(log.message)
				}
				logtail.log(message, log.level, context)
			}

			for (const exception of event.exceptions) {
				logtail.error(`${exception.name} ${exception.message}`, context)
			}

			if (event.logs.length === 0 && event.exceptions.length === 0) {
				logtail.info('processed event', context)
			}
		}
	},
}
