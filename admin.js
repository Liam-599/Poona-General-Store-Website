// admin.js
// Password-gated panel for adding and removing store items.
// Items are saved to Firestore (see store-data.js), so changes here
// are visible to every visitor, not just this browser.
//
// NOTE: The password check below only hides the admin UI in this
// browser tab. It does NOT stop someone from writing to the database
// directly if they know how - real access control would need proper
// Firebase Authentication + security rules. Fine for a small trusted
// setup, not a substitute for real login security.

const ADMIN_PASSWORD = "poona123"; // <-- change this to whatever you like

document.getElementById("year").textContent = new Date().getFullYear();

const lockScreen = document.getElementById("lockScreen");
const adminPanel = document.getElementById("adminPanel");
const lockForm = document.getElementById("lockForm");
const passwordInput = document.getElementById("passwordInput");
const lockError = document.getElementById("lockError");
const lockAgainBtn = document.getElementById("lockAgainBtn");

const itemForm = document.getElementById("itemForm");
const adminItemsWrap = document.getElementById("adminItemsWrap");
const clearAllBtn = document.getElementById("clearAllBtn");
const categoryList = document.getElementById("categoryList");
const addItemBtn = itemForm ? itemForm.querySelector('button[type="submit"]') : null;

function unlock() {
  lockScreen.hidden = true;
  adminPanel.hidden = false;
  sessionStorage.setItem("poonaAdminUnlocked", "yes");
  renderAdminItems();
}

function lock() {
  lockScreen.hidden = false;
  adminPanel.hidden = true;
  sessionStorage.removeItem("poonaAdminUnlocked");
  passwordInput.value = "";
  lockError.hidden = true;
}

if (sessionStorage.getItem("poonaAdminUnlocked") === "yes") {
  unlock();
}

lockForm.addEventListener("submit", (e) => {
  e.preventDefault();
  if (passwordInput.value === ADMIN_PASSWORD) {
    unlock();
  } else {
    lockError.hidden = false;
  }
});

lockAgainBtn.addEventListener("click", lock);

function populateCategoryDatalist(items) {
  const categories = [...new Set(items.map((i) => i.category).filter(Boolean))].sort();
  categoryList.innerHTML = "";
  categories.forEach((cat) => {
    const opt = document.createElement("option");
    opt.value = cat;
    categoryList.appendChild(opt);
  });
}

async function renderAdminItems() {
  adminItemsWrap.innerHTML = '<p class="muted">Loading...</p>';
  let items;
  try {
    items = await getItems();
  } catch (e) {
    adminItemsWrap.innerHTML = '<p class="muted">Could not load items. Check the Firebase setup in js/firebase-config.js.</p>';
    console.error(e);
    return;
  }

  populateCategoryDatalist(items);
  adminItemsWrap.innerHTML = "";

  if (items.length === 0) {
    const p = document.createElement("p");
    p.className = "muted";
    p.textContent = "No items yet. Add one using the form above.";
    adminItemsWrap.appendChild(p);
    return;
  }

  items.forEach((item) => {
    const row = document.createElement("div");
    row.className = "admin-item-row";
    row.innerHTML = `
      <div class="admin-item-info">
        <h4>${escapeHtml(item.name)} <span class="muted">— ${escapeHtml(item.category)}</span></h4>
        <p>$${formatPrice(item.price)}${item.description ? " · " + escapeHtml(item.description) : ""}</p>
      </div>
      <button class="remove-btn" data-id="${item.id}">Remove</button>
    `;
    adminItemsWrap.appendChild(row);
  });

  adminItemsWrap.querySelectorAll(".remove-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      btn.disabled = true;
      btn.textContent = "Removing...";
      try {
        await removeItem(btn.dataset.id);
        renderAdminItems();
      } catch (e) {
        alert("Failed to remove item. Check your internet connection and Firebase setup.");
        console.error(e);
        btn.disabled = false;
        btn.textContent = "Remove";
      }
    });
  });
}

itemForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("itemName").value.trim();
  const category = document.getElementById("itemCategory").value.trim();
  const price = document.getElementById("itemPrice").value;
  const image = document.getElementById("itemImage").value.trim();
  const description = document.getElementById("itemDescription").value.trim();

  if (!name || !category || price === "") return;

  if (addItemBtn) { addItemBtn.disabled = true; addItemBtn.textContent = "Saving..."; }

  try {
    await addItem({ name, category, price: Number(price), image, description });
    itemForm.reset();
    renderAdminItems();
  } catch (e) {
    alert("Failed to save. Check that js/firebase-config.js has your real Firebase project keys, and that Firestore rules allow writes.");
    console.error(e);
  } finally {
    if (addItemBtn) { addItemBtn.disabled = false; addItemBtn.textContent = "Add item"; }
  }
});

clearAllBtn.addEventListener("click", async () => {
  if (!confirm("Delete ALL items? This cannot be undone.")) return;
  clearAllBtn.disabled = true;
  try {
    await clearAllItems();
    renderAdminItems();
  } catch (e) {
    alert("Failed to clear items. Check your internet connection and Firebase setup.");
    console.error(e);
  } finally {
    clearAllBtn.disabled = false;
  }
});
