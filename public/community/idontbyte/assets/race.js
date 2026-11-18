/** Top-down blocky boat race. The river scrolls; the boat only steers. */

import {
	BLOCK,
	coinForRow,
	containBoat,
	hash32,
	moodLine,
	riverAt,
} from "./logic.js";

const BEST_KEY = "idontbyte-chill-harbor-best-v1";
const BOAT_FROM_BOTTOM = 0.3;

export function mountRace() {
	const canvas = document.querySelector("#race");
	const stats = document.querySelector("#race-stats");
	const live = document.querySelector("#race-live");
	const shove = document.querySelector("#shove");
	const pauseBtn = document.querySelector("#pause");
	const port = document.querySelector("#port");
	const starboard = document.querySelector("#starboard");
	const panel = document.querySelector("#panel-race");
	const ctx = canvas.getContext("2d");
	if (!ctx) return { show() {}, hide() {} };

	const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
	const steer = {
		left: false,
		right: false,
		keyLeft: false,
		keyRight: false,
		pointer: 0,
	};

	let viewW = 640;
	let viewH = 420;
	let cameraDist = 0;
	let boatX = 0.5;
	let vx = 0;
	let coins = 0;
	let phase = "ready";
	let slowTimer = 0;
	let bumpCooldown = 0;
	let flavor = "";
	let flavorUntil = 0;
	let best = loadBest();
	let bestDirty = false;
	let lastAnnounce = 0;
	let lastFlush = 0;
	let raf = 0;
	let lastTime = 0;
	const collected = new Set();

	function loadBest() {
		try {
			const n = Number(localStorage.getItem(BEST_KEY));
			return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
		} catch {
			return 0;
		}
	}

	function scoreNow() {
		return Math.floor(cameraDist / BLOCK) + coins * 8;
	}

	function noteScore() {
		const score = scoreNow();
		if (score > best) {
			best = score;
			bestDirty = true;
		}
	}

	function flushBest() {
		if (!bestDirty) return;
		bestDirty = false;
		try {
			localStorage.setItem(BEST_KEY, String(best));
		} catch {
			/* private mode */
		}
	}

	function setFlavor(text, ms = 1400) {
		flavor = text;
		flavorUntil = performance.now() + ms;
	}

	function steerAxis() {
		let axis = 0;
		if (steer.left || steer.keyLeft) axis -= 1;
		if (steer.right || steer.keyRight) axis += 1;
		axis += steer.pointer;
		return Math.max(-1, Math.min(1, axis));
	}

	function fit() {
		const rect = canvas.getBoundingClientRect();
		if (rect.width < 10 || rect.height < 10) return;
		const dpr = Math.min(window.devicePixelRatio || 1, 2);
		const w = Math.round(rect.width);
		const h = Math.round(rect.height);
		const pw = Math.round(w * dpr);
		const ph = Math.round(h * dpr);
		if (canvas.width !== pw || canvas.height !== ph) {
			canvas.width = pw;
			canvas.height = ph;
		}
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		viewW = w;
		viewH = h;
	}

	function boatDist() {
		return cameraDist + viewH * BOAT_FROM_BOTTOM;
	}

	function stepSteer(dt) {
		const axis = steerAxis();
		vx += axis * 2.6 * dt;
		vx *= Math.exp(-4.2 * dt);
		vx = Math.max(-0.9, Math.min(0.9, vx));
		boatX += vx * dt;
		const before = boatX;
		const contained = containBoat(boatX, boatDist());
		boatX = contained.x;
		if (contained.bumped) {
			if ((before < contained.x && vx < 0) || (before > contained.x && vx > 0)) {
				vx = 0;
			}
			if (bumpCooldown <= 0 && phase === "racing") {
				bumpCooldown = 0.75;
				slowTimer = 0.4;
				setFlavor("nudged back into the channel");
			}
		}
	}

	function step(dt, now) {
		stepSteer(dt);
		bumpCooldown = Math.max(0, bumpCooldown - dt);
		if (phase !== "racing") return;
		slowTimer = Math.max(0, slowTimer - dt);
		const pace = (128 + Math.min(170, cameraDist * 0.03)) * (slowTimer > 0 ? 0.5 : 1);
		cameraDist += pace * dt;
		const dist = boatDist();
		const row0 = Math.floor((cameraDist - BLOCK) / BLOCK);
		const row1 = Math.floor((cameraDist + viewH) / BLOCK) + 1;
		for (let row = row0; row <= row1; row++) {
			const coin = coinForRow(row);
			if (!coin || collected.has(coin.id)) continue;
			if (
				Math.abs(coin.dist - dist) < BLOCK * 0.55 &&
				Math.abs(coin.nx - boatX) < 0.07
			) {
				collected.add(coin.id);
				coins += 1;
				setFlavor("coin in the cooler", 900);
			}
		}
		if (collected.size > 240) {
			const min = Math.floor(cameraDist / BLOCK) - 8;
			for (const id of collected) {
				if (id < min) collected.delete(id);
			}
		}
		noteScore();
		if (now - lastFlush > 800) {
			flushBest();
			lastFlush = now;
		}
		if (now - lastAnnounce > 1600) {
			const blocks = Math.floor(cameraDist / BLOCK);
			live.textContent = `${blocks} blocks downriver, ${coins} ${coins === 1 ? "coin" : "coins"}. ${moodLine(blocks)}`;
			lastAnnounce = now;
		}
	}

	function paintStats(now) {
		const blocks = Math.floor(cameraDist / BLOCK);
		const shownBest = Math.max(best, scoreNow());
		let line = "harbor's calm";
		if (phase === "ready") {
			line = shownBest > 0 ? `harbor's calm · best ${shownBest}` : "harbor's calm";
		} else {
			const coinWord = coins === 1 ? "coin" : "coins";
			const paused = phase === "paused" ? "paused · " : "";
			line = `${paused}${blocks} blocks · ${coins} ${coinWord} · best ${shownBest}`;
		}
		if (flavor && now >= flavorUntil) flavor = "";
		stats.textContent = flavor ? `${flavor} · ${line}` : line;
	}

	function drawBlock(x, y, size, top, side) {
		ctx.fillStyle = top;
		ctx.fillRect(x, y, size + 0.6, size + 0.6);
		ctx.fillStyle = side;
		ctx.fillRect(x, y + size - 5, size + 0.6, 5);
		ctx.fillRect(x + size - 4, y, 4, size);
	}

	function draw(now) {
		fit();
		const reduce = reduceMotion.matches;
		const block = viewW / 12;
		ctx.clearRect(0, 0, viewW, viewH);
		const firstRow = Math.floor(cameraDist / block) - 1;
		const lastRow = firstRow + Math.ceil(viewH / block) + 3;
		for (let row = lastRow; row >= firstRow; row--) {
			const dist = row * block;
			const y = viewH - (dist - cameraDist) - block;
			const river = riverAt(dist + block / 2);
			const cols = 12;
			for (let col = 0; col < cols; col++) {
				const nx = (col + 0.5) / cols;
				const x = col * block;
				const inWater = nx > river.left && nx < river.right;
				const pier =
					dist < 220 &&
					dist > 24 &&
					nx > river.left - 0.02 &&
					nx < river.left + 0.07 &&
					(row + col) % 2 === 0;
				const h = hash32(row * 131 + col * 17);
				if (pier) {
					drawBlock(x, y, block, h % 2 ? "#e6c89a" : "#d7b48a", "#a6845c");
				} else if (inWater) {
					const alt = (row + col) % 2 === 0;
					drawBlock(x, y, block, alt ? "#4aa3c7" : "#3d90b4", "#2f7494");
					if (!reduce) {
						const shine = 0.05 + 0.05 * Math.sin(now * 0.002 + row * 0.6 + col);
						ctx.fillStyle = `rgba(255,255,255,${shine})`;
						ctx.fillRect(x + 4, y + 4, block * 0.35, 3);
					}
				} else {
					drawBlock(x, y, block, h % 3 === 0 ? "#8fce7a" : "#7dbe68", "#5d8f4e");
					if (h % 17 === 0) {
						ctx.fillStyle = h % 2 === 0 ? "#fab387" : "#cba6f7";
						ctx.fillRect(x + block * 0.35, y + block * 0.28, 5, 5);
					}
				}
			}
		}

		const rowStart = Math.floor(cameraDist / BLOCK) - 1;
		const rowEnd = Math.floor((cameraDist + viewH) / BLOCK) + 2;
		for (let row = rowStart; row <= rowEnd; row++) {
			const coin = coinForRow(row);
			if (!coin || collected.has(coin.id)) continue;
			const cy = viewH - (coin.dist - cameraDist);
			const cx = coin.nx * viewW;
			if (cy < -20 || cy > viewH + 20) continue;
			ctx.fillStyle = "#f9e2af";
			ctx.beginPath();
			ctx.arc(cx, cy, Math.max(7, block * 0.22), 0, Math.PI * 2);
			ctx.fill();
			ctx.lineWidth = 2;
			ctx.strokeStyle = "#df8e1d";
			ctx.stroke();
		}

		const bob = reduce ? 0 : Math.sin(now * 0.004) * (phase === "racing" ? 1.4 : 3);
		drawBoat(viewW * boatX, viewH * (1 - BOAT_FROM_BOTTOM) + bob, block, phase === "racing" && !reduce);
		paintStats(now);
	}

	function drawBoat(x, y, block, wake) {
		const s = block / 36;
		ctx.save();
		ctx.translate(x, y);
		ctx.scale(s, s);
		if (wake) {
			ctx.strokeStyle = "rgba(205, 214, 244, 0.45)";
			ctx.lineWidth = 2;
			ctx.beginPath();
			ctx.moveTo(-10, 20);
			ctx.lineTo(-18, 34);
			ctx.moveTo(10, 20);
			ctx.lineTo(18, 34);
			ctx.stroke();
		}
		ctx.fillStyle = "rgba(17, 17, 27, 0.28)";
		ctx.beginPath();
		ctx.ellipse(0, 18, 16, 5, 0, 0, Math.PI * 2);
		ctx.fill();
		ctx.fillStyle = "#e6c89a";
		ctx.beginPath();
		ctx.moveTo(0, -24);
		ctx.lineTo(16, 6);
		ctx.quadraticCurveTo(12, 20, 0, 18);
		ctx.quadraticCurveTo(-12, 20, -16, 6);
		ctx.closePath();
		ctx.fill();
		ctx.fillStyle = "#b5835a";
		ctx.fillRect(-9, -2, 18, 12);
		ctx.strokeStyle = "#8d6a43";
		ctx.lineWidth = 2;
		ctx.beginPath();
		ctx.moveTo(0, -4);
		ctx.lineTo(0, -30);
		ctx.stroke();
		ctx.fillStyle = "#89dceb";
		ctx.beginPath();
		ctx.moveTo(0, -30);
		ctx.lineTo(16, -22);
		ctx.lineTo(0, -16);
		ctx.closePath();
		ctx.fill();
		ctx.restore();
	}

	function frame(now) {
		raf = requestAnimationFrame(frame);
		const dt = Math.min(0.05, lastTime ? (now - lastTime) / 1000 : 0);
		lastTime = now;
		if (!panel.hidden) {
			step(dt, now);
			draw(now);
		}
	}

	function show() {
		if (raf) return;
		lastTime = 0;
		raf = requestAnimationFrame(frame);
		fit();
	}

	function hide() {
		if (phase === "racing") setPhase("paused");
		flushBest();
		cancelAnimationFrame(raf);
		raf = 0;
	}

	function setPhase(next) {
		phase = next;
		const racing = next === "racing";
		shove.hidden = next !== "ready";
		pauseBtn.hidden = next === "ready";
		pauseBtn.textContent = racing ? "hold up" : "keep going";
		pauseBtn.setAttribute("aria-pressed", String(next === "paused"));
		if (next === "ready") {
			live.textContent = "Ready at the dock. Shove off when you want.";
		}
	}

	function bindHold(button, key) {
		const down = (event) => {
			if (event.pointerType === "mouse" && event.button !== 0) return;
			event.preventDefault();
			steer[key] = true;
			try {
				button.setPointerCapture(event.pointerId);
			} catch {
				/* pointer already released */
			}
		};
		const up = () => {
			steer[key] = false;
		};
		button.addEventListener("pointerdown", down);
		button.addEventListener("pointerup", up);
		button.addEventListener("pointercancel", up);
	}

	bindHold(port, "left");
	bindHold(starboard, "right");

	canvas.addEventListener("pointerdown", (event) => {
		const rect = canvas.getBoundingClientRect();
		steer.pointer = event.clientX - rect.left < rect.width / 2 ? -1 : 1;
		try {
			canvas.setPointerCapture(event.pointerId);
		} catch {
			/* pointer already released */
		}
		if (phase === "ready") setPhase("racing");
	});
	canvas.addEventListener("pointerup", () => {
		steer.pointer = 0;
	});
	canvas.addEventListener("pointercancel", () => {
		steer.pointer = 0;
	});

	shove.addEventListener("click", () => setPhase("racing"));
	pauseBtn.addEventListener("click", () => {
		if (phase === "racing") setPhase("paused");
		else if (phase === "paused") setPhase("racing");
		flushBest();
	});

	window.addEventListener("keydown", (event) => {
		if (!(event.target instanceof Element)) return;
		if (event.target.closest("input, textarea, .tabs")) return;
		if (panel.hidden) return;
		if (event.key === "ArrowLeft" || event.key === "a" || event.key === "A") {
			steer.keyLeft = true;
			event.preventDefault();
		} else if (event.key === "ArrowRight" || event.key === "d" || event.key === "D") {
			steer.keyRight = true;
			event.preventDefault();
		} else if (event.key === " " && event.target.closest("button")) {
			return;
		} else if (event.key === " ") {
			event.preventDefault();
			if (phase === "ready") setPhase("racing");
			else setPhase(phase === "racing" ? "paused" : "racing");
		}
	});
	window.addEventListener("keyup", (event) => {
		if (event.key === "ArrowLeft" || event.key === "a" || event.key === "A") {
			steer.keyLeft = false;
		} else if (event.key === "ArrowRight" || event.key === "d" || event.key === "D") {
			steer.keyRight = false;
		}
	});
	window.addEventListener("blur", () => {
		steer.keyLeft = false;
		steer.keyRight = false;
		steer.pointer = 0;
	});
	document.addEventListener("visibilitychange", () => {
		if (document.hidden && phase === "racing") setPhase("paused");
		flushBest();
	});
	window.addEventListener("pagehide", flushBest);
	window.addEventListener("resize", fit);

	setPhase("ready");
	show();

	return { show, hide };
}
