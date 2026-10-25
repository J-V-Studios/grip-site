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

const readout = document.querySelector("#readout");
const statusLine = document.querySelector("#screen-status");
const screen = document.querySelector(".screen");
const keys = document.querySelectorAll("[data-cmd]");
const packets = document.querySelector("#packets");
const latency = document.querySelector("#latency");
const form = document.querySelector("#note-form");
const list = document.querySelector("#note-list");
const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const noteKey = "lilgrip-notes";

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

function loadNotes() {
  try {
    const saved = JSON.parse(localStorage.getItem(noteKey) || "[]");
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function saveNotes(notes) {
  localStorage.setItem(noteKey, JSON.stringify(notes));
}

function renderNotes() {
  if (!list) return;
  const notes = loadNotes();
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
    const remove = document.createElement("button");
    remove.type = "button";
    remove.textContent = "remove";
    remove.addEventListener("click", () => {
      saveNotes(loadNotes().filter((entry) => entry.id !== note.id));
      renderNotes();
    });
    item.append(name, body, remove);
    list.append(item);
  }
}

function clean(value, max) {
  return value.replace(/\s+/g, " ").trim().slice(0, max);
}

if (form) {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const body = clean(String(data.get("body") || ""), 200);
    if (!body) return;
    const name = clean(String(data.get("name") || ""), 24) || "anon";
    const notes = loadNotes();
    notes.unshift({ id: Date.now().toString(36), name, body });
    saveNotes(notes.slice(0, 40));
    form.reset();
    renderNotes();
  });
}

renderNotes();
