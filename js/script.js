/**
 * CLOUD KITCHEN - Master Client-side JavaScript
 * Features:
 * - Mobile navigation menu toggle & active link state
 * - Cart state management (Local frontend demo state)
 * - Add, increase, decrease, remove items from cart
 * - Dynamic price calculation, item counter badge
 * - Demo checkout & order confirmation modal
 * - Search bar with live filtering across product cards
 * - Category filter pills
 * - FAQ accordion expandable drawers
 * - Contact form client validation
 * - Scroll-to-top button
 * - Toast notification feedback
 */

document.addEventListener('DOMContentLoaded', () => {
  initMobileNav();
  initCartSystem();
  initSearchAndFilters();
  initFaqAccordion();
  initContactForm();
  initScrollTop();
  highlightActiveNav();
});

/* ==========================================================================
   1. NAVIGATION & ACTIVE STATE
   ========================================================================== */
function initMobileNav() {
  const toggleBtn = document.getElementById('mobileMenuToggle');
  const navMenu = document.getElementById('navMenu');

  if (toggleBtn && navMenu) {
    toggleBtn.addEventListener('click', () => {
      const isOpen = navMenu.classList.contains('open');
      if (isOpen) {
        navMenu.classList.remove('open');
        toggleBtn.classList.remove('is-active');
        toggleBtn.setAttribute('aria-expanded', 'false');
      } else {
        navMenu.classList.add('open');
        toggleBtn.classList.add('is-active');
        toggleBtn.setAttribute('aria-expanded', 'true');
      }
    });

    // Close on navigation click
    navMenu.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('open');
        toggleBtn.classList.remove('is-active');
        toggleBtn.setAttribute('aria-expanded', 'false');
      });
    });
  }
}

function highlightActiveNav() {
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  const navLinks = document.querySelectorAll('.nav-link');

  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPath || (currentPath === '' && href === 'index.html')) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

/* ==========================================================================
   2. DEMO CART & ORDERING SYSTEM (Pure Client-side Frontend Demo)
   ========================================================================== */
const CART_STORAGE_KEY = 'cloud_kitchen_demo_cart_v1';

// In-memory demo cart initialized from localStorage if available
let cart = [];
try {
  const savedCart = localStorage.getItem(CART_STORAGE_KEY);
  if (savedCart) {
    cart = JSON.parse(savedCart);
  }
} catch (e) {
  cart = [];
}

function saveCart() {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  } catch (e) {
    // Local storage fallback
  }
  updateCartUI();
}

function initCartSystem() {
  // Bind Cart Drawer Open / Close buttons
  const cartTriggers = document.querySelectorAll('.js-cart-toggle');
  const cartDrawer = document.getElementById('cartDrawer');
  const cartOverlay = document.getElementById('cartOverlay');
  const cartCloseBtn = document.getElementById('cartCloseBtn');
  const startExploringBtn = document.getElementById('startExploringBtn');

  function openCart() {
    if (cartDrawer && cartOverlay) {
      cartDrawer.classList.add('open');
      cartOverlay.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeCart() {
    if (cartDrawer && cartOverlay) {
      cartDrawer.classList.remove('open');
      cartOverlay.classList.remove('open');
      document.body.style.overflow = '';
    }
  }

  cartTriggers.forEach(btn => btn.addEventListener('click', (e) => {
    e.preventDefault();
    openCart();
  }));

  if (cartCloseBtn) cartCloseBtn.addEventListener('click', closeCart);
  if (cartOverlay) cartOverlay.addEventListener('click', closeCart);
  if (startExploringBtn) startExploringBtn.addEventListener('click', closeCart);

  // Bind all Add-to-Cart buttons
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.js-add-to-cart');
    if (btn) {
      e.preventDefault();
      const id = btn.getAttribute('data-id');
      const name = btn.getAttribute('data-name');
      const price = parseFloat(btn.getAttribute('data-price')) || 0;
      const category = btn.getAttribute('data-category') || 'Food Item';

      addToCart({ id, name, price, category });
      showToast(`Added "${name}" to demo cart`);
    }
  });

  // Bind Demo Checkout Trigger
  const checkoutBtn = document.getElementById('checkoutBtn');
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
      if (cart.length === 0) {
        showToast('Your cart is empty! Please add items first.');
        return;
      }
      closeCart();
      openCheckoutModal();
    });
  }

  // Bind Checkout Confirmation Modal
  const modalOverlay = document.getElementById('checkoutModalOverlay');
  const modalClose = document.getElementById('modalCloseBtn');
  const modalConfirmBtn = document.getElementById('confirmOrderBtn');

  if (modalClose && modalOverlay) {
    modalClose.addEventListener('click', () => {
      modalOverlay.classList.remove('open');
    });
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) {
        modalOverlay.classList.remove('open');
      }
    });
  }

  if (modalConfirmBtn) {
    modalConfirmBtn.addEventListener('click', () => {
      showSuccessConfirmation();
    });
  }

  updateCartUI();
}

