const commands = {
  ping: {
    status: "pinging",
    text: "lilgrip answered · 0% packet loss",
  },
  tls: {
    status: "handshake",
    text: "TLS 1.3 · lilgrip locked in",
  },
  verse: {
    status: "love.service",
    text: "Let all that you do be done in love.",
  },
  boot: {
    status: "booting",
    text: "lilgrip ready",
  },
};

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const db = createClient(
  "https://lendvtrjkehanndudjfd.supabase.co",
  "sb_publishable_3YWB0mRTB__4zo5xNtuFoQ__r2yX6xf"
);

const readout = document.querySelector("#readout");
const statusLine = document.querySelector("#screen-status");
const screen = document.querySelector(".screen");
const keys = document.querySelectorAll("[data-cmd]");
const packets = document.querySelector("#packets");
const latency = document.querySelector("#latency");
const form = document.querySelector("#note-form");
const list = document.querySelector("#note-list");
const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const hint = document.querySelector(".hint");

let count = 1024;

function setReadout(text) {
  if (!readout) return;
  readout.textContent = text;
  readout.classList.remove("pop");
  if (!reduced) {
    void readout.offsetWidth;
    readout.classList.add("pop");
  }
}

function runCommand(name) {
  const command = commands[name];
  if (!command) return;
  keys.forEach((button) => {
    button.classList.toggle("is-on", button.dataset.cmd === name);
  });
  if (statusLine) statusLine.textContent = command.status;
  if (screen) screen.classList.add("is-hot");
  setReadout(command.text);
  count += name === "ping" ? 3 : 1;
  if (packets) packets.textContent = count.toLocaleString("en-US");
  if (latency && name === "ping") {
    latency.textContent = 8 + Math.floor(Math.random() * 11) + "ms";
  }
  window.setTimeout(() => {
    if (screen) screen.classList.remove("is-hot");
    if (statusLine) statusLine.textContent = "online";
  }, 900);
}

keys.forEach((button) => {
  button.addEventListener("click", () => runCommand(button.dataset.cmd));
});

document.addEventListener("keydown", (event) => {
  const map = { "1": "ping", "2": "tls", "3": "verse", "4": "boot" };
  const target = event.target;
  if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
  if (map[event.key]) runCommand(map[event.key]);
});

if (!reduced && packets && latency) {
  window.setInterval(() => {
    count += 1;
    packets.textContent = count.toLocaleString("en-US");
    latency.textContent = 8 + Math.floor(Math.random() * 11) + "ms";
  }, 1400);
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
  try {
    renderNotes(await loadNotes());
  } catch {
    if (hint) hint.textContent = "notes could not load. try again in a minute.";
  }
}

function clean(value, max) {
  return value.replace(/\s+/g, " ").trim().slice(0, max);
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
