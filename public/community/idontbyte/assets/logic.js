/** Pure helpers for the Chill Harbor toy: river, coins, plot data. */

export const BLOCK = 36;
export const ROWS = 8;
export const COLS = 8;
export const MAX_HEIGHT = 6;

export const BLOCKS = [
	{ id: 1, name: "grass", top: "#a6e3a1", side: "#6c8c5a" },
	{ id: 2, name: "oak", top: "#efd5b0", side: "#c4a574" },
	{ id: 3, name: "cobble", top: "#cdd6f4", side: "#9399b2" },
	{ id: 4, name: "sand", top: "#f9e2af", side: "#e5c07b" },
	{ id: 5, name: "water", top: "#89dceb", side: "#74c7ec" },
	{ id: 6, name: "glass", top: "#dce7ff", side: "#89b4fa" },
];

const BLOCK_IDS = new Set(BLOCKS.map((block) => block.id));

export function blockById(id) {
	return BLOCKS.find((block) => block.id === id) ?? BLOCKS[0];
}

export function hash32(n) {
	let x = Math.imul(n | 0, 0x45d9f3b);
	x = Math.imul(x ^ (x >>> 16), 0x45d9f3b);
	return (x ^ (x >>> 16)) >>> 0;
}

/** Normalized river banks at a world distance, in pixels. */
export function riverAt(dist) {
	const basin = Math.max(0, 1 - dist / 280);
	const wander = 1 - basin;
	const center =
		0.5 +
		wander *
			(0.18 * Math.sin(dist * 0.0036) + 0.08 * Math.sin(dist * 0.009 + 1.4));
	const half = Math.max(
		0.16,
		Math.min(
			0.42,
			0.4 * basin + wander * (0.22 + 0.045 * Math.sin(dist * 0.0055 + 0.6)),
		),
	);
	const mid = Math.max(half + 0.01, Math.min(1 - half - 0.01, center));
	return { left: mid - half, right: mid + half };
}

export function coinForRow(row) {
	if (row < 6 || row % 3 !== 0) return null;
	const h = hash32(row * 997 + 13);
	if (h % 2 !== 0) return null;
	const dist = row * BLOCK + BLOCK / 2;
	const river = riverAt(dist);
	const span = river.right - river.left;
	const t = ((h >>> 8) % 1000) / 999;
	const nx = river.left + span * (0.2 + t * 0.6);
	return { id: row, dist, nx };
}

/** Keep the boat inside the channel. `bumped` means a bank nudged it. */
export function containBoat(boatX, dist, margin = 0.055) {
	const river = riverAt(dist);
	const minX = river.left + margin;
	const maxX = river.right - margin;
	if (minX >= maxX) {
		const mid = (river.left + river.right) / 2;
		return { x: mid, bumped: Math.abs(boatX - mid) > 0.001 };
	}
	if (boatX < minX) return { x: minX, bumped: true };
	if (boatX > maxX) return { x: maxX, bumped: true };
	return { x: boatX, bumped: false };
}

export function sanitizeName(value) {
	return String(value)
		.replace(/[\u0000-\u001F\u007F]/g, "")
		.slice(0, 32);
}

export function emptyColumns() {
	return Array.from({ length: ROWS }, () =>
		Array.from({ length: COLS }, () => []),
	);
}

export function parsePlot(raw) {
	const fallback = { name: "", columns: emptyColumns() };
	if (!raw || typeof raw !== "object") return fallback;
	const name = sanitizeName(raw.name ?? "");
	if (!Array.isArray(raw.columns) || raw.columns.length !== ROWS) {
		return { name, columns: emptyColumns() };
	}
	const columns = raw.columns.map((row) => {
		if (!Array.isArray(row) || row.length !== COLS) {
			return Array.from({ length: COLS }, () => []);
		}
		return row.map((stack) => {
			if (!Array.isArray(stack)) return [];
			return stack.filter((id) => BLOCK_IDS.has(id)).slice(0, MAX_HEIGHT);
		});
	});
	return { name, columns };
}

export function countBlocks(columns) {
	let total = 0;
	for (const row of columns) {
		for (const stack of row) total += stack.length;
	}
	return total;
}

export function moodLine(blocks) {
	if (blocks < 20) return "the water's glassy";
	if (blocks < 80) return "nice and easy";
	if (blocks < 180) return "the river's waking up";
	return "full send, still chill";
}
