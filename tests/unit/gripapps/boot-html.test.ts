import { describe, expect, it } from "vitest";
import { renderBootHtml } from "../../../gripapps/gripc/src/boot-html";

describe("renderBootHtml", () => {
	it("escapes the title, stores the handle, and fails visibly", () => {
		const html = renderBootHtml({
			handle: 'my"handle',
			version: "1",
			title: "Hello <Grip>",
		});
		expect(html).toContain("<title>Hello &lt;Grip&gt;</title>");
		expect(html).toContain('data-grip-handle="my&quot;handle"');
		expect(html).toContain("s.onerror");
		expect(html).toContain("fallback.onerror");
		expect(html).toContain("Could not load app.grip.js");
		expect(html).toContain("Could not load the GripApps runtime");
	});
});
