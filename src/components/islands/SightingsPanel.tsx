import { useCallback, useEffect, useId, useState } from "react";
import {
	aggregatePoints,
	fetchSightings,
	insertSighting,
	POINTS_PER_SIGHTING,
	publicPhotoUrl,
	rankedLeaders,
	type Sighting,
	uploadSightingPhoto,
} from "@/lib/sightings";
import { clean } from "@/lib/text";

const HUNTER_KEY = "lilgrip-hunter";
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const DEFAULT_HINT = "photos go live for everyone. be chill about it.";

const labelClass =
	"grid gap-[0.4rem] text-[0.75rem] font-semibold tracking-[0.12em] text-subtext uppercase";
const fieldClass =
	"w-full rounded-[0.95rem] border border-white/10 bg-base/85 px-[0.95rem] py-[0.85rem] text-base text-text transition-[border-color,box-shadow] focus-visible:border-sky/55 focus-visible:shadow-[0_0_0_4px_rgba(137,220,235,0.12)] focus-visible:outline-none";

function savedHunter(): string {
	try {
		return localStorage.getItem(HUNTER_KEY) || "";
	} catch {
		return "";
	}
}

function rememberHunter(name: string) {
	try {
		localStorage.setItem(HUNTER_KEY, name);
	} catch {
		/* ignore */
	}
}

