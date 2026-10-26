import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const db = createClient(
  "https://lendvtrjkehanndudjfd.supabase.co",
  "sb_publishable_3YWB0mRTB__4zo5xNtuFoQ__r2yX6xf"
);

const POINTS_PER_SIGHTING = 10;
const HUNTER_KEY = "lilgrip-hunter";
const BUCKET = "grip-sightings";

const form = document.querySelector("#note-form");
const list = document.querySelector("#note-list");
const hint = document.querySelector(".notes .hint");
const sightingForm = document.querySelector("#sighting-form");
const sightingList = document.querySelector("#sighting-list");
const leaderboard = document.querySelector("#leaderboard");
const sightingHint = document.querySelector("#sighting-hint");
const myPoints = document.querySelector("#my-points");
const hunterInput = document.querySelector("#hunter-name");
const photoInput = document.querySelector('input[name="photo"]');
const photoLabel = document.querySelector("#photo-label");
const navCards = document.querySelectorAll(".nav-card");
const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function clean(value, max) {
  return value.replace(/\s+/g, " ").trim().slice(0, max);
}

function savedHunter() {
  try {
    return localStorage.getItem(HUNTER_KEY) || "";
  } catch {
    return "";
  }
}

function rememberHunter(name) {
  try {
    localStorage.setItem(HUNTER_KEY, name);
  } catch {
    /* ignore */
  }
}

if (hunterInput) {
  const known = savedHunter();
  if (known) hunterInput.value = known;
}

if (photoInput && photoLabel) {
  photoInput.addEventListener("change", () => {
    const file = photoInput.files && photoInput.files[0];
    photoLabel.textContent = file ? file.name : "take or choose a photo";
  });
}

if (!reduced && navCards.length) {
  navCards.forEach((card, index) => {
    card.style.setProperty("--delay", `${0.05 + index * 0.05}s`);
    card.style.animationDelay = `${0.08 + index * 0.06}s`;
  });
}

async function loadNotes() {
  const { data, error } = await db
    .from("lilgrip_comments")
    .select("id,name,body")
    .order("created_at", { ascending: false })
    .limit(40);
  if (error) throw error;
  return data || [];
}

function renderNotes(notes) {
  if (!list) return;
  list.replaceChildren();
  if (!notes.length) {
    const empty = document.createElement("li");
    empty.className = "empty";
    empty.textContent = "no notes yet. say hey to the lilgriper.";
    list.append(empty);
    return;
  }
  for (const note of notes) {
    const item = document.createElement("li");
    item.className = "note-card";
    const name = document.createElement("strong");
    name.textContent = note.name;
    const body = document.createElement("p");
    body.textContent = note.body;
    item.append(name, body);
    list.append(item);
  }
}

async function refreshNotes() {
  if (!list) return;
  try {
    renderNotes(await loadNotes());
  } catch {
    if (hint) hint.textContent = "notes could not load. try again in a minute.";
  }
}

if (form) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const body = clean(String(data.get("body") || ""), 200);
    if (!body) return;
    const name = clean(String(data.get("name") || ""), 24) || "anon";
    const button = form.querySelector("button");
    if (button) button.disabled = true;
    const { error } = await db.from("lilgrip_comments").insert({ name, body });
    if (button) button.disabled = false;
    if (error) {
      if (hint) hint.textContent = "that note did not post. try again.";
      return;
    }
    if (hint) hint.textContent = "everyone can see these notes.";
    form.reset();
    refreshNotes();
  });
}

function photoUrl(path) {
  return db.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

function extFor(file) {
  const fromName = (file.name.split(".").pop() || "").toLowerCase();
  if (["jpg", "jpeg", "png", "webp", "heic", "heif"].includes(fromName)) {
    return fromName === "jpeg" ? "jpg" : fromName;
  }
  const map = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/heic": "heic",
    "image/heif": "heif",
  };
  return map[file.type] || "jpg";
}

async function loadSightings() {
  const { data, error } = await db
    .from("grip_sightings")
    .select("id,hunter,place,photo_path,points,created_at")
    .order("created_at", { ascending: false })
    .limit(24);
  if (error) throw error;
  return data || [];
}

