import { describe, expect, it } from "vitest";
import { applySteps } from "../../../gripapps/runtime/reduce";

describe("applySteps", () => {
	it("set and goto", () => {
		const next = applySteps(
			{ state: { n: 0 }, scene: "home", stack: ["home"] },
			[
				{ op: "set", key: "n", value: 2 },
				{ op: "goto", scene: "game" },
			],
		);
		expect(next.state.n).toBe(2);
		expect(next.scene).toBe("game");
		expect(next.stack).toEqual(["home", "game"]);
	});

	it("back pops navigation stack", () => {
		const next = applySteps(
			{ state: {}, scene: "game", stack: ["home", "game"] },
			[{ op: "back" }],
		);
		expect(next.scene).toBe("home");
		expect(next.stack).toEqual(["home"]);
	});

	it("toast sets message", () => {
		const next = applySteps({ state: {}, scene: "home", stack: ["home"] }, [
			{ op: "toast", message: "hey" },
		]);
		expect(next.toast).toBe("hey");
	});
});
