/** Chill Harbor shell: boat-race tab and block-plot tab. */

import { mountBuild } from "./build.js";
import { mountRace } from "./race.js";

const tabRace = document.querySelector("#tab-race");
const tabBuild = document.querySelector("#tab-build");
const panelRace = document.querySelector("#panel-race");
const panelBuild = document.querySelector("#panel-build");
const tablist = document.querySelector(".tabs");

const race = mountRace();
mountBuild();

function selectTab(which) {
	const showRace = which === "race";
	tabRace.setAttribute("aria-selected", String(showRace));
	tabBuild.setAttribute("aria-selected", String(!showRace));
	tabRace.tabIndex = showRace ? 0 : -1;
	tabBuild.tabIndex = showRace ? -1 : 0;
	panelRace.hidden = !showRace;
	panelBuild.hidden = showRace;
	if (showRace) race.show();
	else race.hide();
}

tabRace.addEventListener("click", () => selectTab("race"));
tabBuild.addEventListener("click", () => selectTab("build"));

tablist.addEventListener("keydown", (event) => {
	if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
	event.preventDefault();
	const order = ["race", "build"];
	const current = tabRace.getAttribute("aria-selected") === "true" ? 0 : 1;
	const dir = event.key === "ArrowRight" ? 1 : -1;
	const which = order[(current + dir + order.length) % order.length];
	selectTab(which);
	(which === "build" ? tabBuild : tabRace).focus();
});

selectTab("race");
