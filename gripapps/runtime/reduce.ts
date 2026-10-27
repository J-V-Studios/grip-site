import type { ActionStep } from "../gripc/src/ast";

export type RuntimeSnapshot = {
	state: Record<string, string | number | boolean>;
	scene: string;
	stack: string[];
	toast?: string | null;
};

export function applySteps(
	ctx: RuntimeSnapshot,
	steps: ActionStep[],
): RuntimeSnapshot {
	let next: RuntimeSnapshot = {
		...ctx,
		state: { ...ctx.state },
		stack: [...ctx.stack],
	};

	for (const step of steps) {
		switch (step.op) {
			case "set":
				next.state[step.key] = step.value;
				break;
			case "goto":
				next = {
					...next,
					scene: step.scene,
					stack: [...next.stack, step.scene],
				};
				break;
			case "back":
				if (next.stack.length > 1) {
					const stack = next.stack.slice(0, -1);
					next = {
						...next,
						stack,
						scene: stack[stack.length - 1],
					};
				}
				break;
			case "toast":
				next = { ...next, toast: step.message };
				break;
		}
	}

	return next;
}
