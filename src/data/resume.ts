/** Resume content — swap these placeholders when the look is approved. */
export const resume = {
	name: "Your Name",
	headline: "Your Role · Your Focus",
	tagline:
		"Short one-liner about what you do and the kind of work you want next.",
	location: "City, State",
	email: "you@email.com",
	phone: "",
	linkedin: "https://linkedin.com/in/your-handle",
	github: "https://github.com/your-handle",
	about:
		"Two to four sentences about who you are. Background, strengths, and what you’re looking for. This is placeholder copy until you fill it in.",
	skills: {
		languages: ["Language A", "Language B", "Language C"],
		tools: ["Tool A", "Tool B", "Tool C", "Tool D"],
		soft: ["Communication", "Leadership", "Problem solving"],
	},
	experience: [
		{
			title: "Job Title",
			company: "Company Name",
			dates: "Month Year – Present",
			location: "City, State",
			bullets: [
				"Placeholder achievement with a clear result.",
				"Placeholder responsibility that shows ownership.",
				"Placeholder collaboration or impact bullet.",
			],
		},
		{
			title: "Earlier Role",
			company: "Previous Company",
			dates: "Month Year – Month Year",
			location: "City, State",
			bullets: [
				"Placeholder win from this role.",
				"Placeholder skill or project highlight.",
			],
		},
	],
	projects: [
		{
			name: "Project Name",
			link: "https://example.com",
			blurb: "One-line description of what you built.",
			bullets: [
				"What problem it solved.",
				"Stack or approach in plain language.",
			],
		},
		{
			name: "Another Project",
			link: "",
			blurb: "Another short blurb for a personal or school project.",
			bullets: ["Key outcome or lesson.", "What you owned."],
		},
	],
	education: [
		{
			school: "School Name",
			program: "Degree or Program",
			dates: "Year – Year",
			notes: "Optional honors, GPA, or focus area.",
		},
	],
	extras: ["Certification or award", "Language · fluency", "Interest or club"],
} as const;
