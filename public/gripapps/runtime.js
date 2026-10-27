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
			(!prefersReducedMotion()
				? ".grip-scene{animation:grip-fade-in 0.2s ease}.grip-toast{transition:opacity 0.2s ease}@keyframes grip-fade-in{from{opacity:0}to{opacity:1}}"
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
			sceneHost.innerHTML = "";
			sceneHost.className = "grip-scene";
			var rootNode = renderNode(scene.root);
			if (rootNode) sceneHost.appendChild(rootNode);
		}

		function mount() {
			rootEl.innerHTML = "";
			rootEl.className = "grip-app";
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
			rootEl.appendChild(shell);
			renderScene();
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
