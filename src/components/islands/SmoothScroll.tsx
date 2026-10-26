import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { useEffect } from "react";

gsap.registerPlugin(ScrollTrigger);

/** Buttery Lenis inertia scroll, wired into GSAP ScrollTrigger (the agency-site combo). */
export default function SmoothScroll() {
	useEffect(() => {
		const reduced = window.matchMedia(
			"(prefers-reduced-motion: reduce)",
		).matches;
		if (reduced) return;

		const lenis = new Lenis({
			duration: 1.1,
			smoothWheel: true,
			touchMultiplier: 1.35,
		});

		lenis.on("scroll", ScrollTrigger.update);

		const tick = (time: number) => {
			lenis.raf(time * 1000);
		};
		gsap.ticker.add(tick);
		gsap.ticker.lagSmoothing(0);

		const onPageLoad = () => {
			ScrollTrigger.refresh();
			lenis.resize();
		};
		document.addEventListener("astro:page-load", onPageLoad);

		return () => {
			document.removeEventListener("astro:page-load", onPageLoad);
			gsap.ticker.remove(tick);
			lenis.destroy();
			for (const trigger of ScrollTrigger.getAll()) {
				trigger.kill();
			}
		};
	}, []);

	return null;
}
