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
const cards = [...document.querySelectorAll(".product-card")];
document.querySelector(".filter-row").hidden = false;
function filterCards(filter) {
  for (const button of filters) {
    button.setAttribute("aria-pressed", String(button.dataset.filter === filter));
  }
  let count = 0;
  for (const card of cards) {
    card.hidden = filter !== "all" && card.dataset.status !== filter;
    if (!card.hidden) count += 1;
  }
  document.querySelector("#filter-status").textContent =
    `${count} ${count === 1 ? "product" : "products"} shown.`;
}
for (const button of filters) {
  button.addEventListener("click", () => filterCards(button.dataset.filter));
}

function revealCard(hash) {
  const card = cards.find((item) => `#${item.id}` === hash);
  if (!card?.hidden) return;
  filterCards("all");
  return card;
}
for (const link of document.querySelectorAll('.setup-choices a[href^="#"]')) {
  // Reveal before native fragment navigation, even if the hash is unchanged.
  link.addEventListener("click", () => revealCard(link.hash));
}
addEventListener("hashchange", () => revealCard(location.hash)?.scrollIntoView());

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
