export function aggregatePoints(
	rows: { hunter: string; points: number }[],
): Map<string, number> {
	const totals = new Map<string, number>();
	for (const row of rows) {
		totals.set(row.hunter, (totals.get(row.hunter) ?? 0) + row.points);
	}
	return totals;
}

export function rankedLeaders(
	rows: { hunter: string; points: number }[],
	limit = 10,
): { hunter: string; points: number }[] {
	return [...aggregatePoints(rows).entries()]
		.map(([hunter, points]) => ({ hunter, points }))
		.sort((a, b) => b.points - a.points || a.hunter.localeCompare(b.hunter))
		.slice(0, limit);
}

export function extFor(file: { name: string; type: string }): string {
	const fromName = (file.name.split(".").pop() || "").toLowerCase();
	if (["jpg", "jpeg", "png", "webp", "heic", "heif"].includes(fromName)) {
		return fromName === "jpeg" ? "jpg" : fromName;
	}
	const map: Record<string, string> = {
		"image/jpeg": "jpg",
		"image/jpg": "jpg",
		"image/png": "png",
		"image/webp": "webp",
		"image/heic": "heic",
		"image/heif": "heif",
	};
	return map[file.type] || "jpg";
}
