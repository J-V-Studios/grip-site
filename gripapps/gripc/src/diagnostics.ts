export type Diagnostic = {
	file: string;
	line: number;
	column: number;
	message: string;
	hint?: string;
};

export function diagnostic(
	file: string,
	line: number,
	column: number,
	message: string,
	hint?: string,
): Diagnostic {
	return { file, line, column, message, hint };
}
