const lines = [
  {
    cmd: "uptime",
    out: [
      { cls: "warm", text: "just a chill guy" },
      { cls: "dim", text: "load average: 0.01, 0.02, 0.02" },
    ],
  },
  {
    cmd: "systemctl status love.service",
    out: [
      { cls: "ok", text: "active (running)" },
      { cls: "note", text: "1 Corinthians 16:14" },
    ],
  },
  {
    cmd: "ss -ltnp",
    out: [{ cls: "info", text: "LISTEN  0.0.0.0:443   the lilgriper" }],
  },
  {
    cmd: "curl -sI /",
    out: [
      { cls: "ok", text: "HTTP/2 200" },
      { cls: "warm", text: "server: the-lilgriper" },
      { cls: "note", text: "x-powered-by: chill" },
    ],
  },
];

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function staticLog(log) {
  log.replaceChildren();
  for (const block of lines) {
    const prompt = document.createElement("p");
    const ps1 = document.createElement("span");
    ps1.className = "ps1";
    ps1.textContent = "lilgriper@pages:~$ ";
    prompt.append(ps1, document.createTextNode(block.cmd));
    log.append(prompt);
    for (const row of block.out) {
      const line = document.createElement("p");
      line.className = row.cls;
      line.textContent = row.text;
      log.append(line);
    }
  }
}

async function typeInto(node, text, caret) {
  node.append(caret);
  for (const char of text) {
    node.insertBefore(document.createTextNode(char), caret);
    await wait(text.length > 28 ? 16 : 26);
  }
}

async function play(log) {
  const caret = document.createElement("span");
  caret.className = "caret";
  while (true) {
    log.replaceChildren();
    for (const block of lines) {
      const prompt = document.createElement("p");
      const ps1 = document.createElement("span");
      ps1.className = "ps1";
      ps1.textContent = "lilgriper@pages:~$ ";
      const command = document.createElement("span");
      prompt.append(ps1, command);
      log.append(prompt);
      await typeInto(command, block.cmd, caret);
      await wait(180);
      for (const row of block.out) {
        const line = document.createElement("p");
        line.className = row.cls;
        log.append(line);
        await typeInto(line, row.text, caret);
        await wait(120);
      }
      await wait(280);
    }
    await wait(1700);
  }
}

const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const log = document.querySelector("#log");
const packets = document.querySelector("#packets");
const latency = document.querySelector("#latency");

if (log) {
  if (reduced) staticLog(log);
  else play(log);
}

if (!reduced && packets && latency) {
  let count = 1024;
  setInterval(() => {
    count += 1;
    packets.textContent = count.toLocaleString("en-US");
    const ms = 8 + Math.floor(Math.random() * 11);
    latency.textContent = ms + "ms";
  }, 1100);
}
