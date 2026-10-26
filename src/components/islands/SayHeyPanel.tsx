// One-shot “say hey” pulse — blooms on send, then settles into a quiet shared list.
import { useCallback, useEffect, useState } from "react";
import { fetchNotes, insertNote, type Note } from "@/lib/notes";

const DEFAULT_HINT = "drop a line. it blooms, then hangs out below.";

export default function SayHeyPanel() {
	const [notes, setNotes] = useState<Note[]>([]);
	const [hint, setHint] = useState(DEFAULT_HINT);
	const [submitting, setSubmitting] = useState(false);
	const [bloomText, setBloomText] = useState<string | null>(null);

	const refresh = useCallback(async () => {
		try {
			setNotes(await fetchNotes());
			setHint((h) =>
				h === "heys could not load. try again in a minute." ? DEFAULT_HINT : h,
			);
		} catch {
			setHint("heys could not load. try again in a minute.");
		}
	}, []);

	useEffect(() => {
		void refresh();
	}, [refresh]);

	async function onSubmit(event: {
		preventDefault(): void;
		currentTarget: HTMLFormElement;
	}) {
		event.preventDefault();
		const form = event.currentTarget;
		const data = new FormData(form);
		const body = String(data.get("body") || "").trim();
		if (!body) return;

		setSubmitting(true);
		const { error } = await insertNote({
			name: String(data.get("name") || ""),
			body,
		});
		setSubmitting(false);

		if (error) {
			setHint("that hey bounced. try again.");
			return;
		}

		setBloomText(body);
		window.setTimeout(() => setBloomText(null), 900);
		setHint("nice. it's in the pile.");
		form.reset();
		void refresh();
	}

	return (
		<section
			id="say-hey"
			className="motion-rise relative mx-auto w-[min(1100px,calc(100%-1.5rem))] border-t border-white/5 pt-10 pb-16 max-[820px]:w-[min(560px,calc(100%-1.2rem))]"
			style={{ animationDelay: "0.14s" }}
			aria-labelledby="say-hey-title"
		>
			{bloomText ? (
				<div
					className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center"
					aria-hidden="true"
				>
					<div className="motion-hey-bloom rounded-full border-2 border-sky/70 bg-sky/20 px-8 py-5 text-center text-[clamp(1.2rem,3vw,1.8rem)] font-bold text-sky shadow-[0_0_60px_rgba(137,220,235,0.35)]">
						{bloomText}
					</div>
				</div>
			) : null}

			<div className="mb-6 flex flex-wrap items-end justify-between gap-4">
				<div>
					<h2
						id="say-hey-title"
						className="m-0 font-display text-[clamp(1.6rem,3vw,2rem)] font-semibold tracking-[-0.02em] text-text"
					>
						say hey
					</h2>
					<p className="m-0 mt-2 max-w-[32rem] text-[1.02rem] text-subtext">
						One shot. Big pulse. Then it chill-lists under here for everyone.
					</p>
				</div>
				<img
					src="/images/lilgrip-meme.png"
					alt=""
					width="72"
					height="72"
					className="size-[72px] rounded-2xl border border-white/10 object-cover shadow-[0_10px_28px_rgba(0,0,0,0.35)]"
				/>
			</div>

			<form
				className="grid gap-3 sm:grid-cols-[9rem_minmax(0,1fr)_auto] sm:items-end"
				onSubmit={onSubmit}
			>
				<label className="grid gap-1 text-[0.72rem] font-semibold tracking-[0.12em] text-subtext uppercase">
					name
					<input
						type="text"
						name="name"
						maxLength={24}
						autoComplete="nickname"
						placeholder="anon"
						className="w-full rounded-2xl border border-white/10 bg-base/85 px-4 py-3 text-base text-text focus-visible:border-sky/55 focus-visible:shadow-[0_0_0_4px_rgba(137,220,235,0.12)] focus-visible:outline-none"
					/>
				</label>
				<label className="grid gap-1 text-[0.72rem] font-semibold tracking-[0.12em] text-subtext uppercase">
					hey
					<input
						type="text"
						name="body"
						maxLength={200}
						required
						placeholder="yo lilgrip ✌️"
						className="w-full rounded-2xl border border-white/10 bg-base/85 px-4 py-3 text-base text-text focus-visible:border-sky/55 focus-visible:shadow-[0_0_0_4px_rgba(137,220,235,0.12)] focus-visible:outline-none"
					/>
				</label>
				<button
					type="submit"
					disabled={submitting}
					className="min-h-12 rounded-full bg-sky px-6 py-3 font-bold text-base text-base transition-[transform,box-shadow,opacity] duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_28px_rgba(137,220,235,0.3)] focus-visible:outline-none disabled:opacity-65 sm:mb-[1px]"
				>
					{submitting ? "sending…" : "pulse it"}
				</button>
			</form>

			<p className="mt-3 text-[0.92rem] text-subtext">{hint}</p>

			<ul className="m-0 mt-6 grid list-none gap-3 p-0">
				{notes.length === 0 ? (
					<li className="text-[0.92rem] text-subtext">
						nobody has said hey yet. be first. be legendary.
					</li>
				) : (
					notes.map((note) => (
						<li
							key={note.id}
							className="rounded-2xl border border-white/5 bg-surface/60 px-4 py-3"
						>
							<strong className="text-peach">{note.name}</strong>
							<p className="m-0 mt-1 leading-snug text-text">{note.body}</p>
						</li>
					))
				)}
			</ul>
		</section>
	);
}