function addToCart(item) {
  const existingItemIndex = cart.findIndex(c => c.id === item.id);
  if (existingItemIndex > -1) {
    cart[existingItemIndex].qty += 1;
  } else {
    cart.push({
      id: item.id,
      name: item.name,
      price: item.price,
      category: item.category,
      qty: 1
    });
  }
  saveCart();
}

function updateQuantity(id, change) {
  const itemIndex = cart.findIndex(c => c.id === id);
  if (itemIndex > -1) {
    cart[itemIndex].qty += change;
    if (cart[itemIndex].qty <= 0) {
      cart.splice(itemIndex, 1);
    }
    saveCart();
  }
}

function removeFromCart(id) {
  cart = cart.filter(c => c.id !== id);
  saveCart();
  showToast('Item removed from cart');
}

function updateCartUI() {
  const cartCountBadges = document.querySelectorAll('.cart-count');
  const cartItemsContainer = document.getElementById('cartItemsList');
  const emptyState = document.getElementById('cartEmptyState');
  const cartSubtotalEl = document.getElementById('cartSubtotal');
  const cartTaxEl = document.getElementById('cartTax');
  const cartTotalEl = document.getElementById('cartTotal');
  const checkoutBtn = document.getElementById('checkoutBtn');

  const totalItemsCount = cart.reduce((acc, curr) => acc + curr.qty, 0);
  const subtotal = cart.reduce((acc, curr) => acc + (curr.price * curr.qty), 0);
  // Demo tax illustrative calculation (5% GST)
  const gst = Math.round(subtotal * 0.05);
  const total = subtotal > 0 ? (subtotal + gst) : 0;

  // Update badges
  cartCountBadges.forEach(badge => {
    badge.textContent = totalItemsCount;
    badge.style.display = totalItemsCount > 0 ? 'inline-flex' : 'none';
  });

  if (!cartItemsContainer) return;

  if (cart.length === 0) {
    if (emptyState) emptyState.style.display = 'block';
    cartItemsContainer.innerHTML = '';
    if (cartSubtotalEl) cartSubtotalEl.textContent = '₹0';
    if (cartTaxEl) cartTaxEl.textContent = '₹0';
    if (cartTotalEl) cartTotalEl.textContent = '₹0';
    if (checkoutBtn) checkoutBtn.disabled = true;
    return;
  }

  if (emptyState) emptyState.style.display = 'none';
  if (checkoutBtn) checkoutBtn.disabled = false;

  let itemsHtml = '';
  cart.forEach(item => {
    const itemTotal = item.price * item.qty;
    itemsHtml += `
      <div class="cart-item">
        <div class="cart-item-info">
          <div class="cart-item-title">${escapeHTML(item.name)}</div>
          <div class="cart-item-price">₹${item.price} &times; ${item.qty} = <strong>₹${itemTotal}</strong></div>
        </div>
        <div class="cart-qty-controls">
          <button class="qty-btn" onclick="updateQuantity('${item.id}', -1)" title="Decrease" aria-label="Decrease quantity">&minus;</button>
          <span class="qty-number">${item.qty}</span>
          <button class="qty-btn" onclick="updateQuantity('${item.id}', 1)" title="Increase" aria-label="Increase quantity">&#43;</button>
        </div>
        <button class="cart-remove-btn" onclick="removeFromCart('${item.id}')" title="Remove" aria-label="Remove item">&times;</button>
      </div>
    `;
  });

  cartItemsContainer.innerHTML = itemsHtml;
  if (cartSubtotalEl) cartSubtotalEl.textContent = `₹${subtotal}`;
  if (cartTaxEl) cartTaxEl.textContent = `₹${gst}`;
  if (cartTotalEl) cartTotalEl.textContent = `₹${total}`;
}

// Make accessible to inline onclick handlers
window.updateQuantity = updateQuantity;
window.removeFromCart = removeFromCart;

