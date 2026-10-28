import {
	QueryClient,
	QueryClientProvider,
	useMutation,
	useQuery,
} from "@tanstack/react-query";
import { Hammer, KeyRound, Loader2, Sparkles, Wand2 } from "lucide-react";
import { useMemo, useState } from "react";
import Balancer from "react-wrap-balancer";
import { toast } from "sonner";
import {
	type CommunityGalleryItem,
	fetchLiveCommunityPages,
} from "@/lib/community";
import { humanizeCommunityBuildError } from "@/lib/community-errors";
import {
	claimHandle,
	enqueueBuild,
	fetchBuildStatus,
	isInFlightStatus,
	resolveOrchestratorUrl,
} from "@/lib/community-orchestrator";
import { normalizeHandle, parsePrompt } from "@/lib/community-schema";

const queryClient = new QueryClient({
	defaultOptions: {
		queries: { staleTime: 10_000, refetchOnWindowFocus: false },
	},
});

type Mode = "claim" | "build";

function statusLabel(status: string): string {
	switch (status) {
		case "queued":
			return "queued";
		case "moderating":
			return "vibe check";
		case "planning":
			return "planning";
		case "building":
			return "building";
		case "live":
			return "live";
		case "rejected":
			return "rejected";
		case "failed":
			return "failed";
		default:
			return status;
	}
}

