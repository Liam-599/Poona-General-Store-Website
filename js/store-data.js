// store-data.js
// Shared helpers for reading/writing store items.
// Backed by Firebase Firestore, so every visitor sees the same live items
// instead of each browser having its own separate copy.

const ITEMS_COLLECTION = "items";

// Seed a couple of example items the first time the database is empty,
// so the page isn't blank before anything has been added.
const SEED_ITEMS = [
  {
    name: "Vada Pav",
    category: "Menu",
    price: 30,
    description: "Spiced potato fritter in a soft bun, served with chutney.",
    image: ""
  },
  {
    name: "Basmati Rice (1kg)",
    category: "Groceries",
    price: 120,
    description: "Long-grain aged basmati rice.",
    image: ""
  },
  {
    name: "Masala Chai",
    category: "Beverages",
    price: 15,
    description: "Freshly brewed spiced tea.",
    image: ""
  }
];

let hasSeeded = false;

async function getItems() {
  const snapshot = await db.collection(ITEMS_COLLECTION).get();

  if (snapshot.empty && !hasSeeded) {
    hasSeeded = true;
    for (const item of SEED_ITEMS) {
      await db.collection(ITEMS_COLLECTION).add(item);
    }
    const seededSnapshot = await db.collection(ITEMS_COLLECTION).get();
    return seededSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }

  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

async function addItem(item) {
  await db.collection(ITEMS_COLLECTION).add(item);
  return getItems();
}

async function removeItem(id) {
  await db.collection(ITEMS_COLLECTION).doc(id).delete();
  return getItems();
}

async function clearAllItems() {
  const snapshot = await db.collection(ITEMS_COLLECTION).get();
  const batch = db.batch();
  snapshot.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();
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
