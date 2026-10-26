// store.js
// Renders the public-facing list of items, grouped by category,
// with search and category filtering. Items come from Firestore
// (see store-data.js), so this fetches asynchronously.

document.getElementById("year").textContent = new Date().getFullYear();

const itemsWrap = document.getElementById("itemsWrap");
const emptyState = document.getElementById("emptyState");
const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");

// Which section of the shop this page shows ("store" or "cafe"), set on <body data-section>.
const PAGE_SECTION = document.body.dataset.section || "store";

let allItemsCache = [];

function populateCategoryFilter(items) {
  const categories = [...new Set(items.map((i) => i.category).filter(Boolean))].sort();
  const prevValue = categoryFilter.value;
  categoryFilter.innerHTML = '<option value="all">All categories</option>';
  categories.forEach((cat) => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat;
    categoryFilter.appendChild(opt);
  });
  if (categories.includes(prevValue)) categoryFilter.value = prevValue;
}

function drawItems() {
  const query = searchInput.value.trim().toLowerCase();
  const selectedCategory = categoryFilter.value;

  const filtered = allItemsCache.filter((item) => {
    const matchesQuery =
      !query ||
      item.name.toLowerCase().includes(query) ||
      (item.description || "").toLowerCase().includes(query);
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    return matchesQuery && matchesCategory;
  });

  itemsWrap.innerHTML = "";

  if (allItemsCache.length === 0) {
    emptyState.hidden = false;
    return;
  }
  emptyState.hidden = true;

  if (filtered.length === 0) {
    const noResults = document.createElement("p");
    noResults.className = "muted";
    noResults.textContent = "No items match your search.";
    itemsWrap.appendChild(noResults);
    return;
  }

  const grouped = {};
  filtered.forEach((item) => {
    const cat = item.category || "Uncategorized";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(item);
  });

  Object.keys(grouped)
    .sort()
    .forEach((cat) => {
      const block = document.createElement("div");
      block.className = "category-block";

      const title = document.createElement("h3");
      title.className = "category-title";
      title.textContent = cat;
      block.appendChild(title);

      const grid = document.createElement("div");
      grid.className = "items-grid";

      grouped[cat].forEach((item) => {
        const card = document.createElement("div");
        card.className = "item-card";
        card.tabIndex = 0;
        card.setAttribute("role", "button");
        card.setAttribute("aria-label", "View " + item.name);
        card.addEventListener("click", () => openItemModal(item, card));
        card.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openItemModal(item, card);
          }
        });

        const imageHtml = item.image
          ? `<img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}" onerror="this.style.display='none'">`
          : "";

        card.innerHTML = `
          ${imageHtml}
          <div class="item-body">
            <h3>${escapeHtml(item.name)}</h3>
            <div class="price">$${formatPrice(item.price)}</div>
            ${item.description ? `<p class="desc">${escapeHtml(item.description)}</p>` : ""}
          </div>
        `;
        grid.appendChild(card);
      });

      block.appendChild(grid);
      itemsWrap.appendChild(block);
    });
}

async function renderItems() {
  try {
    const everything = await getItems();
    allItemsCache = everything.filter((i) => (i.section || "store") === PAGE_SECTION);
  } catch (e) {
    itemsWrap.innerHTML = '<p class="muted">Could not load items. Check the Firebase setup in js/firebase-config.js.</p>';
    console.error(e);
    return;
  }
  populateCategoryFilter(allItemsCache);
  drawItems();
}

searchInput.addEventListener("input", drawItems);
categoryFilter.addEventListener("change", drawItems);

// ---------- Item detail pop-up ----------
// Clicking (or pressing Enter on) an item opens a larger view of it.

