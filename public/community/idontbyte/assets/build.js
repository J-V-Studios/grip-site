/** Tiny 8×8 block plot. Stacks stay in this browser only. */

import {
	BLOCKS,
	COLS,
	MAX_HEIGHT,
	ROWS,
	blockById,
	countBlocks,
	parsePlot,
	sanitizeName,
} from "./logic.js";

const PLOT_KEY = "idontbyte-chill-harbor-plot-v1";

export function mountBuild() {
	const form = document.querySelector("#plot-form");
	const nameInput = document.querySelector("#plot-name");
	const palette = document.querySelector("#palette");
	const plot = document.querySelector("#plot");
	const placeBtn = document.querySelector("#mode-place");
	const scoopBtn = document.querySelector("#mode-scoop");
	const clearBtn = document.querySelector("#clear-plot");
	const countEl = document.querySelector("#plot-count");
	const status = document.querySelector("#plot-status");

	const saved = loadPlot();
	const columns = saved.columns;
	let selected = BLOCKS[0].id;
	let mode = "place";
	let clearArmedUntil = 0;

	nameInput.value = saved.name;

	for (const block of BLOCKS) {
		const button = document.createElement("button");
		button.type = "button";
		button.className = "swatch-btn";
		button.setAttribute("role", "radio");
		button.dataset.block = String(block.id);
		button.setAttribute("aria-checked", block.id === selected ? "true" : "false");
		button.innerHTML = `<span class="swatch" style="background:${block.top};box-shadow:inset 0 -3px 0 ${block.side}"></span><span>${block.name}</span>`;
		button.addEventListener("click", () => selectBlock(block.id));
		palette.append(button);
	}

	for (let r = 0; r < ROWS; r++) {
		for (let c = 0; c < COLS; c++) {
			const button = document.createElement("button");
			button.type = "button";
			button.className = "plot-cell";
			button.dataset.r = String(r);
			button.dataset.c = String(c);
			button.addEventListener("click", () => act(r, c));
			button.addEventListener("keydown", (event) => moveFocus(event, r, c));
			plot.append(button);
			paintCell(r, c);
		}
	}

	function loadPlot() {
		try {
			const raw = localStorage.getItem(PLOT_KEY);
			if (!raw) return parsePlot(null);
			return parsePlot(JSON.parse(raw));
		} catch {
			return parsePlot(null);
		}
	}

	function save() {
		const data = { name: sanitizeName(nameInput.value), columns };
		try {
			localStorage.setItem(PLOT_KEY, JSON.stringify(data));
		} catch {
			/* private mode */
		}
	}

	function selectBlock(id) {
		selected = id;
		for (const button of palette.querySelectorAll("button")) {
			button.setAttribute("aria-checked", button.dataset.block === String(id) ? "true" : "false");
		}
		announce();
	}

	function setMode(next) {
		mode = next;
		placeBtn.setAttribute("aria-pressed", String(next === "place"));
		scoopBtn.setAttribute("aria-pressed", String(next === "scoop"));
		announce();
	}

	function paintCell(r, c) {
		const button = plot.querySelector(`[data-r="${r}"][data-c="${c}"]`);
		const stack = columns[r][c];
		if (stack.length === 0) {
			button.innerHTML = `<span class="empty" aria-hidden="true">+</span>`;
			button.setAttribute("aria-label", `row ${r + 1}, column ${c + 1}, empty`);
			return;
		}
		const slabs = stack
			.map((id) => {
				const block = blockById(id);
				return `<i class="slab" data-kind="${id}" style="background:${block.top};box-shadow:inset 0 -2px 0 ${block.side}"></i>`;
			})
			.join("");
		button.innerHTML = `<span class="stack">${slabs}</span>`;
		const top = blockById(stack[stack.length - 1]);
		button.setAttribute(
			"aria-label",
			`row ${r + 1}, column ${c + 1}, ${stack.length} high, top ${top.name}`,
		);
	}

	function announce(extra) {
		const total = countBlocks(columns);
		const block = blockById(selected);
		const verb = mode === "place" ? `placing ${block.name}` : "scooping";
		const amount = total === 0 ? "empty plot" : `${total} block${total === 1 ? "" : "s"}`;
		countEl.textContent = `${verb} · ${amount}`;
		if (extra) status.textContent = extra;
	}

	function act(r, c) {
		const stack = columns[r][c];
		if (mode === "place") {
			if (stack.length >= MAX_HEIGHT) {
				announce("that stack's full — six is the chill limit");
				return;
			}
			stack.push(selected);
			announce(`placed ${blockById(selected).name}`);
		} else if (stack.length === 0) {
			announce("nothing there to scoop");
			return;
		} else {
			const removed = blockById(stack.pop());
			announce(`scooped ${removed.name}`);
		}
		paintCell(r, c);
		save();
	}

	function moveFocus(event, r, c) {
		const delta = {
			ArrowLeft: [0, -1],
			ArrowRight: [0, 1],
			ArrowUp: [-1, 0],
			ArrowDown: [1, 0],
		}[event.key];
		if (!delta) return;
		const nr = r + delta[0];
		const nc = c + delta[1];
		if (nr < 0 || nc < 0 || nr >= ROWS || nc >= COLS) return;
		event.preventDefault();
		plot.querySelector(`[data-r="${nr}"][data-c="${nc}"]`)?.focus();
	}

	function resetClearLabel() {
		clearBtn.textContent = "clear plot";
	}

	placeBtn.addEventListener("click", () => setMode("place"));
	scoopBtn.addEventListener("click", () => setMode("scoop"));
	clearBtn.addEventListener("click", () => {
		if (countBlocks(columns) === 0) {
			announce("plot is already clear");
			return;
		}
		const now = Date.now();
		if (now > clearArmedUntil) {
			clearArmedUntil = now + 2400;
			clearBtn.textContent = "tap again to clear";
			window.setTimeout(() => {
				if (Date.now() >= clearArmedUntil) resetClearLabel();
			}, 2500);
			announce("tap clear once more to wipe the plot");
			return;
		}
		clearArmedUntil = 0;
		for (const row of columns) {
			for (const stack of row) stack.length = 0;
		}
		for (let r = 0; r < ROWS; r++) {
			for (let c = 0; c < COLS; c++) paintCell(r, c);
		}
		resetClearLabel();
		save();
		announce("plot cleared");
	});

	form.addEventListener("submit", (event) => event.preventDefault());
	nameInput.addEventListener("input", () => {
		const clean = sanitizeName(nameInput.value);
		if (clean !== nameInput.value) {
			const pos = nameInput.selectionStart ?? clean.length;
			nameInput.value = clean;
			nameInput.setSelectionRange(pos, pos);
		}
		save();
	});

	announce();
}