function CommunityHubInner() {
	const orchestratorUrl = useMemo(() => resolveOrchestratorUrl(), []);
	const orchestratorReady = Boolean(orchestratorUrl);

	const [mode, setMode] = useState<Mode>("claim");
	const [claimedEditCode, setClaimedEditCode] = useState<string | null>(null);
	const [claimedHandle, setClaimedHandle] = useState<string | null>(null);
	const [activeBuildId, setActiveBuildId] = useState<string | null>(null);

	const statusQuery = useQuery({
		queryKey: ["community-build-status", activeBuildId],
		enabled: Boolean(orchestratorUrl && activeBuildId),
		queryFn: async () => {
			if (!orchestratorUrl || !activeBuildId) {
				throw new Error("status poll not configured");
			}
			return fetchBuildStatus(orchestratorUrl, activeBuildId);
		},
		refetchInterval: (query) => {
			const status = query.state.data?.status;
			if (!status || !isInFlightStatus(status)) {
				return false;
			}
			return 3_500;
		},
	});

	const claimMutation = useMutation({
		mutationFn: (handle: string) => {
			if (!orchestratorUrl) {
				throw new Error("orchestrator not configured");
			}
			return claimHandle(orchestratorUrl, handle);
		},
		onSuccess: (data) => {
			setClaimedHandle(data.handle);
			setClaimedEditCode(data.editCode);
			setMode("build");
			toast.success("handle claimed", {
				description: "copy your edit code now — we will not show it again.",
			});
		},
		onError: (error) => {
			toast.error(
				error instanceof Error ? error.message : "could not claim handle",
			);
		},
	});

	const enqueueMutation = useMutation({
		mutationFn: (input: {
			handle: string;
			editCode: string;
			prompt: string;
		}) => {
			if (!orchestratorUrl) {
				throw new Error("orchestrator not configured");
			}
			return enqueueBuild(orchestratorUrl, input);
		},
		onSuccess: (data) => {
			setActiveBuildId(data.buildId);
			toast.success("build queued", {
				description: "hang tight while the agents cook.",
			});
		},
		onError: (error) => {
			toast.error(
				error instanceof Error ? error.message : "could not enqueue build",
			);
		},
	});

	function onClaimSubmit(event: {
		preventDefault(): void;
		currentTarget: HTMLFormElement;
	}) {
		event.preventDefault();
		if (!orchestratorUrl) return;
		const data = new FormData(event.currentTarget);
		const handle = normalizeHandle(String(data.get("handle") ?? ""));
		if (!handle) {
			toast.error("pick a valid handle (3–24 chars, lowercase, hyphens ok)");
			return;
		}
		claimMutation.mutate(handle);
	}

	function onBuildSubmit(event: {
		preventDefault(): void;
		currentTarget: HTMLFormElement;
	}) {
		event.preventDefault();
		if (!orchestratorUrl) return;
		const data = new FormData(event.currentTarget);
		const handle = normalizeHandle(String(data.get("handle") ?? ""));
		if (!handle) {
			toast.error("enter your claimed handle");
			return;
		}
		const editCode = String(data.get("editCode") ?? "").trim();
		if (editCode.length < 8) {
			toast.error("edit code looks too short");
			return;
		}
		const parsed = parsePrompt({ prompt: String(data.get("prompt") ?? "") });
		if (!parsed.data) {
			toast.error(parsed.error ?? "prompt bounced");
			return;
		}
		enqueueMutation.mutate({
			handle,
			editCode,
			prompt: parsed.data.prompt,
		});
	}

	const status = statusQuery.data;

	return (
		<section
			className="mx-auto w-[min(1100px,calc(100%-1.5rem))] max-[820px]:w-[min(560px,calc(100%-1.2rem))] pb-14"
			aria-labelledby="community-hub-title"
		>
			<div className="mb-6 flex flex-wrap items-end justify-between gap-4">
				<div>
					<h2
						id="community-hub-title"
						className="m-0 flex items-center gap-2 font-display text-[clamp(1.5rem,3vw,1.9rem)] font-semibold tracking-[-0.02em] text-text"
					>
						<Hammer className="size-7 text-sky" aria-hidden="true" />
						claim &amp; build
					</h2>
					<p className="m-0 mt-2 max-w-[36rem] text-[1.02rem] text-subtext">
						<Balancer>
							Grab a handle, save your secret edit code, drop a prompt once per
							UTC day. Agents ship a mini-page under{" "}
							<code className="text-sky">/community/your-handle/</code>.
						</Balancer>
					</p>
				</div>
			</div>

			{!orchestratorReady ? (
				<div
					className="mb-6 rounded-2xl border border-peach/35 bg-peach/10 px-4 py-3 text-[0.95rem] text-text"
					role="status"
				>
					Community builds are not wired up yet. Set{" "}
					<code className="text-peach">PUBLIC_COMMUNITY_ORCHESTRATOR_URL</code>{" "}
					in your env (see <code>.env.example</code>) and deploy the Supabase
					edge function.
				</div>
			) : null}

			<div className="mb-4 flex flex-wrap gap-2">
				<button
					type="button"
					onClick={() => setMode("claim")}
					className={`rounded-full px-4 py-2 text-[0.85rem] font-semibold transition-colors ${
						mode === "claim"
							? "bg-sky text-base"
							: "border border-white/10 bg-surface/60 text-subtext hover:text-text"
					}`}
				>
					claim handle
				</button>
				<button
					type="button"
					onClick={() => setMode("build")}
					className={`rounded-full px-4 py-2 text-[0.85rem] font-semibold transition-colors ${
						mode === "build"
							? "bg-mauve text-base"
							: "border border-white/10 bg-surface/60 text-subtext hover:text-text"
					}`}
				>
					enqueue build
				</button>
			</div>

			{claimedEditCode ? (
				<div
					className="mb-6 rounded-2xl border-2 border-peach/50 bg-peach/10 px-5 py-4"
					role="alert"
				>
					<p className="m-0 flex items-center gap-2 text-[0.78rem] font-bold tracking-[0.14em] text-peach uppercase">
						<KeyRound className="size-4" aria-hidden="true" />
						save your edit code — shown once
					</p>
					<p className="m-0 mt-2 text-[0.95rem] text-subtext">
						Copy this somewhere safe. We cannot recover it for you.
					</p>
					<p className="mt-3 break-all rounded-xl border border-white/10 bg-base/80 px-4 py-3 font-mono text-[0.92rem] text-text select-all">
						{claimedEditCode}
					</p>
					{claimedHandle ? (
						<p className="m-0 mt-2 text-[0.9rem] text-subtext">
							handle: <strong className="text-sky">{claimedHandle}</strong>
						</p>
					) : null}
				</div>
			) : null}

			{mode === "claim" ? (
				<form
					className="grid max-w-xl gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end"
					onSubmit={onClaimSubmit}
				>
					<label className="grid gap-1 text-[0.72rem] font-semibold tracking-[0.12em] text-subtext uppercase">
						handle
						<input
							type="text"
							name="handle"
							required
							autoComplete="off"
							placeholder="coolkid"
							maxLength={24}
							disabled={!orchestratorReady || claimMutation.isPending}
							className="w-full rounded-2xl border border-white/10 bg-base/85 px-4 py-3 text-base text-text focus-visible:border-sky/55 focus-visible:shadow-[0_0_0_4px_rgba(137,220,235,0.12)] focus-visible:outline-none disabled:opacity-60"
						/>
					</label>
					<button
						type="submit"
						disabled={!orchestratorReady || claimMutation.isPending}
						className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-sky px-6 py-3 font-bold text-base text-base transition-[transform,box-shadow,opacity] duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_28px_rgba(137,220,235,0.3)] focus-visible:outline-none disabled:opacity-65 sm:mb-[1px]"
					>
						{claimMutation.isPending ? (
							<Loader2 className="size-4 animate-spin" aria-hidden="true" />
						) : (
							<Sparkles className="size-4" aria-hidden="true" />
						)}
						{claimMutation.isPending ? "claiming…" : "claim it"}
					</button>
				</form>
			) : (
				<form className="grid max-w-2xl gap-3" onSubmit={onBuildSubmit}>
					<div className="grid gap-3 sm:grid-cols-2">
						<label className="grid gap-1 text-[0.72rem] font-semibold tracking-[0.12em] text-subtext uppercase">
							handle
							<input
								type="text"
								name="handle"
								required
								autoComplete="off"
								defaultValue={claimedHandle ?? ""}
								maxLength={24}
								disabled={!orchestratorReady || enqueueMutation.isPending}
								className="w-full rounded-2xl border border-white/10 bg-base/85 px-4 py-3 text-base text-text focus-visible:border-mauve/55 focus-visible:shadow-[0_0_0_4px_rgba(203,166,247,0.12)] focus-visible:outline-none disabled:opacity-60"
							/>
						</label>
						<label className="grid gap-1 text-[0.72rem] font-semibold tracking-[0.12em] text-subtext uppercase">
							edit code
							<input
								type="password"
								name="editCode"
								required
								autoComplete="off"
								minLength={8}
								disabled={!orchestratorReady || enqueueMutation.isPending}
								className="w-full rounded-2xl border border-white/10 bg-base/85 px-4 py-3 text-base text-text focus-visible:border-mauve/55 focus-visible:shadow-[0_0_0_4px_rgba(203,166,247,0.12)] focus-visible:outline-none disabled:opacity-60"
							/>
						</label>
					</div>
					<label className="grid gap-1 text-[0.72rem] font-semibold tracking-[0.12em] text-subtext uppercase">
						prompt
						<textarea
							name="prompt"
							required
							maxLength={500}
							rows={4}
							placeholder="a tiny goofy laser squid arena with chill music"
							disabled={!orchestratorReady || enqueueMutation.isPending}
							className="w-full resize-y rounded-2xl border border-white/10 bg-base/85 px-4 py-3 text-base leading-snug text-text focus-visible:border-mauve/55 focus-visible:shadow-[0_0_0_4px_rgba(203,166,247,0.12)] focus-visible:outline-none disabled:opacity-60"
						/>
					</label>
					<button
						type="submit"
						disabled={!orchestratorReady || enqueueMutation.isPending}
						className="inline-flex w-fit min-h-12 items-center justify-center gap-2 rounded-full bg-mauve px-6 py-3 font-bold text-base text-base transition-[transform,box-shadow,opacity] duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_28px_rgba(203,166,247,0.28)] focus-visible:outline-none disabled:opacity-65"
					>
						{enqueueMutation.isPending ? (
							<Loader2 className="size-4 animate-spin" aria-hidden="true" />
						) : (
							<Wand2 className="size-4" aria-hidden="true" />
						)}
						{enqueueMutation.isPending ? "sending…" : "enqueue build"}
					</button>
					<p className="m-0 text-[0.88rem] text-subtext">
						One enqueue per handle per UTC day. Keep it goofy; real harm and
						sandbox escapes get bounced.
					</p>
				</form>
			)}

			{activeBuildId ? (
				<div
					className="mt-8 rounded-2xl border border-white/10 bg-surface/65 px-5 py-4"
					aria-live="polite"
				>
					<h3 className="m-0 text-[0.78rem] font-semibold tracking-[0.16em] text-sky uppercase">
						build status
					</h3>
					{statusQuery.isLoading && !status ? (
						<p className="m-0 mt-2 flex items-center gap-2 text-subtext">
							<Loader2 className="size-4 animate-spin" aria-hidden="true" />
							polling…
						</p>
					) : null}
					{statusQuery.isError ? (
						<p className="m-0 mt-2 text-peach">
							could not load status. try again in a minute.
						</p>
					) : null}
					{status ? (
						<div className="mt-3 grid gap-2 text-[0.95rem]">
							<p className="m-0">
								<span className="text-subtext">status:</span>{" "}
								<strong className="text-text">
									{statusLabel(status.status)}
								</strong>
								{isInFlightStatus(status.status) ? (
									<Loader2
										className="ml-2 inline size-4 animate-spin text-sky"
										aria-hidden="true"
									/>
								) : null}
							</p>
							{status.title ? (
								<p className="m-0 text-text">
									<span className="text-subtext">title:</span> {status.title}
								</p>
							) : null}
							{status.blurb ? (
								<p className="m-0 text-subtext">{status.blurb}</p>
							) : null}
							{status.status === "live" && status.handle ? (
								<a
									href={`/community/${status.handle}/`}
									className="mt-1 inline-flex w-fit font-semibold text-sky no-underline hover:underline"
								>
									open your page →
								</a>
							) : null}
							{status.status === "rejected" ? (
								<p className="m-0 text-peach">
									{status.error ?? "that idea didn’t pass the vibe check."}
									{status.moderationNotes ? ` (${status.moderationNotes})` : ""}
								</p>
							) : null}
							{status.status === "failed" && status.error ? (
								<p className="m-0 text-peach">
									{humanizeCommunityBuildError(status.error)}
								</p>
							) : null}
						</div>
					) : null}
				</div>
			) : null}
		</section>
	);
}

