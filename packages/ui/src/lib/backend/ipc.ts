import type { EventCallback, EventName } from '@tauri-apps/api/event';
import { invoke as invokeTauri } from '@tauri-apps/api/tauri';
import { listen as listenTauri } from '@tauri-apps/api/event';
import { writable } from 'svelte/store';

export enum Code {
	Unknown = 'errors.unknown',
	Validation = 'errors.validation',
	Projects = 'errors.projects',
	ProjectsGitAuth = 'errors.projects.git.auth',
	ProjectsGitRemote = 'errors.projects.git.remote',
	ProjectHead = 'errors.projects.head',
	ProjectConflict = 'errors.projects.conflict'
}

export class UserError extends Error {
	code!: Code;

	constructor(message: string, code: Code, cause: unknown) {
		super(message);

		this.name = 'UserError';
		this.cause = cause;
		this.code = code;
	}

	static fromError(error: any): UserError {
		const cause = error instanceof Error ? error : undefined;
		const code = error.code ?? Code.Unknown;
		const message = error.message ?? 'Unknown error';
		return new UserError(message, code, cause);
	}
}

const loadingStore = writable(false);
export const loadStack: string[] = [];
export const isLoading = {
	...loadingStore,
	loadStack,
	push: (name: string) => {
		loadStack.push(name);
		loadingStore.set(true);
	},
	pop: () => {
		loadStack.pop();
		if (loadStack.length == 0) loadingStore.set(false);
	}
};

export async function invoke<T>(command: string, params: Record<string, unknown> = {}): Promise<T> {
	// This commented out code can be used to delay/reject an api call
	// return new Promise<T>((resolve, reject) => {
	// 	if (command.startsWith('apply')) {
	// 		setTimeout(() => {
	// 			reject('rejected');
	// 		}, 2000);
	// 	} else {
	// 		resolve(invokeTauri<T>(command, params));
	// 	}
	// }).catch((reason) => {
	// 	const userError = UserError.fromError(reason);
	// 	console.error(`ipc->${command}: ${JSON.stringify(params)}`, userError);
	// 	throw userError;
	// });
	isLoading.push(command);
	return (
		invokeTauri<T>(command, params)
			// .then((value) => {
			// 	console.debug(`ipc->${command}(${JSON.stringify(params)})`, value);
			// 	return value;
			// })
			.then((value) => {
				return value;
			})
			.catch((reason) => {
				const userError = UserError.fromError(reason);
				console.error(`ipc->${command}: ${JSON.stringify(params)}`, userError, reason);
				throw userError;
			})
			.finally(() => {
				isLoading.pop();
			})
	);
}

export function listen<T>(event: EventName, handle: EventCallback<T>) {
	const unlisten = listenTauri(event, handle);
	return () => unlisten.then((unlistenFn) => unlistenFn());
}