function renderSightings(rows) {
  if (!sightingList) return;
  sightingList.replaceChildren();
  if (!rows.length) {
    const empty = document.createElement("li");
    empty.className = "empty";
    empty.textContent = "no sightings yet. if you see the lilgriper, log it.";
    sightingList.append(empty);
    return;
  }
  for (const row of rows) {
    const item = document.createElement("li");
    item.className = "sighting-card";
    const img = document.createElement("img");
    img.src = photoUrl(row.photo_path);
    img.alt = "grip sighting by " + row.hunter;
    img.loading = "lazy";
    const meta = document.createElement("div");
    const who = document.createElement("strong");
    who.textContent = row.hunter;
    const place = document.createElement("p");
    place.textContent = row.place || "somewhere out there";
    const pts = document.createElement("span");
    pts.className = "pts";
    pts.textContent = "+" + row.points + " grip";
    meta.append(who, place, pts);
    item.append(img, meta);
    sightingList.append(item);
  }
}

function renderLeaderboard(rows) {
  if (!leaderboard) return;
  const totals = new Map();
  for (const row of rows) {
    totals.set(row.hunter, (totals.get(row.hunter) || 0) + row.points);
  }
  const ranked = [...totals.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 10);
  leaderboard.replaceChildren();
  if (!ranked.length) {
    const empty = document.createElement("li");
    empty.className = "empty";
    empty.textContent = "no grip points yet.";
    leaderboard.append(empty);
    return;
  }
  ranked.forEach(([hunter, points], index) => {
    const item = document.createElement("li");
    item.className = "board-row";
    const rank = document.createElement("span");
    rank.className = "rank";
    rank.textContent = String(index + 1);
    const name = document.createElement("strong");
    name.textContent = hunter;
    const score = document.createElement("span");
    score.className = "score";
    score.textContent = points + " pts";
    item.append(rank, name, score);
    leaderboard.append(item);
  });

  const me = clean(hunterInput?.value || savedHunter() || "", 24) || "anon";
  if (myPoints) myPoints.textContent = String(totals.get(me) || 0);
}

async function refreshSightings() {
  if (!sightingList && !leaderboard) return;
  try {
    const rows = await loadSightings();
    renderSightings(rows);
    renderLeaderboard(rows);
  } catch {
    if (sightingHint) sightingHint.textContent = "sightings could not load. try again in a minute.";
  }
}

if (sightingForm) {
  sightingForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(sightingForm);
    const hunter = clean(String(data.get("hunter") || ""), 24) || "anon";
    const place = clean(String(data.get("place") || ""), 80);
    const file = data.get("photo");
    if (!(file instanceof File) || !file.size) {
      if (sightingHint) sightingHint.textContent = "add a photo of the lilgriper first.";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      if (sightingHint) sightingHint.textContent = "keep the photo under 5MB.";
      return;
    }

    const button = sightingForm.querySelector('button[type="submit"]');
    if (button) {
      button.disabled = true;
      button.textContent = "uploading…";
    }
    if (sightingHint) sightingHint.textContent = "logging your grip sighting…";

    const path = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}.${extFor(file)}`;
    const { error: uploadError } = await db.storage.from(BUCKET).upload(path, file, {
      cacheControl: "3600",
      contentType: file.type || "image/jpeg",
      upsert: false,
    });

    if (uploadError) {
      if (button) {
        button.disabled = false;
        button.textContent = "log sighting · +10";
      }
      if (sightingHint) sightingHint.textContent = "photo upload failed. try a smaller jpg or png.";
      return;
    }

    const { error } = await db.from("grip_sightings").insert({
      hunter,
      place,
      photo_path: path,
      points: POINTS_PER_SIGHTING,
    });

    if (button) {
      button.disabled = false;
      button.textContent = "log sighting · +10";
    }

    if (error) {
      if (sightingHint) sightingHint.textContent = "sighting did not save. try again.";
      return;
    }

    rememberHunter(hunter);
    if (hunterInput) hunterInput.value = hunter;
    sightingForm.reset();
    if (hunterInput) hunterInput.value = hunter;
    if (photoLabel) photoLabel.textContent = "take or choose a photo";
    if (sightingHint) sightingHint.textContent = "+10 grip points locked in. nice find.";
    refreshSightings();
  });
}

if (hunterInput) {
  hunterInput.addEventListener("change", () => {
    const name = clean(hunterInput.value || "", 24);
    if (name) rememberHunter(name);
    refreshSightings();
  });
}

refreshNotes();
refreshSightings();