type CommunityHubProps = {
	gallery?: CommunityGalleryItem[];
	galleryError?: boolean;
};

function CommunityGallery({
	initialGallery,
	initialError,
}: {
	initialGallery: CommunityGalleryItem[];
	initialError: boolean;
}) {
	const { data, isError, isPending } = useQuery({
		queryKey: ["community-gallery"],
		queryFn: fetchLiveCommunityPages,
		initialData: initialGallery.length > 0 ? initialGallery : undefined,
		staleTime: 30_000,
		retry: 1,
	});

	const gallery = data ?? initialGallery;
	const showError = (isError || initialError) && gallery.length === 0;

	return (
		<section
			className="mx-auto w-[min(1100px,calc(100%-1.5rem))] max-[820px]:w-[min(560px,calc(100%-1.2rem))] pt-4"
			aria-labelledby="community-gallery-title"
		>
			<h2
				id="community-gallery-title"
				className="m-0 mb-4 text-[0.78rem] font-semibold tracking-[0.2em] text-mauve uppercase"
			>
				community pages
			</h2>
			{showError ? (
				<p className="m-0 mb-6 text-[0.92rem] text-subtext">
					gallery could not load. Supabase may be offline or not configured.
				</p>
			) : isPending && gallery.length === 0 ? (
				<p className="m-0 mb-6 text-[0.92rem] text-subtext">loading pages…</p>
			) : gallery.length === 0 ? (
				<p className="m-0 mb-6 text-[0.92rem] text-subtext">
					no community pages yet. claim a handle below and be the first legend.
				</p>
			) : (
				<ul className="m-0 mb-8 grid list-none gap-3 p-0 sm:grid-cols-2">
					{gallery.map((item) => (
						<li key={item.handle}>
							<a
								href={`/community/${item.handle}/`}
								className="grid gap-1 rounded-2xl border border-white/10 bg-surface/60 px-4 py-3 no-underline transition-[border-color,background] hover:border-sky/45 hover:bg-surface-soft/90 focus-visible:border-sky/45 focus-visible:outline-none"
							>
								<span className="font-bold text-sky">@{item.handle}</span>
								<strong className="text-text">
									{item.title ?? "untitled build"}
								</strong>
								{item.blurb ? (
									<span className="text-[0.9rem] text-subtext">
										{item.blurb}
									</span>
								) : null}
							</a>
						</li>
					))}
				</ul>
			)}
		</section>
	);
}

export default function CommunityHub({
	gallery = [],
	galleryError = false,
}: CommunityHubProps) {
	return (
		<QueryClientProvider client={queryClient}>
			<CommunityGallery initialGallery={gallery} initialError={galleryError} />
			<CommunityHubInner />
		</QueryClientProvider>
	);
}
