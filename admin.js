// admin.js
// Password-gated panel for adding and removing store items.
//
// NOTE: This is a simple client-side password check suitable for
// keeping casual visitors out of the admin area on a small static
// site. It is NOT secure against a determined user who reads the
// page source — anyone with real security needs should use a
// server-side login instead.

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

// Stay unlocked for the rest of the browser tab session
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

function renderAdminItems() {
  const items = getItems();
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
    btn.addEventListener("click", () => {
      removeItem(btn.dataset.id);
      renderAdminItems();
    });
  });
}

itemForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const name = document.getElementById("itemName").value.trim();
  const category = document.getElementById("itemCategory").value.trim();
  const price = document.getElementById("itemPrice").value;
  const image = document.getElementById("itemImage").value.trim();
  const description = document.getElementById("itemDescription").value.trim();

  if (!name || !category || price === "") return;

  addItem({ name, category, price: Number(price), image, description });
  itemForm.reset();
  renderAdminItems();
});

clearAllBtn.addEventListener("click", () => {
  if (confirm("Delete ALL items? This cannot be undone.")) {
    clearAllItems();
    renderAdminItems();
  }
});
