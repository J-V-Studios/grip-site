import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { useRef } from "react";
import Balancer from "react-wrap-balancer";

gsap.registerPlugin(SplitText);

/** GSAP SplitText + react-wrap-balancer — the typography flex. */
export default function BrandHeadline() {
	const titleRef = useRef<HTMLHeadingElement>(null);

	useGSAP(
		() => {
			const reduced = window.matchMedia(
				"(prefers-reduced-motion: reduce)",
			).matches;
			if (reduced || !titleRef.current) return;

			const split = SplitText.create(titleRef.current, {
				type: "chars",
				charsClass: "brand-char",
			});

			gsap.from(split.chars, {
				yPercent: 120,
				opacity: 0,
				rotateX: -40,
				stagger: 0.045,
				duration: 0.85,
				ease: "power3.out",
			});

			return () => {
				split.revert();
			};
		},
		{ scope: titleRef },
	);

	return (
		<div className="min-w-0">
			<p className="m-0 mb-3 text-[0.78rem] font-semibold tracking-[0.22em] text-mauve uppercase">
				lilgrip.com
			</p>
			<h1
				ref={titleRef}
				className="m-0 overflow-hidden font-sans text-[clamp(3rem,9vw,6.2rem)] leading-[0.9] font-bold tracking-[-0.055em]"
			>
				<span className="text-sky">lilgrip</span>
			</h1>
			<p className="mt-4 mb-0 text-[clamp(1.2rem,2.4vw,1.55rem)] font-medium text-peach">
				just a chill guy
			</p>
			<p className="mt-5 max-w-[28rem] text-[0.95rem] leading-relaxed text-subtext">
				<Balancer>
					<span className="text-teal">1 Cor 16:14</span> — Let all that you do
					be done in love. (yes, even the goofy parts.)
				</Balancer>
			</p>
		</div>
	);
}
