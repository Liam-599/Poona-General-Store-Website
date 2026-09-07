// store-data.js
// Shared helpers for reading/writing store items.
// Items are persisted in localStorage so they survive page reloads
// on the same browser/device.

const STORAGE_KEY = "poonaGeneralStoreItems";

// Seed a couple of example items the first time the site is opened,
// so the page isn't empty before anything has been added.
const SEED_ITEMS = [
  {
    id: "seed-1",
    name: "Vada Pav",
    category: "Menu",
    price: 30,
    description: "Spiced potato fritter in a soft bun, served with chutney.",
    image: ""
  },
  {
    id: "seed-2",
    name: "Basmati Rice (1kg)",
    category: "Groceries",
    price: 120,
    description: "Long-grain aged basmati rice.",
    image: ""
  },
  {
    id: "seed-3",
    name: "Masala Chai",
    category: "Beverages",
    price: 15,
    description: "Freshly brewed spiced tea.",
    image: ""
  }
];

function getItems() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === null) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_ITEMS));
    return [...SEED_ITEMS];
  }
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

function saveItems(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function addItem(item) {
  const items = getItems();
  item.id = "item-" + Date.now() + "-" + Math.floor(Math.random() * 1000);
  items.push(item);
  saveItems(items);
  return items;
}

function removeItem(id) {
  const items = getItems().filter((i) => i.id !== id);
  saveItems(items);
  return items;
}

function clearAllItems() {
  saveItems([]);
  return [];
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

function formatPrice(value) {
  const num = Number(value);
  if (isNaN(num)) return value;
  return num.toFixed(2);
}
