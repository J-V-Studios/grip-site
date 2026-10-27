export type BootHtmlOptions = {
	handle: string;
	version: string;
};

export function renderBootHtml(opts: BootHtmlOptions): string {
	const { version } = opts;
	const cdn = `https://lilgrip.com/gripapps/runtime.js?v=${encodeURIComponent(version)}`;
	const vendor = "./vendor/gripapps/runtime.js";

	return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Grip App</title>
</head>
<body>
  <div id="grip-root"></div>
  <script>
    (function () {
      var root = document.getElementById("grip-root");
      function start() {
        if (globalThis.GripApps && typeof globalThis.GripApps.start === "function") {
          globalThis.GripApps.start(root);
        }
      }
      function loadApp() {
        var s = document.createElement("script");
        s.type = "module";
        s.src = "./app.grip.js";
        s.onload = start;
        document.body.appendChild(s);
      }
      var rt = document.createElement("script");
      rt.src = "${cdn}";
      rt.onerror = function () {
        var fallback = document.createElement("script");
        fallback.src = "${vendor}";
        fallback.onload = loadApp;
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
