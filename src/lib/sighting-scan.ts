// Client-side grip sighting photo scan: hashes, near-dup, face presence, site-photo reuse.

/** Minutes between sightings for one hunter account. */
export const SIGHTING_COOLDOWN_MINUTES = 15;

/** Max Hamming distance (of 64) to treat two dHashes as the same photo. */
export const DHASH_NEAR_DUP_MAX = 10;

/** Max Hamming distance vs official site images (hero/meme) to call out reuse. */
export const DHASH_SITE_REUSE_MAX = 12;

export const GRIPSTER_REF_PATHS = [
	"/images/lilgriper.jpg",
	"/images/lilgrip-meme.png",
] as const;

export function hammingDistanceHex(a: string, b: string): number {
	const left = a.toLowerCase().replace(/[^0-9a-f]/g, "");
	const right = b.toLowerCase().replace(/[^0-9a-f]/g, "");
	if (!left || !right || left.length !== right.length) return 64;
	let dist = 0;
	for (let i = 0; i < left.length; i += 1) {
		const x =
			Number.parseInt(left[i] ?? "0", 16) ^
			Number.parseInt(right[i] ?? "0", 16);
		dist += popcount4(x);
	}
	return dist;
}

function popcount4(n: number): number {
	let v = n & 0xf;
	let c = 0;
	while (v) {
		c += v & 1;
		v >>= 1;
	}
	return c;
}

export function isNearDuplicateDhash(
	candidate: string,
	known: string[],
	maxDistance = DHASH_NEAR_DUP_MAX,
): boolean {
	return known.some(
		(hash) => hammingDistanceHex(candidate, hash) <= maxDistance,
	);
}

export async function sha256Hex(buffer: ArrayBuffer): Promise<string> {
	const digest = await crypto.subtle.digest("SHA-256", buffer);
	return [...new Uint8Array(digest)]
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
}

type PixelBuffer = {
	width: number;
	height: number;
	data: ArrayLike<number>;
};

/** 64-bit difference hash as 16 hex chars (classic 9×8 grayscale dHash). */
export function dhashFromImageData(data: PixelBuffer): string {
	const { width, height, data: pixels } = data;
	if (width < 2 || height < 1) return "0".repeat(16);

	const gray: number[] = [];
	for (let y = 0; y < height; y += 1) {
		for (let x = 0; x < width; x += 1) {
			const i = (y * width + x) * 4;
			const r = pixels[i] ?? 0;
			const g = pixels[i + 1] ?? 0;
			const b = pixels[i + 2] ?? 0;
			gray.push(0.299 * r + 0.587 * g + 0.114 * b);
		}
	}

	let bits = 0n;
	let bit = 63n;
	for (let y = 0; y < height; y += 1) {
		for (let x = 0; x < width - 1; x += 1) {
			const left = gray[y * width + x] ?? 0;
			const right = gray[y * width + x + 1] ?? 0;
			if (left > right) bits |= 1n << bit;
			bit -= 1n;
			if (bit < 0n) break;
		}
		if (bit < 0n) break;
	}
	return bits.toString(16).padStart(16, "0");
}

export async function loadImageElement(
	src: string | Blob,
): Promise<HTMLImageElement> {
	const url = typeof src === "string" ? src : URL.createObjectURL(src);
	try {
		const img = await new Promise<HTMLImageElement>((resolve, reject) => {
			const el = new Image();
			el.decoding = "async";
			el.onload = () => resolve(el);
			el.onerror = () => reject(new Error("could not decode photo"));
			if (typeof src === "string" && src.startsWith("/")) {
				el.src = src;
			} else if (typeof src === "string") {
				el.crossOrigin = "anonymous";
				el.src = src;
			} else {
				el.src = url;
			}
		});
		return img;
	} finally {
		if (typeof src !== "string") URL.revokeObjectURL(url);
	}
}

export function sampleImageToImageData(
	img: CanvasImageSource & {
		width?: number;
		height?: number;
		videoWidth?: number;
		videoHeight?: number;
	},
	sampleW = 9,
	sampleH = 8,
): ImageData {
	const canvas = document.createElement("canvas");
	canvas.width = sampleW;
	canvas.height = sampleH;
	const ctx = canvas.getContext("2d", { willReadFrequently: true });
	if (!ctx) throw new Error("canvas unsupported");
	ctx.drawImage(img as CanvasImageSource, 0, 0, sampleW, sampleH);
	return ctx.getImageData(0, 0, sampleW, sampleH);
}

