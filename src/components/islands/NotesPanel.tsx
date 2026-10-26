import { useCallback, useEffect, useState } from "react";
import { fetchNotes, insertNote, type Note } from "@/lib/notes";

const DEFAULT_HINT = "everyone can see these notes.";

const labelClass =
	"grid gap-[0.4rem] text-[0.75rem] font-semibold tracking-[0.12em] text-subtext uppercase";
const fieldClass =
	"w-full rounded-[0.95rem] border border-white/10 bg-base/85 px-[0.95rem] py-[0.85rem] text-base text-text transition-[border-color,box-shadow] focus-visible:border-sky/55 focus-visible:shadow-[0_0_0_4px_rgba(137,220,235,0.12)] focus-visible:outline-none";

export default function NotesPanel() {
	const [notes, setNotes] = useState<Note[]>([]);
	const [hint, setHint] = useState(DEFAULT_HINT);
	const [submitting, setSubmitting] = useState(false);

	const refresh = useCallback(async () => {
		try {
			setNotes(await fetchNotes());
			setHint((h) =>
				h === "notes could not load. try again in a minute." ? DEFAULT_HINT : h,
			);
		} catch {
			setHint("notes could not load. try again in a minute.");
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
		const body = String(data.get("body") || "");
		if (!body.trim()) return;

		setSubmitting(true);
		const { error } = await insertNote({
			name: String(data.get("name") || ""),
			body,
		});
		setSubmitting(false);

		if (error) {
			setHint("that note did not post. try again.");
			return;
		}

		setHint(DEFAULT_HINT);
		form.reset();
		void refresh();
	}

	return (
		<section
			className="motion-rise border-t border-white/5 py-8"
			aria-labelledby="notes-title"
		>
			<h2
				id="notes-title"
				className="m-0 mb-5 font-display text-[clamp(1.5rem,3vw,1.85rem)] font-semibold tracking-[-0.02em] text-text"
			>
				notes for lilgrip
			</h2>

			<form className="grid gap-[0.85rem]" onSubmit={onSubmit}>
				<label className={labelClass}>
					name
					<input
						type="text"
						name="name"
						maxLength={24}
						autoComplete="nickname"
						placeholder="anon"
						className={fieldClass}
					/>
				</label>
				<label className={labelClass}>
					comment
					<textarea
						name="body"
						maxLength={200}
						required
						placeholder="say hey to the lilgriper"
						className={`${fieldClass} min-h-[6.2rem] resize-y`}
					/>
				</label>
				<button
					type="submit"
					disabled={submitting}
					className="min-h-12 justify-self-start rounded-full bg-sky px-[1.35rem] py-3 font-bold text-base text-base transition-[transform,box-shadow,opacity] duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_28px_rgba(137,220,235,0.28)] focus-visible:-translate-y-0.5 focus-visible:shadow-[0_10px_28px_rgba(137,220,235,0.28)] focus-visible:outline-none disabled:opacity-65 disabled:transform-none disabled:shadow-none"
				>
					post
				</button>
			</form>

			<p className="mt-3 text-[0.92rem] text-subtext">{hint}</p>

			<ul className="m-0 mt-4 grid list-none gap-3 p-0">
				{notes.length === 0 ? (
					<li className="text-[0.92rem] text-subtext">
						no notes yet. say hey to the lilgriper.
					</li>
				) : (
					notes.map((note) => (
						<li
							key={note.id}
							className="rounded-2xl bg-surface/72 px-4 py-[0.9rem]"
						>
							<strong className="text-peach">{note.name}</strong>
							<p className="m-0 mt-[0.3rem] leading-snug">{note.body}</p>
						</li>
					))
				)}
			</ul>
		</section>
	);
}
