export type GripBuildManifest = {
	handle: string;
	title: string;
	blurb: string;
	builtAt: string;
};

export type GripManifestMeta = {
	title: string;
	blurb: string;
	theme: string;
};

export function mergeBuildManifest(
	existing: Partial<GripBuildManifest> | null | undefined,
	next: GripBuildManifest,
): GripBuildManifest {
	return {
		...existing,
		handle: next.handle,
		title: next.title,
		blurb: next.blurb,
		builtAt: next.builtAt,
	};
}
