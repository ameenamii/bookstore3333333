/* cart_script.js — quantity-aware, design-preserving */

(function () {
  // --- Cart storage helpers ---
  function getCart() {
    try {
      return JSON.parse(localStorage.getItem("cart")) || [];
    } catch {
      return [];
    }
  }

  function saveCart(cart) {
    localStorage.setItem("cart", JSON.stringify(cart));
  }

  // --- Add to cart (reads quantity from the same row/card if present) ---
  function handleAddToCartClick(btn) {
    // Accept either .add-to-cart-btn or [data-add-to-cart]
    const el = btn;
    const container = el.closest("tr") || el.closest(".book-card") || document;

    // Try common quantity selectors within the same row/card
    const qtyInput =
      container.querySelector(".quantity-input") ||
      container.querySelector('input[type="number"]') ||
      container.querySelector('[data-qty]');

    let qty = parseInt(qtyInput && qtyInput.value, 10);
    if (isNaN(qty) || qty < 1) qty = 1;

    // Expect data-* on the button; fallbacks stay harmless if missing
    const item = {
      id: el.dataset.id || el.getAttribute("data-id") || (el.dataset.title || "").toLowerCase().replace(/\s+/g, "-"),
      title: el.dataset.title || el.getAttribute("data-title") || "Untitled",
      author: el.dataset.author || el.getAttribute("data-author") || "",
      publisher: el.dataset.publisher || el.getAttribute("data-publisher") || "",
      price: parseFloat(el.dataset.price || el.getAttribute("data-price") || "0") || 0,
      image: el.dataset.image || el.getAttribute("data-image") || "",
      quantity: qty,
    };

    const cart = getCart();
    const existing = cart.find(x => x.id === item.id);
    if (existing) {
      existing.quantity += item.quantity;
    } else {
      cart.push(item);
    }
    saveCart(cart);

    // Non-intrusive feedback; keep your UI as-is
    if (window.toast) {
      window.toast(`${item.title} (x${qty}) added to cart`);
    } else {
      // eslint-disable-next-line no-alert
      alert(`${item.title} (x${qty}) added to cart`);
    }
  }

  // --- Render cart list (for cart.html) ---
  function renderCart() {
    const cart = getCart();

    // Flexible hook points so you don't have to change your HTML structure:
    // tbody for items
    const itemsTbody =
      document.getElementById("cart-items") ||
      document.querySelector("tbody#cart-items") ||
      document.querySelector("tbody[data-cart-items]");

    // grand total container
    const totalEl =
      document.getElementById("cart-total") ||
      document.querySelector("[data-cart-total]") ||
      document.getElementById("totalAmount");

    // empty-state element (optional)
    const emptyEl =
      document.getElementById("cart-empty-message") ||
      document.querySelector("[data-cart-empty]");

    if (!itemsTbody) return; // if cart page isn't open, do nothing

    itemsTbody.innerHTML = "";

    if (cart.length === 0) {
      if (emptyEl) emptyEl.style.display = "";
      if (totalEl) totalEl.textContent = "";
      return;
    } else {
      if (emptyEl) emptyEl.style.display = "none";
    }

    let grand = 0;
    cart.forEach((item, index) => {
      const line = item.price * item.quantity;
      grand += line;

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td class="cart-col-image">${item.image ? `<img src="${item.image}" alt="" style="width:64px;height:auto">` : ""}</td>
        <td class="cart-col-title">${item.title}</td>
        <td class="cart-col-author">${item.author || ""}</td>
        <td class="cart-col-publisher">${item.publisher || ""}</td>
        <td class="cart-col-price">₹${item.price.toFixed(2)}</td>
        <td class="cart-col-qty">
          <input type="number" min="1" value="${item.quantity}" class="quantity-input" data-index="${index}" style="width:64px;text-align:center;">
        </td>
        <td class="cart-col-subtotal">₹${line.toFixed(2)}</td>
        <td class="cart-col-actions">
          <button type="button" class="remove-from-cart" data-index="${index}">Remove</button>
        </td>
      `;
      itemsTbody.appendChild(tr);
    });

    if (totalEl) {
      totalEl.textContent = `Total: ₹${grand.toFixed(2)}`;
    }

    // Quantity change handler
    itemsTbody.querySelectorAll(".quantity-input").forEach(inp => {
      inp.addEventListener("change", (e) => {
        const idx = parseInt(e.target.getAttribute("data-index"), 10);
        let newQty = parseInt(e.target.value, 10);
        if (isNaN(newQty) || newQty < 1) newQty = 1;

        const cartNow = getCart();
        if (cartNow[idx]) {
          cartNow[idx].quantity = newQty;
          saveCart(cartNow);
          renderCart(); // re-render to update subtotals & total
        }
      });
    });

    // Remove button handler
    itemsTbody.querySelectorAll(".remove-from-cart").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const idx = parseInt(e.target.getAttribute("data-index"), 10);
        const cartNow = getCart();
        cartNow.splice(idx, 1);
        saveCart(cartNow);
        renderCart();
      });
    });
  }

  // --- Wire up events after DOM is ready ---
  document.addEventListener("DOMContentLoaded", () => {
    // Bind to both legacy and data-driven selectors to avoid HTML changes
    const buttons = [
      ...document.querySelectorAll(".add-to-cart-btn"),
      ...document.querySelectorAll("[data-add-to-cart]")
    ];

    buttons.forEach(btn => {
      btn.addEventListener("click", () => handleAddToCartClick(btn));
    });

    // If we are on cart page, render it (id/attr hooks are flexible)
    renderCart();
  });

  // Expose functions if your existing HTML calls them inline
  window.renderCart = renderCart;
})();