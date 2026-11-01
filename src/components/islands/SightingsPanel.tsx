// Grip sightings: auth accounts, photo upload, gallery, leaderboard (+10 pts).
import { useCallback, useEffect, useId, useState } from "react";
import {
	claimUsername,
	fetchMyProfile,
	type GripProfile,
	hunterLabel,
	onAuthChange,
	signInHunter,
	signOutHunter,
	signUpHunter,
	validateUsername,
} from "@/lib/auth";
import {
	fetchLeaderboard,
	fetchSightings,
	insertSighting,
	type LeaderEntry,
	POINTS_PER_SIGHTING,
	publicPhotoUrl,
	reportNotGripster,
	type Sighting,
	uploadSightingPhoto,
	validateSightingImage,
} from "@/lib/sightings";
import { clean } from "@/lib/text";

const DEFAULT_HINT =
	"sign in, snap the lilgriper, earn +10 grip points. flag fakes.";

const labelClass =
	"grid gap-[0.4rem] text-[0.75rem] font-semibold tracking-[0.12em] text-subtext uppercase";
const fieldClass =
	"w-full rounded-[0.95rem] border border-white/10 bg-base/85 px-[0.95rem] py-[0.85rem] text-base text-text transition-[border-color,box-shadow] focus-visible:border-sky/55 focus-visible:shadow-[0_0_0_4px_rgba(137,220,235,0.12)] focus-visible:outline-none";

