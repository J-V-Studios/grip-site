import { describe, expect, it } from "vitest";
import { HEY_IMAGE_MAX_BYTES, validateHeyImage } from "@/lib/notes";

function fakeFile(name: string, type: string, size: number): File {
	const blob = new Blob([new Uint8Array(Math.min(size, 64))], { type });
	const file = new File([blob], name, { type });
	Object.defineProperty(file, "size", { value: size });
	return file;
}

describe("validateHeyImage", () => {
	it("accepts a normal jpeg", () => {
		expect(
			validateHeyImage(fakeFile("hey.jpg", "image/jpeg", 1200)),
		).toBeNull();
	});

	it("rejects oversize files", () => {
		expect(
			validateHeyImage(
				fakeFile("big.png", "image/png", HEY_IMAGE_MAX_BYTES + 1),
			),
		).toMatch(/too big/i);
	});

	it("rejects non-image mime", () => {
		expect(validateHeyImage(fakeFile("nope.gif", "image/gif", 1000))).toMatch(
			/jpg|png|webp|heic/i,
		);
	});
});
