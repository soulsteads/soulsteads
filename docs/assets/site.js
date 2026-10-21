"use strict";
// Progressive enhancement: all content remains readable if JavaScript is absent.
document.documentElement.classList.add("js");
const menu = document.querySelector(".menu-toggle");
const navigation = document.querySelector("#navigation");
menu.hidden = false;
function closeMenu() {
  menu.setAttribute("aria-expanded", "false");
  navigation.classList.remove("open");
}
menu.addEventListener("click", () => {
  const open = menu.getAttribute("aria-expanded") !== "true";
  menu.setAttribute("aria-expanded", String(open));
  navigation.classList.toggle("open", open);
});
navigation.addEventListener("click", (event) => {
  if (event.target.closest("a")) closeMenu();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && menu.getAttribute("aria-expanded") === "true") {
    closeMenu();
    menu.focus();
  }
});
// At desktop sizes the navigation is always visible, without a menu control.
const mobile = matchMedia("(max-width: 540px)");
function syncMenu() {
  menu.hidden = !mobile.matches;
  closeMenu();
}
mobile.addEventListener("change", syncMenu);
syncMenu();

const filters = [...document.querySelectorAll("[data-filter]")];
document.querySelector(".filter-row").hidden = false;
filters.forEach((button) =>
  button.addEventListener("click", () => {
    const filter = button.dataset.filter;
    filters.forEach((item) =>
      item.setAttribute("aria-pressed", String(item === button)),
    );
    let count = 0;
    document.querySelectorAll(".product-card").forEach((card) => {
      card.hidden = filter !== "all" && card.dataset.status !== filter;
      if (!card.hidden) count += 1;
    });
    document.querySelector("#filter-status").textContent =
      `${count} products shown.`;
  }),
);

const layers = {
  home: {
    symbol: "⌂",
    label: "THE PLACE YOUR AGENT CALLS HOME",
    title: "Familiar files.\nNot a new platform.",
    description:
      "Agent Home launches your chosen runtime from a directory you own. Edit the Markdown, add local skills, and keep a history you can inspect. No remote is added automatically.",
    link: "https://github.com/soulsteads/soulsteads-agent-home",
    linkLabel: "Read the Home docs ↗",
  },
  messaging: {
    symbol: "↔",
    label: "THE BRIDGE, NOT THE BRAIN",
    title: "A conversation.\nNot another dashboard.",
    description:
      "Agent Messaging connects your chat to a compatible runtime on your machine. Use it independently or configure an existing Agent Home. It does not sandbox the runtime or transfer your terminal session history.",
    link: "https://github.com/soulsteads/soulsteads-agent-messaging",
    linkLabel: "Read the Messaging docs ↗",
  },
  chat: {
    symbol: "↗",
    label: "THE PLACE YOU ALREADY TALK",
    title: "Your chat app.\nOne less context switch.",
    description:
      "Choose Telegram, Matrix, Mattermost, Discord, Slack, WhatsApp, or the web UI. Each connector needs its own setup and credentials. Guided Telegram setup supports Claude Code or Codex on Linux.",
    link: "https://github.com/soulsteads/soulsteads-agent-messaging/blob/main/docs/SETUP.md",
    linkLabel: "Explore connector setup ↗",
  },
};
const nodes = [...document.querySelectorAll("[data-layer]")];
nodes.forEach((button) => {
  button.hidden = false;
  button.addEventListener("click", () => {
    const layer = layers[button.dataset.layer];
    nodes.forEach((item) => {
      item.classList.toggle("selected", item === button);
      item.setAttribute("aria-pressed", String(item === button));
    });
    for (const key of ["symbol", "label", "title", "description"]) {
      document.querySelector(`#layer-${key}`).textContent = layer[key];
    }
    const link = document.querySelector("#layer-link");
    link.href = layer.link;
    link.textContent = layer.linkLabel;
  });
});

const setupButtons = [...document.querySelectorAll("[data-setup]")];
function selectSetup(name) {
  setupButtons.forEach((button) =>
    button.setAttribute("aria-pressed", String(button.dataset.setup === name)),
  );
  for (const id of ["home", "messaging"])
    document.querySelector(`#setup-${id}`).hidden = id !== name;
  document.querySelector("#copy-status").textContent = "";
}
document.querySelector(".quickstart-tabs").hidden = false;
selectSetup("home");
setupButtons.forEach((button) =>
  button.addEventListener("click", () => selectSetup(button.dataset.setup)),
);

document.querySelectorAll("[data-copy]").forEach((button) => {
  button.hidden = false;
  button.addEventListener("click", async () => {
    const code = document.getElementById(button.dataset.copy);
    const status = document.querySelector("#copy-status");
    try {
      await navigator.clipboard.writeText(code.textContent);
      status.textContent =
        "Copied. Paste into your terminal or coding agent when you are ready.";
    } catch {
      // Clipboard may be denied. Select the exact text for manual copying.
      const range = document.createRange();
      range.selectNodeContents(code);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      status.textContent =
        "Clipboard unavailable. Text selected—use your browser’s Copy command.";
    }
  });
});