export default function SightingsPanel() {
	const photoInputId = useId();
	const [sightings, setSightings] = useState<Sighting[]>([]);
	const [hunter, setHunter] = useState("");
	const [hint, setHint] = useState(DEFAULT_HINT);
	const [photoLabel, setPhotoLabel] = useState("take or choose a photo");
	const [submitting, setSubmitting] = useState(false);

	const refresh = useCallback(async () => {
		try {
			setSightings(await fetchSightings());
			setHint((h) =>
				h === "sightings could not load. try again in a minute."
					? DEFAULT_HINT
					: h,
			);
		} catch {
			setHint("sightings could not load. try again in a minute.");
		}
	}, []);

	useEffect(() => {
		const known = savedHunter();
		if (known) setHunter(known);
		void refresh();
	}, [refresh]);

	const me = clean(hunter || savedHunter(), 24) || "anon";
	const myPoints = aggregatePoints(sightings).get(me) ?? 0;
	const leaders = rankedLeaders(sightings);

	function onHunterChange(value: string) {
		setHunter(value);
		const name = clean(value, 24);
		if (name) rememberHunter(name);
	}

	async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const form = event.currentTarget;
		const data = new FormData(form);
		const hunterName = clean(String(data.get("hunter") || ""), 24) || "anon";
		const place = clean(String(data.get("place") || ""), 80);
		const file = data.get("photo");

		if (!(file instanceof File) || !file.size) {
			setHint("add a photo of the lilgriper first.");
			return;
		}
		if (file.size > MAX_PHOTO_BYTES) {
			setHint("keep the photo under 5MB.");
			return;
		}

		setSubmitting(true);
		setHint("logging your grip sighting…");

		const { path, error: uploadError } = await uploadSightingPhoto(file);
		if (uploadError || !path) {
			setSubmitting(false);
			setHint("photo upload failed. try a smaller jpg or png.");
			return;
		}

		const { error } = await insertSighting({
			hunter: hunterName,
			place,
			photo_path: path,
			points: POINTS_PER_SIGHTING,
		});

		setSubmitting(false);

		if (error) {
			setHint("sighting did not save. try again.");
			return;
		}

		rememberHunter(hunterName);
		setHunter(hunterName);
		form.reset();
		setPhotoLabel("take or choose a photo");
		setHint("+10 grip points locked in. nice find.");
		void refresh();
	}

	return (
		<section
			className="motion-rise border-t border-white/5 py-8"
			aria-labelledby="sightings-title"
		>
			<div className="mb-5 flex flex-wrap items-end justify-between gap-4">
				<div>
					<h2
						id="sightings-title"
						className="m-0 font-display text-[clamp(1.5rem,3vw,1.85rem)] font-semibold tracking-[-0.02em] text-text"
					>
						grip sightings
					</h2>
					<p className="m-0 mt-2 max-w-[34rem] text-[1.02rem] leading-relaxed text-subtext">
						Spot the lilgriper. Snap a pic. Claim{" "}
						<strong className="font-semibold text-sky">+10 grip points</strong>.
					</p>
				</div>
				<div
					className="grid min-w-[8.5rem] gap-[0.2rem] rounded-2xl border border-sky/30 bg-surface/75 px-4 py-[0.85rem] text-right"
					aria-live="polite"
				>
					<span className="text-[0.7rem] font-semibold tracking-[0.12em] text-subtext uppercase">
						your grip points
					</span>
					<strong className="text-[1.55rem] leading-none text-sky">
						{myPoints}
					</strong>
				</div>
			</div>

			<form className="grid gap-[0.85rem]" onSubmit={onSubmit}>
				<label className={labelClass}>
					hunter name
					<input
						type="text"
						name="hunter"
						maxLength={24}
						autoComplete="nickname"
						placeholder="anon"
						value={hunter}
						onChange={(e) => onHunterChange(e.target.value)}
						className={fieldClass}
					/>
				</label>
				<label className={labelClass}>
					where
					<input
						type="text"
						name="place"
						maxLength={80}
						placeholder="school hallway, target, youth group…"
						className={fieldClass}
					/>
				</label>
				<label className={`${labelClass} relative`}>
					photo of the lilgriper
					<input
						id={photoInputId}
						name="photo"
						type="file"
						accept="image/*"
						capture="environment"
						required
						className="absolute inset-0 cursor-pointer opacity-0"
						onChange={(e) => {
							const file = e.target.files?.[0];
							setPhotoLabel(file ? file.name : "take or choose a photo");
						}}
					/>
					<span className="flex min-h-[52px] items-center justify-center rounded-[0.95rem] border border-dashed border-mauve/45 bg-base/75 px-4 py-[0.85rem] text-center text-[0.95rem] font-semibold tracking-[0.02em] text-mauve">
						{photoLabel}
					</span>
				</label>
				<button
					type="submit"
					disabled={submitting}
					className="min-h-12 justify-self-start rounded-full bg-sky px-[1.35rem] py-3 font-bold text-base text-base transition-[transform,box-shadow,opacity] duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_28px_rgba(137,220,235,0.28)] focus-visible:-translate-y-0.5 focus-visible:shadow-[0_10px_28px_rgba(137,220,235,0.28)] focus-visible:outline-none disabled:opacity-65 disabled:transform-none disabled:shadow-none"
				>
					{submitting ? "uploading…" : `log sighting · +${POINTS_PER_SIGHTING}`}
				</button>
			</form>

			<p className="mt-3 text-[0.92rem] text-subtext">{hint}</p>

			<div className="mt-4 grid gap-5 min-[821px]:grid-cols-[minmax(0,1.4fr)_minmax(220px,0.7fr)]">
				<div>
					<h3 className="m-0 mb-3 text-[0.78rem] font-semibold tracking-[0.16em] text-mauve uppercase">
						latest sightings
					</h3>
					<ul className="m-0 grid list-none gap-3 p-0">
						{sightings.length === 0 ? (
							<li className="text-[0.92rem] text-subtext">
								no sightings yet. if you see the lilgriper, log it.
							</li>
						) : (
							sightings.map((row) => (
								<li
									key={row.id}
									className="grid grid-cols-[108px_minmax(0,1fr)] gap-3 rounded-2xl bg-surface/72 p-[0.55rem]"
								>
									<img
										src={publicPhotoUrl(row.photo_path)}
										alt={`grip sighting by ${row.hunter}`}
										loading="lazy"
										className="aspect-square w-full rounded-[0.8rem] bg-base/90 object-cover object-center"
									/>
									<div>
										<strong className="text-peach">{row.hunter}</strong>
										<p className="m-0 mt-[0.3rem] leading-snug">
											{row.place || "somewhere out there"}
										</p>
										<span className="mt-[0.45rem] inline-block text-[0.8rem] font-semibold text-sky">
											+{row.points} grip
										</span>
									</div>
								</li>
							))
						)}
					</ul>
				</div>
				<div>
					<h3 className="m-0 mb-3 text-[0.78rem] font-semibold tracking-[0.16em] text-mauve uppercase">
						grip leaderboard
					</h3>
					<ol className="m-0 grid list-none gap-3 p-0">
						{leaders.length === 0 ? (
							<li className="text-[0.92rem] text-subtext">
								no grip points yet.
							</li>
						) : (
							leaders.map((entry, index) => (
								<li
									key={entry.hunter}
									className="grid grid-cols-[1.6rem_minmax(0,1fr)_auto] items-center gap-2 rounded-2xl bg-surface/72 px-[0.85rem] py-3"
								>
									<span className="font-semibold text-mauve">{index + 1}</span>
									<strong className="truncate">{entry.hunter}</strong>
									<span className="text-[0.85rem] font-semibold text-sky">
										{entry.points} pts
									</span>
								</li>
							))
						)}
					</ol>
				</div>
			</div>
		</section>
	);
}
