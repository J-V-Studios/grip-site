export type BootHtmlOptions = {
	handle: string;
	version: string;
	title?: string;
};

function escapeHtml(value: string): string {
	return value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

export function renderBootHtml(opts: BootHtmlOptions): string {
	const handle = escapeHtml(opts.handle);
	const title = escapeHtml(opts.title?.trim() || "Grip App");
	const cdn = escapeHtml(
		`https://lilgrip.com/gripapps/runtime.js?v=${encodeURIComponent(opts.version)}`,
	);
	const vendor = "./vendor/gripapps/runtime.js";

	return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
</head>
<body>
  <div id="grip-root" data-grip-handle="${handle}"></div>
  <script>
    (function () {
      var root = document.getElementById("grip-root");
      function showBootError(message) {
        if (!root) return;
        root.textContent = "";
        var box = document.createElement("div");
        box.className = "grip-boundary";
        box.setAttribute("role", "alert");
        var h = document.createElement("h2");
        h.textContent = "This page could not start";
        var p = document.createElement("p");
        p.textContent = message;
        box.appendChild(h);
        box.appendChild(p);
        root.appendChild(box);
      }
      function start() {
        if (globalThis.GripApps && typeof globalThis.GripApps.start === "function") {
          globalThis.GripApps.start(root);
          return;
        }
        showBootError("GripApps runtime did not start");
      }
      function loadApp() {
        var s = document.createElement("script");
        s.type = "module";
        s.src = "./app.grip.js";
        s.onload = start;
        s.onerror = function () {
          showBootError("Could not load app.grip.js");
        };
        document.body.appendChild(s);
      }
      var rt = document.createElement("script");
      rt.src = "${cdn}";
      rt.onerror = function () {
        var fallback = document.createElement("script");
        fallback.src = "${vendor}";
        fallback.onload = loadApp;
        fallback.onerror = function () {
          showBootError("Could not load the GripApps runtime");
        };
        document.body.appendChild(fallback);
      };
      rt.onload = loadApp;
      document.body.appendChild(rt);
    })();
  </script>
</body>
</html>
`;
}