const modalStyle = document.createElement("style");
modalStyle.textContent = `
  .item-card { cursor: pointer; }
  .pgs-modal {
    position: fixed; inset: 0; z-index: 200;
    background: rgba(21, 24, 29, 0.72);
    backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px);
    display: flex; align-items: center; justify-content: center;
    padding: 20px; animation: pgsFade 0.15s ease;
  }
  .pgs-modal[hidden] { display: none; }
  .pgs-modal-card {
    position: relative; background: #fff; color: var(--ink);
    width: 100%; max-width: 560px; max-height: 90vh; overflow-y: auto;
    border: 1.5px solid var(--ink); border-radius: 18px;
    box-shadow: 8px 8px 0 var(--ink);
    animation: pgsPop 0.18s ease;
  }
  .pgs-modal-card img {
    display: block; width: 100%; max-height: 420px;
    object-fit: contain; background: var(--bg);
    border-bottom: 1.5px solid var(--line);
    border-radius: 16px 16px 0 0;
  }
  .pgs-modal-body { padding: 24px 26px 28px; }
  .pgs-modal-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
  .pgs-modal-top h3 { font-size: 1.7rem; font-weight: 800; line-height: 1.15; letter-spacing: -0.02em; }
  .pgs-modal-price {
    background: var(--turmeric); color: var(--ink); font-weight: 700;
    font-size: 1.1rem; padding: 4px 14px; border-radius: 999px; white-space: nowrap;
  }
  .pgs-modal-cat { margin: 6px 0 0; color: var(--muted); font-size: 0.9rem; }
  .pgs-modal-desc { margin: 16px 0 0; font-size: 1.05rem; line-height: 1.6; }
  .pgs-modal-close {
    position: absolute; top: 12px; right: 12px; z-index: 1;
    width: 38px; height: 38px; padding: 0; border-radius: 50%;
    background: #fff; color: var(--ink); border: 1.5px solid var(--ink);
    font-size: 1.4rem; line-height: 1; display: flex; align-items: center; justify-content: center;
  }
  .pgs-modal-close:hover { background: var(--turmeric); }
  @keyframes pgsFade { from { opacity: 0; } to { opacity: 1; } }
  @keyframes pgsPop { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: none; } }
  @media (prefers-reduced-motion: reduce) { .pgs-modal, .pgs-modal-card { animation: none; } }
`;
document.head.appendChild(modalStyle);

const modalEl = document.createElement("div");
modalEl.className = "pgs-modal";
modalEl.hidden = true;
modalEl.setAttribute("role", "dialog");
modalEl.setAttribute("aria-modal", "true");
modalEl.setAttribute("aria-labelledby", "pgsModalTitle");
document.body.appendChild(modalEl);

let modalTrigger = null;

function openItemModal(item, triggerEl) {
  modalTrigger = triggerEl || null;

  const imageHtml = item.image
    ? `<img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}" onerror="this.style.display='none'">`
    : "";

  modalEl.innerHTML = `
    <div class="pgs-modal-card">
      <button type="button" class="pgs-modal-close" aria-label="Close">&times;</button>
      ${imageHtml}
      <div class="pgs-modal-body">
        <div class="pgs-modal-top">
          <h3 id="pgsModalTitle">${escapeHtml(item.name)}</h3>
          <span class="pgs-modal-price">$${formatPrice(item.price)}</span>
        </div>
        ${item.category ? `<p class="pgs-modal-cat">${escapeHtml(item.category)}</p>` : ""}
        ${item.description ? `<p class="pgs-modal-desc">${escapeHtml(item.description)}</p>` : ""}
      </div>
    </div>
  `;

  modalEl.hidden = false;
  document.body.style.overflow = "hidden";
  modalEl.querySelector(".pgs-modal-close").focus();
}

function closeItemModal() {
  if (modalEl.hidden) return;
  modalEl.hidden = true;
  modalEl.innerHTML = "";
  document.body.style.overflow = "";
  if (modalTrigger) modalTrigger.focus();
  modalTrigger = null;
}

modalEl.addEventListener("click", (e) => {
  // Close when clicking the dark backdrop or the X, but not the card itself.
  if (e.target === modalEl || e.target.closest(".pgs-modal-close")) closeItemModal();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeItemModal();
});

renderItems();
