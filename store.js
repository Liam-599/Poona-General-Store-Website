// store.js
// Renders the public-facing list of items, grouped by category,
// with search and category filtering. Items come from Firestore
// (see store-data.js), so this fetches asynchronously.

document.getElementById("year").textContent = new Date().getFullYear();

const itemsWrap = document.getElementById("itemsWrap");
const emptyState = document.getElementById("emptyState");
const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");

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
    allItemsCache = await getItems();
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

renderItems();
