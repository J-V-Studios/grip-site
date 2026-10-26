import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/** GSAP ScrollTrigger reveal for explore cards — still everywhere for a reason. */
export default function ExploreMotion() {
	useGSAP(() => {
		const reduced = window.matchMedia(
			"(prefers-reduced-motion: reduce)",
		).matches;
		if (reduced) return;

		const cards = gsap.utils.toArray<HTMLElement>("[data-explore-card]");
		if (!cards.length) return;

		gsap.from(cards, {
			y: 36,
			opacity: 0,
			duration: 0.7,
			ease: "power3.out",
			stagger: 0.09,
			scrollTrigger: {
				trigger: "#explore",
				start: "top 78%",
				once: true,
			},
		});
	}, []);

	return null;
}