export default function SightingsPanel() {
	const photoInputId = useId();
	const [sightings, setSightings] = useState<Sighting[]>([]);
	const [leaders, setLeaders] = useState<LeaderEntry[]>([]);
	const [profile, setProfile] = useState<GripProfile | null>(null);
	const [userId, setUserId] = useState<string | null>(null);
	const [authMode, setAuthMode] = useState<"signin" | "signup">("signup");
	const [hint, setHint] = useState(DEFAULT_HINT);
	const [photo, setPhoto] = useState<File | null>(null);
	const [photoPreview, setPhotoPreview] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);
	const [authBusy, setAuthBusy] = useState(false);
	const [reportingId, setReportingId] = useState<string | null>(null);
	const [claimName, setClaimName] = useState("");

	const refreshLists = useCallback(async () => {
		try {
			const [rows, board] = await Promise.all([
				fetchSightings(),
				fetchLeaderboard(10),
			]);
			setSightings(rows);
			setLeaders(board);
			setHint((h) =>
				h === "sightings could not load. try again in a minute."
					? DEFAULT_HINT
					: h,
			);
		} catch {
			setHint("sightings could not load. try again in a minute.");
		}
	}, []);

	const refreshAuth = useCallback(async () => {
		let me = await fetchMyProfile();
		if (me && !me.username) {
			try {
				const pending = localStorage.getItem("lilgrip-pending-username");
				if (pending) {
					const claimed = await claimUsername(pending);
					if (!claimed.error) {
						localStorage.removeItem("lilgrip-pending-username");
						me = await fetchMyProfile();
					}
				}
			} catch {
				/* ignore */
			}
		}
		setProfile(me);
		setUserId(me?.id ?? null);
		if (me?.username) setClaimName(me.username);
	}, []);

	useEffect(() => {
		void refreshLists();
		void refreshAuth();
		return onAuthChange(() => {
			void refreshAuth();
		});
	}, [refreshAuth, refreshLists]);

	useEffect(() => {
		return () => {
			if (photoPreview) URL.revokeObjectURL(photoPreview);
		};
	}, [photoPreview]);

	const me = hunterLabel(profile);
	const myPoints =
		leaders.find((row) => row.user_id === userId)?.points ??
		sightings
			.filter((row) => row.user_id === userId)
			.reduce((sum, row) => sum + row.points, 0);

	function onPhotoChange(fileList: FileList | null) {
		const file = fileList?.[0] ?? null;
		if (photoPreview) URL.revokeObjectURL(photoPreview);
		if (!file) {
			setPhoto(null);
			setPhotoPreview(null);
			return;
		}
		const invalid = validateSightingImage(file);
		if (invalid) {
			setHint(invalid);
			setPhoto(null);
			setPhotoPreview(null);
			return;
		}
		setPhoto(file);
		setPhotoPreview(URL.createObjectURL(file));
		setHint(DEFAULT_HINT);
	}

	async function onAuthSubmit(event: {
		preventDefault(): void;
		currentTarget: HTMLFormElement;
	}) {
		event.preventDefault();
		const form = event.currentTarget;
		const data = new FormData(form);
		const email = String(data.get("email") || "");
		const password = String(data.get("password") || "");
		const username = String(data.get("username") || "");

		setAuthBusy(true);
		if (authMode === "signup") {
			const result = await signUpHunter({ email, password, username });
			setAuthBusy(false);
			if (result.error) {
				setHint(result.error);
				return;
			}
			if (result.needsEmailConfirm) {
				setHint("check your email to confirm, then sign in.");
				setAuthMode("signin");
				return;
			}
			await refreshAuth();
			setHint(`welcome @${normalizeDisplay(username)}. log a sighting.`);
			return;
		}

		const result = await signInHunter({ email, password });
		setAuthBusy(false);
		if (result.error) {
			setHint(result.error);
			return;
		}
		await refreshAuth();
		setHint("signed in. snap the gripster.");
	}

	async function onClaimUsername(event: { preventDefault(): void }) {
		event.preventDefault();
		const invalid = validateUsername(claimName);
		if (invalid) {
			setHint(invalid);
			return;
		}
		setAuthBusy(true);
		const result = await claimUsername(claimName);
		setAuthBusy(false);
		if (result.error) {
			setHint(result.error);
			return;
		}
		await refreshAuth();
		setHint(`hunter name locked: @${result.username}`);
	}

	async function onSignOut() {
		await signOutHunter();
		setProfile(null);
		setUserId(null);
		setHint("signed out.");
	}

	async function onReportNotGripster(id: string) {
		const ok = window.confirm(
			"Flag this as not the lilgriper? Two flags take the photo down and remove its points.",
		);
		if (!ok) return;
		setReportingId(id);
		const result = await reportNotGripster(id);
		setReportingId(null);
		if (!result.ok) {
			setHint(result.error ?? "could not flag that sighting.");
			return;
		}
		if (result.hidden) {
			setHint("taken down — enough people said it wasn't the gripster.");
			void refreshLists();
			return;
		}
		setHint(
			`flagged (${result.reportCount ?? 1}/2). one more distinct flag takes it down.`,
		);
	}

	async function onSubmit(event: {
		preventDefault(): void;
		currentTarget: HTMLFormElement;
	}) {
		event.preventDefault();
		if (!userId || !profile) {
			setHint("sign in first to earn grip points.");
			return;
		}
		const hunterName = hunterLabel(profile);
		if (!profile.username) {
			setHint("pick a hunter username before logging a sighting.");
			return;
		}

		const form = event.currentTarget;
		const data = new FormData(form);
		const place = clean(String(data.get("place") || ""), 80);
		const file = photo;

		if (!file?.size) {
			setHint("add a photo of the lilgriper first.");
			return;
		}
		const invalid = validateSightingImage(file);
		if (invalid) {
			setHint(invalid);
			return;
		}

		setSubmitting(true);
		setHint("logging your grip sighting…");

		const { path, error: uploadError } = await uploadSightingPhoto(file);
		if (uploadError || !path) {
			setSubmitting(false);
			setHint(uploadError ?? "photo upload failed. try a smaller jpg or png.");
			return;
		}

		const { error } = await insertSighting({
			hunter: hunterName,
			place,
			photo_path: path,
			points: POINTS_PER_SIGHTING,
			user_id: userId,
		});

		setSubmitting(false);

		if (error) {
			setHint(
				error.includes("JWT") ? "session expired — sign in again." : error,
			);
			return;
		}

		form.reset();
		if (photoPreview) URL.revokeObjectURL(photoPreview);
		setPhoto(null);
		setPhotoPreview(null);
		setHint(`+${POINTS_PER_SIGHTING} grip points locked in. nice find.`);
		void refreshLists();
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
						Make an account. Spot the lilgriper. Snap a pic. Climb the{" "}
						<strong className="font-semibold text-sky">grip leaderboard</strong>
						.
					</p>
				</div>
				<div
					className="grid min-w-[8.5rem] gap-[0.2rem] rounded-2xl border border-sky/30 bg-surface/75 px-4 py-[0.85rem] text-right"
					aria-live="polite"
				>
					<span className="text-[0.7rem] font-semibold tracking-[0.12em] text-subtext uppercase">
						{userId ? `@${me}` : "your grip points"}
					</span>
					<strong className="text-[1.55rem] leading-none text-sky">
						{myPoints}
					</strong>
				</div>
			</div>

			{!userId ? (
				<form
					className="mb-5 grid gap-[0.85rem] rounded-2xl border border-white/8 bg-surface/55 p-4"
					onSubmit={onAuthSubmit}
				>
					<div className="flex flex-wrap gap-2">
						<button
							type="button"
							onClick={() => setAuthMode("signup")}
							className={`rounded-full px-3 py-1.5 text-sm font-semibold ${
								authMode === "signup"
									? "bg-sky text-base"
									: "border border-white/10 text-subtext"
							}`}
						>
							create account
						</button>
						<button
							type="button"
							onClick={() => setAuthMode("signin")}
							className={`rounded-full px-3 py-1.5 text-sm font-semibold ${
								authMode === "signin"
									? "bg-sky text-base"
									: "border border-white/10 text-subtext"
							}`}
						>
							sign in
						</button>
					</div>
					{authMode === "signup" ? (
						<label className={labelClass}>
							hunter username
							<input
								type="text"
								name="username"
								required
								minLength={3}
								maxLength={24}
								autoComplete="username"
								placeholder="gripfan42"
								className={fieldClass}
							/>
						</label>
					) : null}
					<label className={labelClass}>
						email
						<input
							type="email"
							name="email"
							required
							autoComplete="email"
							placeholder="you@example.com"
							className={fieldClass}
						/>
					</label>
					<label className={labelClass}>
						password
						<input
							type="password"
							name="password"
							required
							minLength={6}
							autoComplete={
								authMode === "signup" ? "new-password" : "current-password"
							}
							placeholder="••••••••"
							className={fieldClass}
						/>
					</label>
					<button
						type="submit"
						disabled={authBusy}
						className="min-h-12 justify-self-start rounded-full bg-sky px-[1.35rem] py-3 font-bold text-base text-base transition-[transform,box-shadow,opacity] duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_28px_rgba(137,220,235,0.28)] focus-visible:outline-none disabled:opacity-65"
					>
						{authBusy
							? "working…"
							: authMode === "signup"
								? "create hunter account"
								: "sign in"}
					</button>
				</form>
			) : (
				<div className="mb-5 flex flex-wrap items-center gap-3 rounded-2xl border border-white/8 bg-surface/55 px-4 py-3">
					<p className="m-0 flex-1 text-[0.95rem] text-subtext">
						signed in as{" "}
						<strong className="text-sky">
							{profile?.username
								? `@${profile.username}`
								: "hunter (set a name)"}
						</strong>
					</p>
					<button
						type="button"
						onClick={() => void onSignOut()}
						className="rounded-full border border-white/12 px-3 py-1.5 text-sm font-semibold text-subtext hover:border-peach/40 hover:text-peach"
					>
						sign out
					</button>
				</div>
			)}

			{userId && !profile?.username ? (
				<form
					className="mb-5 grid gap-[0.85rem] rounded-2xl border border-peach/25 bg-surface/55 p-4"
					onSubmit={onClaimUsername}
				>
					<label className={labelClass}>
						claim hunter username
						<input
							type="text"
							value={claimName}
							onChange={(e) => setClaimName(e.target.value)}
							minLength={3}
							maxLength={24}
							required
							placeholder="gripfan42"
							className={fieldClass}
						/>
					</label>
					<button
						type="submit"
						disabled={authBusy}
						className="min-h-11 justify-self-start rounded-full bg-peach px-4 py-2.5 font-bold text-base text-base disabled:opacity-65"
					>
						{authBusy ? "saving…" : "save username"}
					</button>
				</form>
			) : null}

			<form className="grid gap-[0.85rem]" onSubmit={onSubmit}>
				<label className={labelClass}>
					where
					<input
						type="text"
						name="place"
						maxLength={80}
						placeholder="school hallway, target, youth group…"
						disabled={!userId}
						className={fieldClass}
					/>
				</label>
				<div className="grid gap-2">
					<span className={labelClass}>photo of the lilgriper</span>
					<label
						htmlFor={photoInputId}
						className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-[0.95rem] border border-dashed border-mauve/45 bg-base/75 px-4 py-[0.85rem] text-center text-[0.95rem] font-semibold tracking-[0.02em] text-mauve transition-colors hover:border-sky/50 hover:text-sky"
					>
						{photo ? "change photo" : "take or choose a photo"}
						<input
							id={photoInputId}
							type="file"
							accept="image/jpeg,image/png,image/webp,image/heic,image/heif,image/*"
							className="sr-only"
							disabled={!userId || submitting}
							onChange={(e) => onPhotoChange(e.target.files)}
						/>
					</label>
					{photoPreview ? (
						<img
							src={photoPreview}
							alt="Selected sighting preview"
							className="mt-1 h-28 w-28 rounded-xl border border-white/10 object-cover"
						/>
					) : null}
				</div>
				<button
					type="submit"
					disabled={submitting || !userId}
					className="min-h-12 justify-self-start rounded-full bg-sky px-[1.35rem] py-3 font-bold text-base text-base transition-[transform,box-shadow,opacity] duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_28px_rgba(137,220,235,0.28)] focus-visible:-translate-y-0.5 focus-visible:shadow-[0_10px_28px_rgba(137,220,235,0.28)] focus-visible:outline-none disabled:opacity-65 disabled:transform-none disabled:shadow-none"
				>
					{submitting
						? "uploading…"
						: !userId
							? "sign in to log"
							: `log sighting · +${POINTS_PER_SIGHTING}`}
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
										<button
											type="button"
											disabled={reportingId === row.id}
											onClick={() => void onReportNotGripster(row.id)}
											className="mt-2 block text-left text-[0.78rem] font-semibold text-subtext underline-offset-2 hover:text-peach hover:underline disabled:opacity-60"
										>
											{reportingId === row.id
												? "flagging…"
												: "not the gripster?"}
										</button>
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
								no grip points yet. create an account and log a sighting.
							</li>
						) : (
							leaders.map((entry, index) => (
								<li
									key={entry.user_id}
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

function normalizeDisplay(raw: string): string {
	return clean(raw, 24)
		.toLowerCase()
		.replace(/[^a-z0-9_]/g, "");
}