function openCheckoutModal() {
  const modalOverlay = document.getElementById('checkoutModalOverlay');
  const modalContent = document.getElementById('modalContentArea');
  if (!modalOverlay || !modalContent) return;

  const subtotal = cart.reduce((acc, curr) => acc + (curr.price * curr.qty), 0);
  const gst = Math.round(subtotal * 0.05);
  const total = subtotal + gst;

  let summaryList = cart.map(item => `
    <div style="display: flex; justify-content: space-between; margin-bottom: 0.35rem;">
      <span>${escapeHTML(item.name)} &times; ${item.qty}</span>
      <strong>₹${item.price * item.qty}</strong>
    </div>
  `).join('');

  modalContent.innerHTML = `
    <h3 class="modal-title">Review Demo Order</h3>
    <p class="modal-subtitle">Review your selected items before submitting this demonstration order.</p>
    
    <div class="order-summary-box">
      <div style="font-weight: 700; margin-bottom: 0.75rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.35rem;">Order Summary (Illustrative)</div>
      ${summaryList}
      <div style="border-top: 1px dashed #cbd5e1; margin-top: 0.75rem; padding-top: 0.5rem; display: flex; justify-content: space-between;">
        <span>Item Subtotal:</span>
        <span>₹${subtotal}</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin-top: 0.25rem;">
        <span>Taxes & Kitchen Packaging (5%):</span>
        <span>₹${gst}</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin-top: 0.5rem; font-weight: 800; font-size: 1.05rem; color: #1c2024;">
        <span>Demo Payable Total:</span>
        <span style="color: #f26522;">₹${total}</span>
      </div>
    </div>

    <div style="background: #fff2eb; border: 1px solid #ffd8c7; border-radius: 8px; padding: 0.85rem; font-size: 0.82rem; color: #d95314; margin-bottom: 1.5rem; line-height: 1.4;">
      <strong>Frontend Demonstration Notice:</strong> This is an illustrative demo ordering system. No real payments, cards, or delivery commitments are processed.
    </div>

    <div style="display: flex; gap: 0.75rem;">
      <button class="btn btn-secondary btn-block" onclick="document.getElementById('checkoutModalOverlay').classList.remove('open')">Keep Browsing</button>
      <button class="btn btn-primary btn-block" id="confirmOrderBtn">Confirm Demo Order</button>
    </div>
  `;

  const confirmBtn = document.getElementById('confirmOrderBtn');
  if (confirmBtn) {
    confirmBtn.addEventListener('click', showSuccessConfirmation);
  }

  modalOverlay.classList.add('open');
}

function showSuccessConfirmation() {
  const modalContent = document.getElementById('modalContentArea');
  if (!modalContent) return;

  const orderNum = 'CK-' + Math.floor(100000 + Math.random() * 900000);

  modalContent.innerHTML = `
    <div class="modal-success-icon">&#10003;</div>
    <h3 class="modal-title">Demo Order Submitted!</h3>
    <p class="modal-subtitle">Your demo order has been submitted successfully!</p>
    
    <div class="order-summary-box" style="text-align: center;">
      <div style="font-size: 0.8rem; color: #64748b; text-transform: uppercase;">Generated Demo Order Reference</div>
      <div style="font-size: 1.35rem; font-weight: 800; color: #f26522; letter-spacing: 1px; margin: 0.35rem 0;">#${orderNum}</div>
      <p style="font-size: 0.82rem; color: #606f7b; margin: 0;">
        Estimated preparation simulation: <strong>20 - 30 minutes</strong>. Thank you for testing our cloud kitchen frontend showcase.
      </p>
    </div>

    <button class="btn btn-primary btn-block" onclick="clearCartAndCloseModal()">Done & Continue Browsing</button>
  `;

  // Clear cart
  cart = [];
  saveCart();
}

function clearCartAndCloseModal() {
  const modalOverlay = document.getElementById('checkoutModalOverlay');
  if (modalOverlay) modalOverlay.classList.remove('open');
  showToast('Cart cleared. Thank you for testing!');
}
window.clearCartAndCloseModal = clearCartAndCloseModal;

/* ==========================================================================
   3. SEARCH & CATEGORY FILTER BAR
   ========================================================================== */
