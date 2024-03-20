export type ClientAction =
	| { type: 'Introduce'; name: string }
	| { type: 'StartGame' }
	| { type: 'SelectQuestion'; questionId: string }
	| { type: 'HitButton' }
	| { type: 'GiveAnswer'; value: string }
	| { type: 'MediaFinished'; questionId: string }
	| { type: 'StartAppeal' }
	| { type: 'ResolveAppeal'; resolution: boolean }
