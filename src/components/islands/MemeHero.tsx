import { motion, useReducedMotion } from "motion/react";

/** Motion-powered meme float — the default React animation library in 2026. */
export default function MemeHero() {
	const reduce = useReducedMotion();

	return (
		<figure className="m-0 justify-self-center min-[821px]:justify-self-end">
			<motion.div
				className="relative w-[min(420px,78vw)] overflow-hidden rounded-[2rem] border border-white/15 bg-surface-soft shadow-[0_28px_80px_rgba(0,0,0,0.45)]"
				initial={reduce ? false : { opacity: 0, y: 28, rotate: -4 }}
				animate={
					reduce
						? { opacity: 1, y: 0, rotate: 0 }
						: {
								opacity: 1,
								y: [0, -14, 0],
								rotate: [-1.5, 2, -1.5],
							}
				}
				transition={
					reduce
						? { duration: 0.2 }
						: {
								opacity: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
								y: {
									duration: 5.5,
									repeat: Number.POSITIVE_INFINITY,
									ease: "easeInOut",
								},
								rotate: {
									duration: 5.5,
									repeat: Number.POSITIVE_INFINITY,
									ease: "easeInOut",
								},
							}
				}
				whileHover={reduce ? undefined : { scale: 1.03 }}
			>
				<img
					src="/images/lilgrip-meme.png"
					width={945}
					height={945}
					alt="lilgrip meme face with pixel sunglasses"
					className="aspect-square w-full object-cover"
					decoding="async"
				/>
				<span
					className="pointer-events-none absolute inset-y-[12%] -left-[20%] w-[40%] skew-x-[-18deg] bg-gradient-to-r from-transparent via-white/55 to-transparent opacity-40 motion-safe:animate-[glint_4.8s_ease-in-out_infinite]"
					aria-hidden="true"
				/>
			</motion.div>
			<figcaption className="mt-3 text-center text-[0.75rem] font-semibold tracking-[0.16em] text-subtext uppercase min-[821px]:text-right">
				official face of chill
			</figcaption>
		</figure>
	);
}