function initSearchAndFilters() {
  const searchInput = document.getElementById('foodSearchInput');
  const filterBtns = document.querySelectorAll('.filter-btn');
  const foodCards = document.querySelectorAll('.js-food-item');

  if (!foodCards.length) return;

  let activeCategory = 'all';
  let searchTerm = '';

  function applyFilters() {
    let matchedCount = 0;
    foodCards.forEach(card => {
      const cardCategory = card.getAttribute('data-category') || '';
      const cardTitle = (card.querySelector('.food-title') ? card.querySelector('.food-title').textContent : '').toLowerCase();
      const cardDesc = (card.querySelector('.food-desc') ? card.querySelector('.food-desc').textContent : '').toLowerCase();

      const matchesCategory = (activeCategory === 'all' || cardCategory === activeCategory);
      const matchesSearch = (!searchTerm || cardTitle.includes(searchTerm) || cardDesc.includes(searchTerm) || cardCategory.includes(searchTerm));

      if (matchesCategory && matchesSearch) {
        card.style.display = '';
        matchedCount++;
      } else {
        card.style.display = 'none';
      }
    });

    const noResultsMsg = document.getElementById('noResultsMessage');
    if (noResultsMsg) {
      noResultsMsg.style.display = (matchedCount === 0) ? 'block' : 'none';
    }
  }

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchTerm = e.target.value.trim().toLowerCase();
      applyFilters();
    });
  }

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeCategory = btn.getAttribute('data-filter') || 'all';
      applyFilters();
    });
  });
}

/* ==========================================================================
   4. FAQ ACCORDION
   ========================================================================== */
function initFaqAccordion() {
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const header = item.querySelector('.faq-header');
    if (header) {
      header.addEventListener('click', () => {
        const isActive = item.classList.contains('active');
        // Close others
        faqItems.forEach(i => i.classList.remove('active'));
        if (!isActive) {
          item.classList.add('active');
        }
      });
    }
  });
}

/* ==========================================================================
   5. CONTACT FORM VALIDATION (CLIENT-SIDE DEMO)
   ========================================================================== */
function initContactForm() {
  const contactForm = document.getElementById('demoContactForm');
  if (!contactForm) return;

  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    let isValid = true;

    const nameInput = document.getElementById('contactName');
    const emailInput = document.getElementById('contactEmail');
    const phoneInput = document.getElementById('contactPhone');
    const messageInput = document.getElementById('contactMessage');

    // Simple validations
    if (nameInput && nameInput.value.trim().length < 2) {
      showFieldError('nameError', 'Please enter your name (at least 2 characters)');
      isValid = false;
    } else {
      hideFieldError('nameError');
    }

    if (emailInput && !/^\S+@\S+\.\S+$/.test(emailInput.value.trim())) {
      showFieldError('emailError', 'Please provide a valid email address');
      isValid = false;
    } else {
      hideFieldError('emailError');
    }

    if (phoneInput && phoneInput.value.trim().length < 8) {
      showFieldError('phoneError', 'Please provide a valid contact number');
      isValid = false;
    } else {
      hideFieldError('phoneError');
    }

    if (messageInput && messageInput.value.trim().length < 5) {
      showFieldError('messageError', 'Please enter your feedback or inquiry');
      isValid = false;
    } else {
      hideFieldError('messageError');
    }

    if (isValid) {
      const responseBox = document.getElementById('contactSuccessMessage');
      if (responseBox) {
        responseBox.style.display = 'block';
        responseBox.scrollIntoView({ behavior: 'smooth' });
      }
      contactForm.reset();
      showToast('Demo inquiry message submitted successfully!');
    }
  });
}

function showFieldError(id, msg) {
  const el = document.getElementById(id);
  if (el) {
    el.textContent = msg;
    el.classList.add('visible');
  }
}

function hideFieldError(id) {
  const el = document.getElementById(id);
  if (el) {
    el.classList.remove('visible');
  }
}

/* ==========================================================================
   6. SCROLL TO TOP & TOAST UTILITIES
   ========================================================================== */
function initScrollTop() {
  const scrollBtn = document.getElementById('scrollTopBtn');
  if (!scrollBtn) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 350) {
      scrollBtn.classList.add('visible');
    } else {
      scrollBtn.classList.remove('visible');
    }
  });

  scrollBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

function showToast(message) {
  let toast = document.getElementById('toastNotice');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toastNotice';
    toast.className = 'toast-notice';
    document.body.appendChild(toast);
  }
  toast.innerHTML = `<span>&#128076;</span> <div>${escapeHTML(message)}</div>`;
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
  }, 3200);
}

function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}
