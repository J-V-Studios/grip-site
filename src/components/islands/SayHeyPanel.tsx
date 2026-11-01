/** Say-hey pulse island: short comments with optional photos. */
import { useAutoAnimate } from "@formkit/auto-animate/react";
import {
	QueryClient,
	QueryClientProvider,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import confetti from "canvas-confetti";
import { ImagePlus, MessageCircleHeart, Send, Sparkles, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useOptimistic, useRef, useState, useTransition } from "react";
import Balancer from "react-wrap-balancer";
import { toast } from "sonner";
import { parseHeyInput } from "@/lib/hey-schema";
import {
	fetchNotes,
	insertNote,
	type Note,
	publicHeyPhotoUrl,
	validateHeyImage,
} from "@/lib/notes";
import { usePulseStore } from "@/lib/pulse-store";

const queryClient = new QueryClient({
	defaultOptions: {
		queries: { staleTime: 20_000, refetchOnWindowFocus: false },
	},
});

function firePulseConfetti() {
	const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
	if (reduced) return;
	void confetti({
		particleCount: 96,
		spread: 78,
		startVelocity: 38,
		origin: { y: 0.72 },
		colors: ["#89dceb", "#cba6f7", "#fab387", "#94e2d5", "#89b4fa"],
	});
}

function SayHeyInner() {
	const reduce = useReducedMotion();
	const qc = useQueryClient();
	const recordPulse = usePulseStore((s) => s.recordPulse);
	const pulseCount = usePulseStore((s) => s.pulseCount);
	const [bloomText, setBloomText] = useState<string | null>(null);
	const [photo, setPhoto] = useState<File | null>(null);
	const [photoPreview, setPhotoPreview] = useState<string | null>(null);
	const fileRef = useRef<HTMLInputElement>(null);
	const [, startTransition] = useTransition();
	const [listParent] = useAutoAnimate();

	const notesQuery = useQuery({
		queryKey: ["heys"],
		queryFn: fetchNotes,
	});

	const notes = notesQuery.data ?? [];
	const [optimisticNotes, addOptimistic] = useOptimistic(
		notes,
		(current: Note[], next: Note) => [
			next,
			...current.filter((n) => n.id !== next.id),
		],
	);

	const mutation = useMutation({
		mutationFn: insertNote,
		onError: (error) => {
			const message =
				error instanceof Error ? error.message : "that hey bounced. try again.";
			toast.error(
				message.includes("Supabase") ? "heys are offline right now." : message,
			);
		},
	});

	function clearPhoto() {
		if (photoPreview) URL.revokeObjectURL(photoPreview);
		setPhoto(null);
		setPhotoPreview(null);
		if (fileRef.current) fileRef.current.value = "";
	}

	function onPhotoChange(event: { currentTarget: HTMLInputElement }) {
		const file = event.currentTarget.files?.[0] ?? null;
		if (!file) {
			clearPhoto();
			return;
		}
		const invalid = validateHeyImage(file);
		if (invalid) {
			toast.error(invalid);
			event.currentTarget.value = "";
			return;
		}
		if (photoPreview) URL.revokeObjectURL(photoPreview);
		setPhoto(file);
		setPhotoPreview(URL.createObjectURL(file));
	}

	async function onSubmit(event: {
		preventDefault(): void;
		currentTarget: HTMLFormElement;
	}) {
		event.preventDefault();
		const form = event.currentTarget;
		const data = new FormData(form);
		const hasPhoto = Boolean(photo);
		const parsed = parseHeyInput(
			{
				name: String(data.get("name") || ""),
				body: String(data.get("body") || ""),
			},
			{ allowEmptyBody: hasPhoto },
		);
		if (!parsed.data) {
			toast.error(parsed.error ?? "that hey bounced.");
			return;
		}
		if (!parsed.data.body && !hasPhoto) {
			toast.error("add a hey or a photo");
			return;
		}

		const { name, body } = parsed.data;
		const optimistic: Note = {
			id: `optimistic-${crypto.randomUUID()}`,
			name,
			body: body || "📷",
			photo_path: hasPhoto ? "optimistic" : null,
		};

		startTransition(() => {
			addOptimistic(optimistic);
		});

		const result = await mutation.mutateAsync({
			name,
			body,
			photo,
		});
		if (result.error || !result.note) {
			toast.error(
				result.error?.includes("Supabase")
					? "heys are offline right now."
					: (result.error ?? "that hey bounced. try again."),
			);
			return;
		}

		recordPulse(body || "photo hey");
		setBloomText(body || "📷");
		window.setTimeout(() => setBloomText(null), 900);
		firePulseConfetti();
		toast.success("pulse locked in", {
			description: `it's in the pile for everyone.${pulseCount > 0 ? ` (${pulseCount + 1} pulses this session)` : ""}`,
			icon: <Sparkles className="size-4 text-sky" />,
		});
		form.reset();
		clearPhoto();
		await qc.invalidateQueries({ queryKey: ["heys"] });
	}

	return (
		<section
			id="say-hey"
			className="scroll-fade relative mx-auto w-[min(1100px,calc(100%-1.5rem))] border-t border-white/5 pt-10 pb-16 max-[820px]:w-[min(560px,calc(100%-1.2rem))]"
			aria-labelledby="say-hey-title"
		>
			<AnimatePresence>
				{bloomText ? (
					<motion.div
						key="bloom"
						className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center"
						aria-hidden="true"
						initial={reduce ? { opacity: 1 } : { opacity: 0, scale: 0.55 }}
						animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1.12 }}
						exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 1.55 }}
						transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
					>
						<div className="rounded-full border-2 border-sky/70 bg-sky/20 px-8 py-5 text-center text-[clamp(1.2rem,3vw,1.8rem)] font-bold text-sky shadow-[0_0_60px_rgba(137,220,235,0.35)]">
							{bloomText}
						</div>
					</motion.div>
				) : null}
			</AnimatePresence>

			<div className="mb-6 flex flex-wrap items-end justify-between gap-4">
				<div>
					<h2
						id="say-hey-title"
						className="m-0 flex items-center gap-2 font-display text-[clamp(1.6rem,3vw,2rem)] font-semibold tracking-[-0.02em] text-text"
					>
						<MessageCircleHeart
							className="size-7 text-peach"
							aria-hidden="true"
						/>
						say hey
					</h2>
					<p className="m-0 mt-2 max-w-[32rem] text-[1.02rem] text-subtext">
						<Balancer>
							Drop a line, a pic, or both. It blooms, then chill-lists for
							everyone.
						</Balancer>
					</p>
				</div>
				<motion.img
					src="/images/lilgrip-meme.png"
					alt=""
					width={72}
					height={72}
					className="size-[72px] rounded-2xl border border-white/10 object-cover shadow-[0_10px_28px_rgba(0,0,0,0.35)]"
					animate={
						reduce ? undefined : { rotate: [0, -6, 6, 0], y: [0, -4, 0] }
					}
					transition={{
						duration: 4.5,
						repeat: Number.POSITIVE_INFINITY,
						ease: "easeInOut",
					}}
				/>
			</div>

			<form className="grid gap-3" onSubmit={onSubmit}>
				<div className="grid gap-3 sm:grid-cols-[9rem_minmax(0,1fr)_auto] sm:items-end">
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
							placeholder="yo lilgrip ✌️"
							className="w-full rounded-2xl border border-white/10 bg-base/85 px-4 py-3 text-base text-text focus-visible:border-sky/55 focus-visible:shadow-[0_0_0_4px_rgba(137,220,235,0.12)] focus-visible:outline-none"
						/>
					</label>
					<button
						type="submit"
						disabled={mutation.isPending}
						className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-sky px-6 py-3 font-bold text-base text-base transition-[transform,box-shadow,opacity] duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_28px_rgba(137,220,235,0.3)] focus-visible:outline-none disabled:opacity-65 sm:mb-[1px]"
					>
						<Send className="size-4" aria-hidden="true" />
						{mutation.isPending ? "sending…" : "pulse it"}
					</button>
				</div>

				<div className="flex flex-wrap items-center gap-3">
					<label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/10 bg-surface/50 px-4 py-2 text-sm font-semibold text-subtext transition-colors hover:border-sky/40 hover:text-sky">
						<ImagePlus className="size-4" aria-hidden="true" />
						{photo ? "change photo" : "add photo"}
						<input
							ref={fileRef}
							type="file"
							accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
							className="sr-only"
							onChange={onPhotoChange}
						/>
					</label>
					{photoPreview ? (
						<div className="relative">
							<img
								src={photoPreview}
								alt="Selected hey preview"
								className="h-16 w-16 rounded-xl border border-white/10 object-cover"
							/>
							<button
								type="button"
								onClick={clearPhoto}
								className="absolute -top-2 -right-2 inline-flex size-6 items-center justify-center rounded-full bg-base text-peach shadow"
								aria-label="Remove photo"
							>
								<X className="size-3.5" aria-hidden="true" />
							</button>
						</div>
					) : null}
					<span className="text-[0.8rem] text-subtext">
						optional · jpg/png/webp · max 5MB
					</span>
				</div>
			</form>

			<p className="mt-3 text-[0.92rem] text-subtext">
				{notesQuery.isError
					? "heys could not load. try again in a minute."
					: "text, pic, or both — then it hangs out below."}
			</p>

			<ul ref={listParent} className="m-0 mt-6 grid list-none gap-3 p-0">
				{optimisticNotes.length === 0 ? (
					<li className="text-[0.92rem] text-subtext">
						nobody has said hey yet. be first. be legendary.
					</li>
				) : (
					optimisticNotes.map((note) => (
						<li
							key={note.id}
							className="rounded-2xl border border-white/5 bg-surface/60 px-4 py-3"
						>
							<strong className="text-peach">{note.name}</strong>
							{note.body ? (
								<p className="m-0 mt-1 leading-snug text-text">{note.body}</p>
							) : null}
							{note.photo_path && note.photo_path !== "optimistic" ? (
								<img
									src={publicHeyPhotoUrl(note.photo_path)}
									alt=""
									loading="lazy"
									className="mt-3 max-h-72 w-full max-w-md rounded-xl border border-white/10 object-cover"
								/>
							) : note.photo_path === "optimistic" && photoPreview ? (
								<img
									src={photoPreview}
									alt=""
									className="mt-3 max-h-72 w-full max-w-md rounded-xl border border-white/10 object-cover opacity-80"
								/>
							) : null}
						</li>
					))
				)}
			</ul>
		</section>
	);
}

export default function SayHeyPanel() {
	return (
		<QueryClientProvider client={queryClient}>
			<SayHeyInner />
		</QueryClientProvider>
	);
}
