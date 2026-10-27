/**
 * GripApps shared runtime — apiVersion 1
 * Pure step reducer kept in sync with gripapps/runtime/reduce.ts
 */
(function (global) {
	"use strict";

	var API_VERSION = 1;

	var THEMES = {
		lilgrip_default: {
			"--color-base": "#1e1e2e",
			"--color-surface": "#262637",
			"--color-surface-soft": "#313244",
			"--color-text": "#cdd6f4",
			"--color-subtext": "#a6adc8",
			"--color-sky": "#89dceb",
			"--color-blue": "#89b4fa",
			"--color-teal": "#94e2d5",
			"--color-peach": "#fab387",
			"--color-mauve": "#cba6f7",
		},
	};

	function applySteps(ctx, steps) {
		var next = {
			state: Object.assign({}, ctx.state),
			scene: ctx.scene,
			stack: ctx.stack.slice(),
			toast: ctx.toast,
		};
		for (var i = 0; i < steps.length; i++) {
			var step = steps[i];
			if (step.op === "set") {
				next.state[step.key] = step.value;
			} else if (step.op === "goto") {
				next.scene = step.scene;
				next.stack = next.stack.concat([step.scene]);
			} else if (step.op === "back") {
				if (next.stack.length > 1) {
					next.stack = next.stack.slice(0, -1);
					next.scene = next.stack[next.stack.length - 1];
				}
			} else if (step.op === "toast") {
				next.toast = step.message;
			}
		}
		return next;
	}

	function validateIr(ir) {
		if (!ir || typeof ir !== "object") return "Missing app data";
		if (ir.apiVersion !== API_VERSION && ir.apiVersion !== API_VERSION - 1) {
			return "Unsupported apiVersion " + ir.apiVersion;
		}
		if (!ir.meta || !ir.meta.title) return "Invalid meta";
		if (!Array.isArray(ir.scenes) || ir.scenes.length === 0) {
			return "App has no scenes";
		}
		for (var s = 0; s < ir.scenes.length; s++) {
			if (!ir.scenes[s].id || !ir.scenes[s].root) {
				return "Invalid scene at index " + s;
			}
		}
		return null;
	}

	function prefersReducedMotion() {
		try {
			return global.matchMedia("(prefers-reduced-motion: reduce)").matches;
		} catch (_e) {
			return false;
		}
	}

	function injectStyles(root) {
		if (root.querySelector("[data-grip-runtime-style]")) return;
		var style = document.createElement("style");
		style.setAttribute("data-grip-runtime-style", "1");
		style.textContent =
			".grip-app{min-height:100%;box-sizing:border-box;font-family:system-ui,sans-serif}" +
			".grip-shell{display:flex;flex-direction:column;min-height:100vh;padding:1rem;gap:1rem}" +
			".grip-shell-header{font-size:1.25rem;font-weight:600;color:var(--color-sky)}" +
			".grip-blurb{color:var(--color-subtext);margin:0}" +
			".grip-stack{display:flex;flex-direction:column;gap:0.75rem}" +
			".grip-text{margin:0;line-height:1.5}" +
			".grip-btn{cursor:pointer;border:none;border-radius:0.5rem;padding:0.6rem 1rem;font-size:1rem;background:var(--color-sky);color:var(--color-base);font-weight:600}" +
			".grip-btn:focus-visible{outline:2px solid var(--color-mauve);outline-offset:2px}" +
			".grip-toast{position:fixed;bottom:1rem;left:50%;transform:translateX(-50%);background:var(--color-surface-soft);color:var(--color-text);padding:0.75rem 1.25rem;border-radius:0.5rem;box-shadow:0 4px 24px rgba(0,0,0,0.35);z-index:9999;max-width:90vw}" +
			".grip-boundary{padding:1.5rem;border-radius:0.75rem;background:var(--color-surface);border:1px solid var(--color-peach);color:var(--color-text)}" +
			".grip-boundary h2{margin:0 0 0.5rem;color:var(--color-peach)}" +
			".grip-boundary pre{white-space:pre-wrap;font-size:0.85rem;color:var(--color-subtext)}" +
			".grip-boundary button{margin-top:1rem}" +
			".grip-canvas-wrap{position:relative;display:inline-block;max-width:100%}" +
			".grip-canvas{display:block;width:100%;max-width:20rem;height:auto;border-radius:0.5rem;background:var(--color-surface-soft)}" +
			".grip-score-hud{position:absolute;top:0.5rem;left:0.5rem;padding:0.25rem 0.5rem;border-radius:0.35rem;background:rgba(0,0,0,0.45);color:var(--color-text);font-size:0.85rem;font-weight:600}" +
			".grip-particles{pointer-events:none;position:absolute;inset:0;border-radius:0.5rem;overflow:hidden}" +
			".grip-emoji-stage{font-size:4rem;line-height:1;text-align:center}" +
			".grip-image{max-width:100%;border-radius:0.5rem}" +
			".grip-raw-slot{min-height:0.5rem}" +
			(!prefersReducedMotion()
				? ".grip-scene{animation:grip-fade-in 0.2s ease}.grip-toast{transition:opacity 0.2s ease}.grip-particles::after{content:'';position:absolute;width:6px;height:6px;border-radius:50%;background:var(--color-peach);animation:grip-sparkle 1.4s ease-in-out infinite}@keyframes grip-fade-in{from{opacity:0}to{opacity:1}}@keyframes grip-sparkle{0%,100%{opacity:0.2;transform:translate(20%,60%)}50%{opacity:1;transform:translate(70%,20%)}}"
				: "");
		root.appendChild(style);
	}

	function applyTheme(root, themeName) {
		var tokens = THEMES[themeName] || THEMES.lilgrip_default;
		for (var key in tokens) {
			if (Object.prototype.hasOwnProperty.call(tokens, key)) {
				root.style.setProperty(key, tokens[key]);
			}
		}
		root.style.background = "var(--color-base)";
		root.style.color = "var(--color-text)";
	}

	function showBoundary(root, message, onRetry) {
		root.innerHTML = "";
		injectStyles(root);
		applyTheme(root, "lilgrip_default");
		var box = document.createElement("div");
		box.className = "grip-app grip-boundary";
		box.setAttribute("role", "alert");
		var h = document.createElement("h2");
		h.textContent = "Something went sideways";
		var pre = document.createElement("pre");
		pre.textContent = String(message || "Unknown error");
		var btn = document.createElement("button");
		btn.type = "button";
		btn.className = "grip-btn";
		btn.textContent = "Retry";
		btn.addEventListener("click", function () {
			if (typeof onRetry === "function") onRetry();
		});
		box.appendChild(h);
		box.appendChild(pre);
		box.appendChild(btn);
		root.appendChild(box);
	}

	function createRuntime(rootEl, ir) {
		var actionMap = {};
		if (Array.isArray(ir.actions)) {
			for (var a = 0; a < ir.actions.length; a++) {
				actionMap[ir.actions[a].id] = ir.actions[a].steps || [];
			}
		}

		var sceneMap = {};
		for (var i = 0; i < ir.scenes.length; i++) {
			sceneMap[ir.scenes[i].id] = ir.scenes[i];
		}

		var firstScene = ir.scenes[0].id;
		var snapshot = {
			state: Object.assign({}, ir.state || {}),
			scene: firstScene,
			stack: [firstScene],
			toast: null,
		};

		var toastTimer = null;
		var sceneHost = null;
		var toastEl = null;
		var slotRegistry = {};
		var canvasCleanups = [];

		function clearToastTimer() {
			if (toastTimer) {
				clearTimeout(toastTimer);
				toastTimer = null;
			}
		}

		function showToast(message) {
			if (!toastEl) {
				toastEl = document.createElement("div");
				toastEl.className = "grip-toast";
				toastEl.setAttribute("role", "status");
				rootEl.appendChild(toastEl);
			}
			toastEl.textContent = message;
			toastEl.hidden = false;
			clearToastTimer();
			toastTimer = setTimeout(function () {
				if (toastEl) toastEl.hidden = true;
			}, 3200);
		}

		function runAction(actionId) {
			var steps = actionMap[actionId];
			if (!steps) return;
			snapshot = applySteps(snapshot, steps);
			if (snapshot.toast) {
				showToast(snapshot.toast);
				snapshot.toast = null;
			}
			renderScene();
		}

		function applyHostSteps(steps) {
			snapshot = applySteps(snapshot, steps);
			if (snapshot.toast) {
				showToast(snapshot.toast);
				snapshot.toast = null;
			}
			renderScene();
		}

		function buildHostApi() {
			return {
				ui: {
					mount: function (slotName, node) {
						if (!slotName || !node) return;
						var target =
							getRegisteredSlot(slotName) ||
							rootEl.querySelector(
								'[data-grip-slot="' + slotName + '"]',
							);
						if (!target) return;
						target.innerHTML = "";
						target.appendChild(node);
					},
				},
				state: {
					get: function (key) {
						return snapshot.state[key];
					},
					set: function (key, value) {
						snapshot.state[key] = value;
						renderScene();
					},
				},
				scene: {
					goto: function (sceneId) {
						applyHostSteps([{ op: "goto", scene: sceneId }]);
					},
					back: function () {
						applyHostSteps([{ op: "back" }]);
					},
				},
				toast: function (message) {
					showToast(String(message));
				},
			};
		}

		function isAllowedRawPath(path) {
			return typeof path === "string" && path.indexOf("./raw/") === 0;
		}

		function loadRawModules() {
			var mods = ir.rawModules;
			if (!Array.isArray(mods) || mods.length === 0) return;
			var host = buildHostApi();
			for (var m = 0; m < mods.length; m++) {
				(function (mod) {
					if (!isAllowedRawPath(mod.path)) return;
					var exportName = mod.exportName;
					import(mod.path)
						.then(function (ns) {
							var fn = ns[exportName];
							if (typeof fn === "function") {
								fn(host);
							}
						})
						.catch(function (err) {
							showToast(
								"raw_module failed: " +
									(err && err.message
										? err.message
										: String(err)),
							);
						});
				})(mods[m]);
			}
		}

		function teardownCanvasLoops() {
			for (var i = 0; i < canvasCleanups.length; i++) {
				if (typeof canvasCleanups[i] === "function") {
					canvasCleanups[i]();
				}
			}
			canvasCleanups = [];
		}

		function isSlotConnected(el) {
			return el && el.isConnected;
		}

		/** Drop registry entries whose nodes were removed from the document (e.g. scene change). */
		function reconcileSlotRegistry() {
			for (var key in slotRegistry) {
				if (!isSlotConnected(slotRegistry[key])) {
					delete slotRegistry[key];
				}
			}
		}

		function getRegisteredSlot(name) {
			var el = slotRegistry[name];
			if (isSlotConnected(el)) return el;
			if (el) delete slotRegistry[name];
			return null;
		}

		function registerSlot(name, el) {
			if (name && el) slotRegistry[name] = el;
		}

		function ensureRawModuleSlots(shell) {
			var mods = ir.rawModules;
			if (!Array.isArray(mods)) return;
			for (var i = 0; i < mods.length; i++) {
				var slotName = mods[i].slot;
				if (!slotName || getRegisteredSlot(slotName)) continue;
				var slot = document.createElement("div");
				slot.className = "grip-raw-slot";
				slot.setAttribute("data-grip-slot", slotName);
				shell.appendChild(slot);
				registerSlot(slotName, slot);
			}
		}

		function renderCanvasNode(node) {
			var wrap = document.createElement("div");
			wrap.className = "grip-canvas-wrap";
			wrap.setAttribute("data-grip-canvas-wrap", "1");

			var clearColor = "#262637";
			var spriteIds = [];
			var showHud = false;
			var showParticles = false;
			var kids = node.children || [];
			for (var k = 0; k < kids.length; k++) {
				var ch = kids[k];
				if (ch.type === "clear" && ch.color) clearColor = String(ch.color);
				if (ch.type === "sprite" && ch.id) spriteIds.push(ch.id);
				if (ch.type === "score_hud") showHud = true;
				if (ch.type === "particles") showParticles = true;
			}

			var canvas = document.createElement("canvas");
			canvas.className = "grip-canvas";
			canvas.width = 320;
			canvas.height = 200;
			canvas.setAttribute("role", "img");
			canvas.setAttribute("aria-label", "play canvas");
			wrap.appendChild(canvas);

			if (showHud) {
				var hud = document.createElement("div");
				hud.className = "grip-score-hud";
				var scoreVal = snapshot.state.score;
				hud.textContent =
					"Score: " + (scoreVal != null ? String(scoreVal) : "0");
				wrap.appendChild(hud);
			}

			if (showParticles && !prefersReducedMotion()) {
				var particles = document.createElement("div");
				particles.className = "grip-particles";
				particles.setAttribute("aria-hidden", "true");
				wrap.appendChild(particles);
			}

			var ctx = canvas.getContext("2d");
			var running = true;
			function frame() {
				if (!running || !ctx) return;
				ctx.fillStyle = clearColor;
				ctx.fillRect(0, 0, canvas.width, canvas.height);
				for (var s = 0; s < spriteIds.length; s++) {
					var sid = spriteIds[s];
					var sx = Number(snapshot.state[sid + "_x"]);
					var sy = Number(snapshot.state[sid + "_y"]);
					if (!sx && sx !== 0) sx = 24 + s * 36;
					if (!sy && sy !== 0) sy = 80;
					ctx.fillStyle = "#89b4fa";
					ctx.fillRect(sx, sy, 28, 28);
				}
				if (running) global.requestAnimationFrame(frame);
			}
			canvasCleanups.push(function () {
				running = false;
			});
			frame();
			return wrap;
		}

		function renderNode(node) {
			if (!node || !node.type) return null;
			if (node.type === "stack") {
				var stack = document.createElement("div");
				stack.className = "grip-stack";
				var kids = node.children || [];
				for (var c = 0; c < kids.length; c++) {
					var child = renderNode(kids[c]);
					if (child) stack.appendChild(child);
				}
				return stack;
			}
			if (node.type === "text") {
				var p = document.createElement("p");
				p.className = "grip-text";
				p.textContent = node.value != null ? String(node.value) : "";
				return p;
			}
			if (node.type === "button") {
				var btn = document.createElement("button");
				btn.type = "button";
				btn.className = "grip-btn";
				btn.id = node.id || "";
				btn.textContent = node.label || "Button";
				var actionId = node.action;
				btn.addEventListener("click", function () {
					runAction(actionId);
				});
				return btn;
			}
			if (node.type === "canvas") {
				return renderCanvasNode(node);
			}
			if (node.type === "emoji_stage") {
				var stage = document.createElement("div");
				stage.className = "grip-emoji-stage";
				stage.textContent = node.emoji != null ? String(node.emoji) : "";
				return stage;
			}
			if (node.type === "image") {
				var img = document.createElement("img");
				img.className = "grip-image";
				img.alt = "";
				img.src = node.src != null ? String(node.src) : "";
				return img;
			}
			if (node.type === "raw_slot") {
				var slotEl = document.createElement("div");
				slotEl.className = "grip-raw-slot";
				var slotId = node.id || "";
				slotEl.setAttribute("data-grip-slot", slotId);
				registerSlot(slotId, slotEl);
				return slotEl;
			}
			if (node.type === "particles" && prefersReducedMotion()) {
				return null;
			}
			var stub = document.createElement("div");
			stub.className = "grip-stub";
			stub.hidden = true;
			stub.setAttribute("data-grip-type", node.type);
			return stub;
		}

		function renderScene() {
			var scene = sceneMap[snapshot.scene];
			if (!sceneHost) return;
			teardownCanvasLoops();
			sceneHost.innerHTML = "";
			reconcileSlotRegistry();
			sceneHost.className = "grip-scene";
			var rootNode = renderNode(scene.root);
			if (rootNode) sceneHost.appendChild(rootNode);
		}

		function mount() {
			rootEl.innerHTML = "";
			rootEl.className = "grip-app";
			slotRegistry = {};
			injectStyles(rootEl);
			var themeName =
				ir.meta && ir.meta.theme ? ir.meta.theme : "lilgrip_default";
			applyTheme(rootEl, themeName);

			var shell = document.createElement("div");
			shell.className = "grip-shell";

			var showHeader = true;
			if (
				ir.shell &&
				(ir.shell.header === false || ir.shell.header === "off")
			) {
				showHeader = false;
			}
			if (showHeader) {
				var header = document.createElement("header");
				header.className = "grip-shell-header";
				header.textContent = ir.meta.title || "Grip App";
				shell.appendChild(header);
				if (ir.meta.blurb) {
					var blurb = document.createElement("p");
					blurb.className = "grip-blurb";
					blurb.textContent = ir.meta.blurb;
					shell.appendChild(blurb);
				}
			}

			sceneHost = document.createElement("main");
			sceneHost.setAttribute("aria-live", "polite");
			shell.appendChild(sceneHost);
			ensureRawModuleSlots(shell);
			rootEl.appendChild(shell);
			renderScene();
			loadRawModules();
		}

		return {
			mount: mount,
			getSnapshot: function () {
				return snapshot;
			},
		};
	}

	var activeRoot = null;
	var errorHandlersInstalled = false;

	function installErrorHandlers() {
		if (errorHandlersInstalled) return;
		errorHandlersInstalled = true;
		global.addEventListener("error", function (ev) {
			if (!activeRoot) return;
			var msg = ev.message || "Script error";
			showBoundary(activeRoot, msg, function () {
				startApp(activeRoot);
			});
		});
		global.addEventListener("unhandledrejection", function (ev) {
			if (!activeRoot) return;
			var reason = ev.reason;
			var msg =
				reason && reason.message
					? reason.message
					: String(reason || "Unhandled promise rejection");
			showBoundary(activeRoot, msg, function () {
				startApp(activeRoot);
			});
		});
	}

	function startApp(rootEl) {
		if (!rootEl) return;
		activeRoot = rootEl;
		installErrorHandlers();
		var ir = global.__GRIP_APP__;
		var err = validateIr(ir);
		if (err) {
			showBoundary(rootEl, err, function () {
				startApp(rootEl);
			});
			return;
		}
		try {
			var rt = createRuntime(rootEl, ir);
			rt.mount();
		} catch (e) {
			showBoundary(
				rootEl,
				e && e.message ? e.message : String(e),
				function () {
					startApp(rootEl);
				},
			);
		}
	}

	global.GripApps = {
		start: startApp,
		_apiVersion: API_VERSION,
	};
})(typeof globalThis !== "undefined" ? globalThis : window);
