export function clean(value: string, max: number): string {
	return value.replace(/\s+/g, " ").trim().slice(0, max);
}
