import { useState } from "react";

export default function App() {
	const [clicks, setClicks] = useState(0);

	return (
		<main className="page">
			<h1>lilgrip community</h1>
			<p className="tagline">Replace this with your goofy build.</p>
			<button
				type="button"
				className="chaos"
				onClick={() => setClicks((n) => n + 1)}
			>
				deal with it ({clicks})
			</button>
		</main>
	);
}
