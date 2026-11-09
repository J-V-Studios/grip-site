import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const db = createClient(
  "https://lendvtrjkehanndudjfd.supabase.co",
  "sb_publishable_3YWB0mRTB__4zo5xNtuFoQ__r2yX6xf"
);

const form = document.querySelector("#note-form");
const list = document.querySelector("#note-list");
const hint = document.querySelector(".notes .hint");
const navCards = document.querySelectorAll(".nav-card");
const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function clean(value, max) {
  return value.replace(/\s+/g, " ").trim().slice(0, max);
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

refreshNotes();
