export const TOP_LEVEL_KEYWORDS = new Set([
	"meta",
	"shell",
	"state",
	"scene",
	"action",
	"raw_module",
]);

export const SCENE_CHILD_KEYWORDS = new Set([
	"stack",
	"grid",
	"hero",
	"card",
	"modal",
	"text",
	"button",
	"toggle",
	"slider",
	"tabs",
	"toast",
	"canvas",
	"sprite",
	"timer",
	"score_hud",
	"particles",
	"image",
	"emoji_stage",
	"clear",
	"raw_slot",
]);

export const LAYOUT_BLOCK_KEYWORDS = new Set([
	"stack",
	"grid",
	"hero",
	"card",
	"modal",
	"canvas",
	"tabs",
]);

export const THEME_PRESETS = new Set([
	"lilgrip_default",
	"neon_lagoon",
	"barn_night",
	"candy_arcade",
	"deep_space",
]);

export const MOTION_PRESETS = new Set(["bounce", "float", "pulse", "none"]);
