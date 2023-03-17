import fi from 'date-fns/esm/locale/fi/index.js';
import type { ComponentType } from 'svelte';

export type ActionLink = { href: string };
export type ActionInPalette = { component: ComponentType };
export type Action = ActionLink | ActionInPalette;

export namespace Action {
	export const isLink = (action: Action): action is ActionLink => 'href' in action;
	export const isActionInPalette = (action: Action): action is ActionInPalette =>
		'component' in action;
}

export type Command = {
	title: string;
	description: string;
	action: Action;
	selected: boolean;
	visible: boolean;
};
export type CommandGroup = {
	name: string;
	visible: boolean;
	commands: Command[];
};

export const firstVisibleCommand = (commandGroups: CommandGroup[]): [number, number] => {
	for (let i = 0; i < commandGroups.length; i++) {
		const group = commandGroups[i];
		if (group.visible) {
			for (let j = 0; j < group.commands.length; j++) {
				const command = group.commands[j];
				if (command.visible) {
					return [i, j];
				}
			}
		}
	}
	return [0, 0];
};

export const lastVisibleCommand = (commandGroups: CommandGroup[]): [number, number] => {
	for (let i = commandGroups.length - 1; i >= 0; i--) {
		const group = commandGroups[i];
		if (group.visible) {
			for (let j = group.commands.length - 1; j >= 0; j--) {
				const command = group.commands[j];
				if (command.visible) {
					return [i, j];
				}
			}
		}
	}
	return [0, 0];
};

export const nextCommand = (
	commandGroups: CommandGroup[],
	selection: [number, number]
): [number, number] => {
	// Next is in the same group
	const nextVisibleCommandInGrpIndex = commandGroups[selection[0]].commands
		.slice(selection[1] + 1)
		.findIndex((command) => command.visible);
	if (nextVisibleCommandInGrpIndex !== -1) {
		// Found next visible command in the same group
		return [selection[0], selection[1] + 1 + nextVisibleCommandInGrpIndex];
	}
	// Find next visible group

	const nextVisibleGroupIndex = commandGroups
		.slice(selection[0] + 1)
		.findIndex((group) => group.visible);
	if (nextVisibleGroupIndex !== -1) {
		const firstVisibleCommandIdx = commandGroups[
			selection[0] + 1 + nextVisibleGroupIndex
		].commands.findIndex((command) => command.visible);
		if (firstVisibleCommandIdx !== -1) {
			// Found next visible command in the next group
			return [selection[0] + 1 + nextVisibleGroupIndex, firstVisibleCommandIdx];
		} else {
			// Found next visible group but no visible commands in it
			return [selection[0] + 1 + nextVisibleGroupIndex, 0];
		}
	}
	// Loop back to the first visible command
	return firstVisibleCommand(commandGroups);
};

export const previousCommand = (
	commandGroups: CommandGroup[],
	selection: [number, number]
): [number, number] => {
	// Previous is in the same group
	const previousVisibleCommandInGrpIndex = commandGroups[selection[0]].commands
		.slice(0, selection[1])
		.reverse()
		.findIndex((command) => command.visible);

	if (previousVisibleCommandInGrpIndex !== -1) {
		// Found previous visible command in the same group
		return [selection[0], selection[1] - 1 - previousVisibleCommandInGrpIndex];
	}
	// Find previous visible group
	const previousVisibleGroupIndex = commandGroups
		.slice(0, selection[0])
		.reverse()
		.findIndex((group) => group.visible);

	if (previousVisibleGroupIndex !== -1) {
		const previousVisibleCommandIndex = commandGroups[
			selection[0] - 1 - previousVisibleGroupIndex
		].commands
			.slice()
			.reverse()
			.findIndex((command) => command.visible);

		if (previousVisibleCommandIndex !== -1) {
			// Found previous visible command in the previous group
			return [selection[0] - 1 - previousVisibleGroupIndex, previousVisibleCommandIndex];
		} else {
			// Found previous visible group but no visible commands in it
			return [selection[0] - 1 - previousVisibleGroupIndex, 0];
		}
	}
	// Loop back to the last visible command
	console.log('lastVisibleCommand(commandGroups)');
	return lastVisibleCommand(commandGroups);
};