export async function dhashFromBlob(file: Blob): Promise<string | null> {
	try {
		const img = await loadImageElement(file);
		return dhashFromImageData(sampleImageToImageData(img));
	} catch {
		return null;
	}
}

export async function dhashFromUrl(path: string): Promise<string | null> {
	try {
		const img = await loadImageElement(path);
		return dhashFromImageData(sampleImageToImageData(img));
	} catch {
		return null;
	}
}

export type FaceScanResult =
	| { supported: false; faces: null }
	| { supported: true; faces: number };

/** Best-effort face count via Shape Detection API when the browser has it. */
export async function scanFacesInBlob(file: Blob): Promise<FaceScanResult> {
	const FaceDetectorCtor = (
		globalThis as unknown as {
			FaceDetector?: new (opts?: {
				fastMode?: boolean;
				maxDetectedFaces?: number;
			}) => {
				detect: (source: ImageBitmapSource) => Promise<unknown[]>;
			};
		}
	).FaceDetector;

	if (!FaceDetectorCtor) {
		return { supported: false, faces: null };
	}

	try {
		const bitmap = await createImageBitmap(file);
		try {
			const detector = new FaceDetectorCtor({
				fastMode: true,
				maxDetectedFaces: 5,
			});
			const hits = await detector.detect(bitmap);
			return { supported: true, faces: hits.length };
		} finally {
			bitmap.close();
		}
	} catch {
		// Detector present but failed (HEIC, security, etc.) — don't hard-fail upload.
		return { supported: false, faces: null };
	}
}

export type SightingScanOk = {
	ok: true;
	sha256: string;
	dhash: string | null;
	faces: number | null;
	faceScanSupported: boolean;
};

export type SightingScanFail = {
	ok: false;
	error: string;
};

export type SightingScanResult = SightingScanOk | SightingScanFail;

/**
 * Scan a candidate sighting photo before upload.
 * - exact/near duplicates vs known hashes
 * - reuse of official site gripster images
 * - face present when FaceDetector is available
 */
export async function scanSightingPhoto(input: {
	file: File;
	knownSha256: string[];
	knownDhashes: string[];
	siteDhashes: string[];
}): Promise<SightingScanResult> {
	const buffer = await input.file.arrayBuffer();
	const sha256 = await sha256Hex(buffer);

	if (input.knownSha256.includes(sha256)) {
		return {
			ok: false,
			error: "that exact photo was already logged. snap a fresh one.",
		};
	}

	const dhash = await dhashFromBlob(input.file);

	if (
		dhash &&
		isNearDuplicateDhash(dhash, input.siteDhashes, DHASH_SITE_REUSE_MAX)
	) {
		return {
			ok: false,
			error:
				"that's the site photo, not a real sighting. go find the actual lilgriper.",
		};
	}

	if (
		dhash &&
		isNearDuplicateDhash(dhash, input.knownDhashes, DHASH_NEAR_DUP_MAX)
	) {
		return {
			ok: false,
			error: "looks like a photo we already have. wait and take a new angle.",
		};
	}

	const faceScan = await scanFacesInBlob(input.file);
	if (faceScan.supported && (faceScan.faces ?? 0) < 1) {
		return {
			ok: false,
			error:
				"scan didn't find a person — make sure the lilgriper's face is in the shot.",
		};
	}

	return {
		ok: true,
		sha256,
		dhash,
		faces: faceScan.faces,
		faceScanSupported: faceScan.supported,
	};
}

export function cooldownRemainingMs(
	lastCreatedAt: string | null | undefined,
	now = Date.now(),
	cooldownMinutes = SIGHTING_COOLDOWN_MINUTES,
): number {
	if (!lastCreatedAt) return 0;
	const last = Date.parse(lastCreatedAt);
	if (Number.isNaN(last)) return 0;
	const elapsed = now - last;
	const windowMs = cooldownMinutes * 60_000;
	return Math.max(0, windowMs - elapsed);
}

export function formatCooldown(ms: number): string {
	const totalSec = Math.ceil(ms / 1000);
	const m = Math.floor(totalSec / 60);
	const s = totalSec % 60;
	if (m <= 0) return `${s}s`;
	return `${m}m ${s.toString().padStart(2, "0")}s`;
}
