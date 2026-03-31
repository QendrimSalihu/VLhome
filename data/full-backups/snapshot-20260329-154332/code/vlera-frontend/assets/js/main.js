const HOSTNAME = window.location.hostname || "";
const LOCAL_HOSTS = ["", "localhost", "127.0.0.1"];
const IS_FILE_PROTOCOL = window.location.protocol === "file:";
const IS_PRIVATE_IP = /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(HOSTNAME);
const IS_LOCALHOST = LOCAL_HOSTS.includes(HOSTNAME);
const IS_LOCAL_NETWORK = IS_FILE_PROTOCOL || IS_LOCALHOST || IS_PRIVATE_IP;
const API_ORIGIN = IS_LOCAL_NETWORK
  ? `http://${IS_LOCALHOST || IS_FILE_PROTOCOL ? "localhost" : HOSTNAME}:4000`
  : "https://vlerahomewebsite.onrender.com";
const API_BASE = `${API_ORIGIN}/api`;
const CART_KEY = "vlera_cart_tmp";
const WISHLIST_KEY = "vlera_wishlist_tmp";
const PLACEHOLDER_PRODUCT = "./assets/placeholders/product.svg";
const PLACEHOLDER_CATEGORY = "./assets/placeholders/category.svg";
const LANG_KEY = "vlera_lang";
const ADMIN_TOKEN_KEY = "vlera_admin_token";
const FREE_SHIPPING_THRESHOLD_FALLBACK = 75;
const CATEGORY_STEP = 8;
const ADMIN_STEP = 10;
const I18N = {
  sq: {
    nav_home: "Home",
    nav_shop: "Shop",
    nav_categories: "Kategorite",
    nav_about: "About",
    nav_contact: "Contact",
    search_placeholder: "Kerko...",
    added_to_cart: "Produkti u shtua ne shporte.",
    empty_categories: "Nuk ka kategori ende.",
    empty_products: "Nuk ka produkte ende.",
    empty_products_admin: "Nuk ka produkte ende. Shtoji nga Admin.",
    click_category_products: "Kliko per produktet e kesaj kategorie",
    add_short: "Shto ne Shporte",
    buy_now_short: "Bli Tani",
    empty_cart: "Shporta eshte bosh.",
    empty_wishlist: "Nuk ka produkte ne wishlist.",
    no_search_results: "Nuk u gjet asgje.",
    search_prompt: "Shkruaj nje fjale per kerkim.",
    search_results_for: "Rezultate per",
    fill_required: "Ploteso fushat kryesore.",
    order_saved: "Porosia u ruajt me sukses.",
    choose_zone: "Zgjedh shtetin / zonen",
    nav_cart: "Shporta",
    lang_label: "Gjuha"
  },
  mk: {
    nav_home: "Pocetna",
    nav_shop: "Prodavnica",
    nav_categories: "Kategorii",
    nav_about: "Za Nas",
    nav_contact: "Kontakt",
    search_placeholder: "Prebaraj...",
    added_to_cart: "Proizvodot e dodaden vo kosnicka.",
    empty_categories: "Se uste nema kategorii.",
    empty_products: "Se uste nema proizvodi.",
    empty_products_admin: "Se uste nema proizvodi. Dodadi od Admin.",
    click_category_products: "Klikni za proizvodi od ovaa kategorija",
    add_short: "Dodaj vo kosnicka",
    buy_now_short: "Kupi Sega",
    empty_cart: "Kosnickata e prazna.",
    empty_wishlist: "Nema proizvodi vo wishlist.",
    no_search_results: "Nema rezultati.",
    search_prompt: "Vnesi zbor za prebaruvanje.",
    search_results_for: "Rezultati za",
    fill_required: "Popolni gi glavnite polinja.",
    order_saved: "Narackata e zacuvana uspesno.",
    choose_zone: "Izberi drzava / zona",
    nav_cart: "Kosnicka",
    lang_label: "Jazik"
  }
};

const state = {
  categories: [],
  homeProducts: [],
  bestProducts: [],
  newProducts: [],
  shopProducts: [],
  searchProducts: [],
  wishlistProducts: [],
  productDetails: null,
  relatedProducts: [],
  adminProducts: [],
  homePagination: { page: 1, totalPages: 1, total: 0, limit: 8 },
  bestPagination: { page: 1, totalPages: 1, total: 0, limit: 8 },
  newPagination: { page: 1, totalPages: 1, total: 0, limit: 8 },
  shopPagination: { page: 1, totalPages: 1, total: 0, limit: 8 },
  adminProductPagination: { page: 1, totalPages: 1, total: 0, limit: ADMIN_STEP },
  shopFilters: { q: "", category: "", sort: "newest", minPrice: "", maxPrice: "", topSoldOnly: false, newOnly: false, discountOnly: false, page: 1, limit: 8 },
  adminProductFilters: { page: 1, limit: ADMIN_STEP },
  productTotal: 0,
  homeCategoriesVisible: CATEGORY_STEP,
  categoriesPageVisible: CATEGORY_STEP,
  orders: [],
  customers: [],
  contactMessages: [],
  whatsappMessages: [],
  slides: [],
  deliveryZones: [],
  orderPagination: { page: 1, totalPages: 1, total: 0, limit: ADMIN_STEP },
  orderStats: { total_orders: 0, pending_orders: 0, total_customers: 0 },
  orderFilters: { q: "", status: "", page: 1, limit: ADMIN_STEP },
  bestMode: "flagged",
  newMode: "flagged",
  settings: {
    store_name: "VLERA Luxury Home",
    phone: "076 288 898",
    email: "vlerahomemk@gmail.com",
    instagram_url: "https://www.instagram.com/vlerahomee?igsh=dDBudTY5dmwyM240",
    free_shipping_threshold: String(FREE_SHIPPING_THRESHOLD_FALLBACK)
  },
  adminVisible: {
    categories: ADMIN_STEP,
    zones: ADMIN_STEP,
    slides: ADMIN_STEP,
    customers: ADMIN_STEP,
    contacts: ADMIN_STEP,
    whatsapp: ADMIN_STEP
  }
};

let sliderTimer = null;
const GMAIL_ICON_DATA_URI = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAALsAAACUCAMAAAD8tKi7AAABKVBMVEXs7e/sQjVChfY0qFXHFhD6vAU+g/dSju8wp1FCrGLX6ODu7u3b4/Dt7PA4gfhpt4J0o+r29/TQJBvlNDD2nxz09feOsOyHxJrHNTTGCwDt5tPp2tz2wCjs8vTrPS/jb2jqlIv3wjzoopzuwsDfVUviKxntnpXkfHXktbLsOCjmZlvorKfgRzrnKRLlioTnuxHjwcHboqPUkJHw26by047v37Lx7eLrzsvKcnC6Kyq/ExO+R0Pyy2vz5r/PbW23AADz0nm/IyH0x1bWiYXKXFbzwGO4RFPevjBsfsmYPWy4tR5nr1KIU42Vrydob76uKD9mqThSetxQqEONSX6suCyNsjepL0l3X5+kNVTLuCB3qzWgO2B2Ya2RY46gnkxmmO5atHOmwvOi0rA6TThNAAAGAUlEQVR4nO3cDVPbNhgHcNspkOGoJd0MC0YCEpzEcRLKS+OWl9KWbmwMKLB1HewVvv+HmOQQyIskJ7KMxZ3+d71r72Ln14fHiiwrGIaOjo6Ojo6Ojo6Ojo6Ojo6OqgF3f2TF7p30USL5jSCEjgOh3JNS3whEkXc+B7za2NzcrLtOqnoA7MWtbZzXHRm1J6dwwjdvd0o4z3Z263Y6xY+avLO1OtXN0t5+ERc/4X8A2u67A8zuplQieinagRCmfS+PsreY7JT4EnXquz34nf7QhvKvWgA776cGs/o64Tlh/cMAnejfhfIrD/Y/Tg1naStRjWB4MEzH+J0N6dfs9oicZD8JHrwdpWP8waELJY7CYHGPSp9a7Yi/ibNJoxP9p7Aor/SUfrnLtvClBd1dhv1Z6cNGUZIcbi+x6FOri8AWO6uzwaKTvnkDIK6K4KlJyKE2dH9gynHEL9dDth3rGxUj8WgJK43vePb3grWB7iee/SVqlhN+TkGn3PS59o8dUTuz3SO7iVDbTYKHnTZC33Ltq4KfrtD9nm83TX+tItzw0Kis+abJty+Jzgzi7SYycd8I8aFdxkdnacelr4n0DYBuzSf0TO2kb5xJz2w7Ub9kbjeRVwUTlR5PRKstZKpgN02vFk5SehjWvPtjs7abaK1OKj/eJ5VT7/WLEnY81FfHHW2cqodMleym2VqOvSUhPxYYLrcGjlPBjsebIK7pgeEE/f2ijJ1MEWLmN9BeQchU0Y7Hmwavb4ARNvyRY9KxQ/fHCe2m3wwMlh4aQXOUHmM/WhScZRd++rnE1tPspu+vUKcINp4EjPZLrP34l1kxul2YsU7YeKod66njDYC0fomzn+a/mRW5pwcA26ets88sPMNu+l5AGeqDl7Sic+1H5zlsF+sZgOtuWResvmHZ8VA/fEsC3XaL9WKm/fgyT+xCdCOqO87JDhXPtuO+qfTjwStGv3Ds66f5XC65ndE3HDu+qQggtO3o5w0d6vjCtx+dE3pi+/S0NfMrpW94djJFuOsb6C4z+4Vp/+0yJ8Ue5WR0cY9vN/1GxcF1dyoNj/s6in39SwSXZbfOfh/Gx9hN3yyDaBGD/7JR+9V5jy7Jbl0M902cHXd9LaxRP4+4dtwvOcl2y/o62DfxdjzUxxR91L7+JZeTbI/+cvZHaTL7OBm09/WL1LoP9U0a9v5+kWon//j68AhHvn39mnDz6dQd+y/+7JVeuv2qW/TU7LhvelNLyfb106F+ScFuWX91xxu59vXr/Chdvt3q9o1U+zGl6KnYp2fI1FKifemUVvRU7KRvPpfk2Y+u6fJU7NNR38iyX10yqp5O3fG82PrbjJuqjBPU/IcpT6lnLOv5HOvueZL4jfBFFvYi5y50zOA7WycbO7TLY0wUOUX3AhsQ+6P2e9dOVnUT9I0frQBmZAfkbnTFF9OjaAUNZGg3IOCuArCL3gzIojHIrmei4L6ZeLTE/UIOBUbGdmhXY+9KB4PQSnelPnM7WT1am6D06OEJSfZ2nHCZvwrTH+9hpVgBO75oi+0xK49Q+2GnnAJ2ooD1tXHwfvdJrFJ2nP6n1cx+qYVO34q6MnbDLrf4Qz3yqvbAswB17IYTDj89HeqXimOoajfIrhhm0Sk7bVSy4ylClTFF8Gk745Sy41SofYP7BYw+slfNDt22NzxaIo++o081uzH6wAA1N+jbh5Wzk/Fm4EGN16gwnvCqZ8eiTvt+QxjCN6WcVypmJ4FBM8Ij1AzYezvUtJMNSqTpPe52JkXt5Fa25bfo2zpUt+NLNmjGbMNS1270Hss/RXtslLYD/vc1lLbHRNu1Xdu1Xdu1/SnaRTam2orYRfKk7Ubh38zt/wn2u1GYy9z+QvSrjvZNxvZ8/lb4O6a8hn8Uu+j2d4Nf+Eew47JP/C3Hh8D553f7OtOxG91n8qyyLyT6SjWct56nWHe2Hf8w8gsxd+qxpy7MRTt9yH6fgUi0U5Mjw2MyO7CLhZt5Wm6KUn6rhXO7QMvtrAOMhHXHsYvUyICTOPQ82m930tHR0dHR0dHR0dHR0dHR0dERzf8cYP/aQjVC0wAAAABJRU5ErkJggg==";

function getBusinessEmail() {
  return "vlerahomemk@gmail.com";
}

function getMailtoUrl() {
  const email = getBusinessEmail();
  return `mailto:${email}`;
}

function gmailIconMarkup() {
  return `
    <img class="gmail-icon" src="${GMAIL_ICON_DATA_URI}" alt="">
  `;
}

function applyGmailAnchor(a) {
  if (!a) return;
  a.setAttribute("href", getMailtoUrl());
  a.removeAttribute("target");
  a.removeAttribute("rel");
  a.classList.add("gmail-link");
  const iconOnly = a.classList.contains("insta-link-only") || a.classList.contains("wa-link-only") || a.classList.contains("insta-float-btn") || a.classList.contains("wa-float-btn");
  const label = getBusinessEmail();
  const hasSpan = a.querySelector("span");
  if (iconOnly) {
    a.innerHTML = gmailIconMarkup();
    return;
  }
  if (hasSpan) {
    hasSpan.textContent = label;
    if (!a.querySelector(".gmail-icon")) a.insertAdjacentHTML("afterbegin", gmailIconMarkup());
    return;
  }
  a.innerHTML = `${gmailIconMarkup()}<span>${label}</span>`;
}

function freeShippingThreshold() {
  const parsed = Number(state.settings?.free_shipping_threshold);
  if (!Number.isFinite(parsed) || parsed < 0) return FREE_SHIPPING_THRESHOLD_FALLBACK;
  return parsed;
}

function resolveShippingFee(subtotal, zoneFee) {
  const safeSubtotal = Number(subtotal || 0);
  const safeZoneFee = Number(zoneFee || 0);
  return safeSubtotal >= freeShippingThreshold() ? 0 : safeZoneFee;
}

function getLang() {
  const stored = localStorage.getItem(LANG_KEY);
  return stored === "mk" ? "mk" : "sq";
}

function setLang(lang) {
  const next = lang === "mk" ? "mk" : "sq";
  localStorage.setItem(LANG_KEY, next);
  document.documentElement.lang = next;
}

function t(key) {
  const lang = getLang();
  return I18N[lang]?.[key] || I18N.sq[key] || key;
}

function setText(selector, value) {
  const el = document.querySelector(selector);
  if (el) el.textContent = value;
}

function setAttr(selector, attr, value) {
  const el = document.querySelector(selector);
  if (el) el.setAttribute(attr, value);
}

function relocateHeaderSearchForms() {
  const header = document.querySelector(".header");
  if (!header) return;
  const isMobile = window.matchMedia("(max-width: 760px)").matches;
  const headerActions = document.querySelector(".header .header-actions");
  if (!headerActions) return;

  let row = document.querySelector("#header-search-row");
  if (!row) {
    row = document.createElement("section");
    row.id = "header-search-row";
    row.className = "header-search-row";
    row.innerHTML = `
      <div class="container">
        <div class="header-search-slot"></div>
      </div>
    `;
    header.insertAdjacentElement("afterend", row);
  }

  const slot = row.querySelector(".header-search-slot");
  if (!slot) return;

  if (isMobile) {
    document.querySelectorAll(".header .header-actions form[data-search-form]").forEach((form) => {
      const input = form.querySelector("input[name='q']");
      if (input && !input.dataset.origStyle) {
        input.dataset.origStyle = input.getAttribute("style") || "";
      }
      if (input) input.removeAttribute("style");
      form.classList.add("header-search-form");
      form.dataset.relocated = "1";
      slot.appendChild(form);
    });
    row.style.display = slot.children.length > 0 ? "" : "none";
    return;
  }

  Array.from(slot.querySelectorAll("form[data-search-form]")).forEach((form) => {
    const input = form.querySelector("input[name='q']");
    if (input) {
      const oldStyle = input.dataset.origStyle || "";
      if (oldStyle) input.setAttribute("style", oldStyle);
      else input.removeAttribute("style");
    }
    form.classList.remove("header-search-form");
    form.dataset.relocated = "";
    headerActions.prepend(form);
  });
  row.style.display = "none";
}

function ensureLanguageSwitcher() {
  const actions = document.querySelector(".header .header-actions");
  if (!actions || actions.querySelector("#lang-switch")) return;
  const wrap = document.createElement("div");
  wrap.style.display = "inline-flex";
  wrap.style.alignItems = "center";
  wrap.style.gap = "8px";
  wrap.style.fontSize = "14px";
  wrap.style.fontWeight = "600";
  wrap.style.color = "#1f2e2b";
  wrap.style.background = "#fff";
  wrap.style.border = "1px solid #d7d2c7";
  wrap.style.borderRadius = "10px";
  wrap.style.height = "40px";
  wrap.style.padding = "0 8px";
  wrap.innerHTML = `
    <span id="lang-flag" style="display:inline-flex;align-items:center">
      <img src="./assets/flags/al.svg" alt="AL" style="width:22px;height:15px;object-fit:cover;border:1px solid rgba(0,0,0,.2)">
    </span>
    <span id="lang-label">${t("lang_label")}</span>
    <select id="lang-switch" style="height:34px;border:1px solid #d7d2c7;border-radius:8px;padding:0 8px;background:#fff;font-weight:600;min-width:68px">
      <option value="sq">AL</option>
      <option value="mk">MK</option>
    </select>
  `;
  actions.prepend(wrap);
  const select = wrap.querySelector("#lang-switch");
  const flag = wrap.querySelector("#lang-flag img");
  const label = wrap.querySelector("#lang-label");
  select.value = getLang();
  flag.src = getLang() === "mk" ? "./assets/flags/mk.svg" : "./assets/flags/al.svg";
  flag.alt = getLang() === "mk" ? "MK" : "AL";
  label.textContent = t("lang_label");
  select.addEventListener("change", () => {
    setLang(select.value);
    rerenderAll();
  });
}

function ensureInstagramFloatingButton() {
  let a = document.querySelector(".insta-float-btn");
  if (!a) {
    a = document.createElement("a");
    a.className = "insta-float-btn";
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.setAttribute("aria-label", "Instagram Vlera Home");
    a.innerHTML = `
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2Zm8.58 2a1.17 1.17 0 1 0 0 2.33 1.17 1.17 0 0 0 0-2.33ZM12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm0 2a3 3 0 1 1 0 6 3 3 0 0 1 0-6Z"/>
    </svg>
  `;
    document.body.appendChild(a);
  }
  a.href = state.settings.instagram_url || "https://www.instagram.com/vlerahomee?igsh=dDBudTY5dmwyM240";
}

function getWhatsAppUrl() {
  const rawPhone = String(state.settings.phone || "076 288 898");
  const digits = rawPhone.replace(/\D/g, "");
  if (!digits) return "https://wa.me/38376288887";
  const normalized = digits.startsWith("0") ? `383${digits.slice(1)}` : digits;
  return `https://wa.me/${normalized}`;
}

function ensureWhatsAppFloatingButton() {
  let a = document.querySelector(".wa-float-btn");
  if (!a) {
    a = document.createElement("a");
    a.className = "wa-float-btn";
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.setAttribute("aria-label", "WhatsApp Vlera Home");
    a.innerHTML = `
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M19.1 4.9A9.8 9.8 0 0 0 3.6 16.5L2 22l5.7-1.5a9.8 9.8 0 0 0 4.6 1.2h.1A9.9 9.9 0 0 0 19.1 4.9Zm-6.7 15.2h-.1a8.2 8.2 0 0 1-4.2-1.1l-.3-.2-3.4.9.9-3.3-.2-.3a8.2 8.2 0 1 1 7.3 4Zm4.5-6.1c-.2-.1-1.2-.6-1.4-.7-.2-.1-.3-.1-.5.1-.1.2-.5.7-.6.8-.1.1-.2.1-.4 0a6.7 6.7 0 0 1-2-1.2 7.3 7.3 0 0 1-1.4-1.8c-.1-.2 0-.3.1-.4l.3-.3.2-.3a.4.4 0 0 0 0-.4c0-.1-.5-1.3-.7-1.8-.2-.5-.4-.4-.5-.4h-.4a.8.8 0 0 0-.6.3c-.2.2-.8.8-.8 1.9s.8 2.1 1 2.3c.1.1 1.5 2.4 3.7 3.3.5.2.9.4 1.2.5.5.2.9.2 1.2.1.4-.1 1.2-.5 1.3-1 .2-.5.2-.9.1-1-.1-.1-.2-.1-.4-.2Z"/>
      </svg>
    `;
    document.body.appendChild(a);
  }
  a.href = getWhatsAppUrl();
}

function ensureGmailFloatingButton() {
  let a = document.querySelector(".gmail-float-btn");
  if (!a) {
    a = document.createElement("a");
    a.className = "gmail-float-btn";
    a.setAttribute("aria-label", "Gmail Vlera Home");
    a.innerHTML = gmailIconMarkup();
    document.body.appendChild(a);
  }
  a.href = getMailtoUrl();
}

function ensureInstagramDirectLinks() {
  const webUrl = state.settings.instagram_url || "https://www.instagram.com/vlerahomee?igsh=dDBudTY5dmwyM240";
  document.querySelectorAll(`a[href*="instagram.com"], .insta-link-only, .social-ig, #contact-instagram-link`).forEach((a) => {
    a.setAttribute("href", webUrl);
    a.setAttribute("target", "_blank");
    a.setAttribute("rel", "noopener noreferrer");
  });
}

function ensureTrustBar() {
  const header = document.querySelector(".header");
  if (!header || document.querySelector("#global-trust-bar")) return;
  const bar = document.createElement("div");
  bar.id = "global-trust-bar";
  bar.className = "trust-inline-bar";
  bar.innerHTML = `
    <div class="container trust-inline-inner">
      <span class="trust-pill" id="trust-cash-label">Vetem Cash ne Dorezim</span>
      <span class="trust-pill" id="trust-free-label">Poste falas mbi ${freeShippingThreshold()} EUR</span>
    </div>
  `;
  header.insertAdjacentElement("afterend", bar);
}

function applyBusinessSettings() {
  const phone = state.settings.phone || "076 288 898";
  const email = state.settings.email || getBusinessEmail();
  const instagramUrl = state.settings.instagram_url || "https://www.instagram.com/vlerahomee?igsh=dDBudTY5dmwyM240";

  const phoneEl = document.querySelector("#contact-phone-text");
  if (phoneEl) phoneEl.textContent = `Tel: ${phone}`;
  const emailEl = document.querySelector("#contact-email-text");
  if (emailEl) emailEl.textContent = `Email: ${email}`;
  const igEl = document.querySelector("#contact-instagram-link");
  if (igEl) igEl.setAttribute("href", instagramUrl);
  const waEl = document.querySelector("#contact-whatsapp-link");
  if (waEl) waEl.setAttribute("href", getWhatsAppUrl());

  ensureInstagramFloatingButton();
  ensureWhatsAppFloatingButton();
  ensureGmailFloatingButton();
  ensureInstagramDirectLinks();
  ensureWhatsAppDirectLinks();
  bindWhatsAppCaptureLinks();
  ensureGmailDirectLinks();
  applyI18n();
}

function applyI18n() {
  ensureLanguageSwitcher();
  const mk = getLang() === "mk";
  const switchFlag = document.querySelector("#lang-flag img");
  if (switchFlag) {
    switchFlag.src = mk ? "./assets/flags/mk.svg" : "./assets/flags/al.svg";
    switchFlag.alt = mk ? "MK" : "AL";
  }
  setText("#lang-label", t("lang_label"));
  setText(".header .nav a[href='index.html']", t("nav_home"));
  setText(".header .nav a[href='shop.html']", t("nav_shop"));
  setText(".header .nav a[href='categories.html']", t("nav_categories"));
  setText(".header .nav a[href='about.html']", t("nav_about"));
  setText(".header .nav a[href='contact.html']", t("nav_contact"));
  document.querySelectorAll("form[data-search-form] input[name='q']").forEach((el) => el.setAttribute("placeholder", t("search_placeholder")));
  setAttr(".header .cart-btn", "aria-label", t("nav_cart"));
  document.querySelectorAll(".lang-sq").forEach((el) => (el.style.display = getLang() === "sq" ? "" : "none"));
  document.querySelectorAll(".lang-mk").forEach((el) => (el.style.display = getLang() === "mk" ? "" : "none"));

  const page = (window.location.pathname.split("/").pop() || "index.html").toLowerCase();
  if (page === "shop.html") {
    setText(".topbar", mk ? "Prelistaj proizvodi" : "Shfleto produktet");
    setText(".page-head h1", mk ? "Prodavnica" : "Shop");
    setAttr("#shop-search", "placeholder", mk ? "Prebaraj proizvod..." : "Kerko produkt...");
    setText("#shop-category option[value='']", mk ? "Kategorija" : "Kategoria");
    setText("#shop-sort option[value='newest']", mk ? "Najnovi" : "Me te rejat");
    setText("#shop-sort option[value='price_asc']", mk ? "Cena rastacki" : "Cmimi ne rritje");
    setText("#shop-sort option[value='price_desc']", mk ? "Cena opagjacki" : "Cmimi ne ulje");
  }
  if (page === "categories.html") {
    setText(".topbar", mk ? "Kategorii na prodavnicata" : "Kategorite e dyqanit");
    setText(".page-head h1", mk ? "Site kategorii" : "Te gjitha kategorite");
  }
  if (page === "cart.html") {
    setText(".topbar", mk ? "Kosnicka" : "Shporta e klientit");
    setText(".page-head h1", mk ? "Kosnicka" : "Shporta");
    setText(".cart-layout aside h3", mk ? "Pregled" : "Permbledhje");
    setText(".cart-layout aside a.btn", mk ? "Prodolzi kon naplata" : "Vazhdo ne Checkout");
    setText("#i18n-cart-subtotal-label", mk ? "Megjuzbir" : "Nentotali");
    setText("#i18n-cart-shipping-label", mk ? "Dostava" : "Dergesa");
    setText("#i18n-cart-total-label", mk ? "Vkupno" : "Totali");
  }
  if (page === "checkout.html") {
    setText(".page-head h1", mk ? "Naplata" : "Checkout");
    setText("#checkout-form h3", mk ? "Podatoci za naracka" : "Te dhenat e porosise");
    setAttr("#checkout-form [name='fullName']", "placeholder", mk ? "Ime i Prezime" : "Emri dhe Mbiemri");
    setAttr("#checkout-form [name='phone']", "placeholder", mk ? "Telefonski broj" : "Numri i telefonit");
    setAttr("#checkout-form [name='city']", "placeholder", mk ? "Grad" : "Qyteti");
    setAttr("#checkout-form [name='address']", "placeholder", mk ? "Adresa" : "Adresa");
    setAttr("#checkout-form [name='social']", "placeholder", mk ? "Instagram/Facebook (opcionalno)" : "Instagram/Facebook (opsionale)");
    setAttr("#checkout-form [name='note']", "placeholder", mk ? "Dopolnitelna beleska" : "Shenim shtese");
    setText("#checkout-form [name='deliveryZone'] option[value='']", t("choose_zone"));
    setText("#checkout-form button[type='submit']", mk ? "Potvrdi naracka" : "Konfirmo porosine");
    setText("#i18n-checkout-topbar", mk ? "Plakjanje: Cash on Delivery / Payment on Post" : "Pagesa: Cash on Delivery / Payment on Post");
    setText("#i18n-checkout-summary-title", mk ? "Pregled" : "Permbledhja");
    setText("#i18n-checkout-subtotal-label", mk ? "Megjuzbir" : "Nentotali");
    setText("#i18n-checkout-shipping-label", mk ? "Posta" : "Posta");
    setText("#i18n-checkout-total-label", mk ? "Vkupno" : "Totali");
    setText("#mobile-checkout-submit", mk ? "Potvrdi naracka" : "Konfirmo porosine");
    setText("#checkout-trust-cash", mk ? "Samo kesh pri dostava" : "Vetem Cash ne Dorezim");
    setText("#checkout-trust-free", mk ? `Besplatna posta nad ${freeShippingThreshold()} EUR` : `Poste falas mbi ${freeShippingThreshold()} EUR`);
  }
  if (page === "contact.html") {
    setText(".topbar", mk ? "Kontakt" : "Kontakt");
    setText(".page-head h1", mk ? "Kontakt" : "Kontakt");
    setText("form.panel h3", mk ? "Pisi ni" : "Na shkruaj");
    setText("form.panel button", mk ? "Isprati poraka" : "Dergo Mesazhin");
    setText("aside.panel h3", mk ? "Detali" : "Detajet");
    setAttr("#i18n-contact-name", "placeholder", mk ? "Ime" : "Emri");
    setAttr("#i18n-contact-email", "placeholder", mk ? "E-posta" : "Email");
    setAttr("#i18n-contact-phone", "placeholder", mk ? "Telefon" : "Telefoni");
    setAttr("#i18n-contact-message", "placeholder", mk ? "Poraka" : "Mesazhi");
  }
  if (page === "search.html") {
    setText(".topbar", mk ? "Rezultati od prebaruvanje" : "Rezultatet e kerkimit");
    setText(".page-head h1", mk ? "Prebaruvanje" : "Kerkim");
  }
  if (page === "wishlist.html") {
    setText(".topbar", mk ? "Lista na zelbi" : "Wishlist");
    setText(".page-head h1", mk ? "Lista na zelbi" : "Wishlist");
  }
  if (page === "product.html") {
    setText(".topbar", mk ? "Detali za proizvod" : "Detajet e produktit");
    setText("#product-title-2", mk ? "Detali" : "Detajet");
    setText("#product-add-btn", mk ? "Dodaj vo kosnicka" : "Shto ne Shporte");
    setText("#i18n-product-info-1", mk ? "Plakjanje: Cash on Delivery / Payment on Post" : "Pagesa: Cash on Delivery / Payment on Post");
    setText("#i18n-product-info-2", mk ? "Dostava: 3-5 rabotni dena" : "Dergesa: 3-5 dite pune");
    setText("#i18n-product-info-3", mk ? "Garancija: Narackata se otvora pred postar vo prisustvo na kurir." : "Garanci: Porosia duhet te hapet para postes, ne pranine e korrierit. Nese porosia vjen e demtuar, behet kthimi i pageses ose zevendesimi me produkt te ri.");
  }
  if (page === "index.html") {
    setText("#i18n-hero-title", mk ? "Elegancija za sekoja trpeza" : "Elegance per cdo tryeze");
    setText("#i18n-hero-desc", mk ? "Otkrij ja nasata premium kolekcija za kujna i dekor." : "Zbulo koleksionin tone premium per kuzhine dhe dekor, me produkte elegante per cdo shtepi moderne.");
    setText("#i18n-hero-btn-products", mk ? "Vidi Proizvodi" : "Shiko Produktet");
    setText("#i18n-hero-btn-categories", mk ? "Vidi Kategorii" : "Shiko Kategorite");
    setText("#i18n-home-categories-title", mk ? "Glavni Kategorii" : "Kategorite Kryesore");
    setText("#i18n-home-categories-lead", mk ? "Istrazhi gi nasite kolekcii za stilen dom." : "Eksploro koleksionet tona te kuruara per nje shtepi me stil.");
    setText("#i18n-home-products-title", mk ? "Proizvodi" : "Produktet");
    setText("#i18n-home-products-lead", mk ? "Izberi premium proizvodi za kujna i dekor." : "Zgjidh produktet tona premium per kuzhine dhe dekor.");
    setText("#i18n-brand-location", "\uD83D\uDCCD Skopje");
    setText("#i18n-brand-tagline", mk ? "OPREMI GO DOMOT SO NAS!" : "SUPPLY YOUR HOME WITH US!");
    setText("#i18n-why-title", mk ? "Zosto VLERA" : "Pse te zgjedhni VLERA");
    setText("#i18n-why-lead", mk ? "Premium iskustvo vo sekoja naracka." : "Eksperience premium ne cdo porosi, nga cilesia deri te dorezimi.");
    setText("#i18n-why-1-title", mk ? "Premium Kvalitet" : "Cilesi Premium");
    setText("#i18n-why-1-desc", mk ? "Vnimatelno izbrani proizvodi so visok standard." : "Produkte te perzgjedhura me standard te larte per shtepi elegante.");
    setText("#i18n-why-2-title", mk ? "Brza Dostava" : "Dergese e Shpejte");
    setText("#i18n-why-2-desc", mk ? "Narackata se podgotvuva so vnimanie i stignuva navreme." : "Porosia juaj pergatitet me kujdes dhe dergohet ne kohe.");
    setText("#i18n-why-3-title", mk ? "Plakjanje pri Dostava" : "Pagese ne Dorezim");
    setText("#i18n-why-3-desc", mk ? "Cash on Delivery / Payment on Post za pobezbedno kupuvanje." : "Cash on Delivery / Payment on Post per blerje me te sigurt.");
    setText("#i18n-why-4-title", mk ? "Sigurna Poddrska" : "Sherbim i Besueshem");
    setText("#i18n-why-4-desc", mk ? "Jasna komunikacija i realna poddrska za sekoj klient." : "Komunikim i qarte dhe mbeshtetje reale per cdo klient.");
    setText("#i18n-best-title", mk ? "Najprodavani" : "Best Sellers");
    setText("#i18n-best-lead", mk ? "Najomileni proizvodi od nasite klienti." : "Produktet me te preferuara nga klientet tane.");
    setText("#i18n-new-title", mk ? "Novi Proizvodi" : "New Arrivals");
    setText("#i18n-new-lead", mk ? "Najnovi artikli vo kolekcijata VLERA." : "Artikujt me te rinj ne koleksionin VLERA.");
    setText("#i18n-shipping-title", mk ? "Trosoci za Dostava" : "Tarifat e Dergeses");
    setText("#i18n-shipping-lead", mk ? "Narackite se dostavuvaat so jasni i transparentni ceni." : "Porosite dergohen me kujdes ne rajon, me cmime te qarta dhe transparente.");
    setText("#i18n-ship-country-1", mk ? "Makedonija" : "Maqedoni");
    setText("#i18n-ship-country-2", mk ? "Kosovo" : "Kosove");
    setText("#i18n-ship-country-3", "Shqiperi");
    setText("#i18n-ship-country-4", mk ? "Bujanovac" : "Bujanoc");
    setText("#i18n-ship-label-1", mk ? "Tarifa za dostava" : "Tarifa e dergeses");
    setText("#i18n-ship-label-2", mk ? "Tarifa za dostava" : "Tarifa e dergeses");
    setText("#i18n-ship-label-3", mk ? "Tarifa za dostava" : "Tarifa e dergeses");
    setText("#i18n-ship-label-4", mk ? "Tarifa za dostava" : "Tarifa e dergeses");
    setText("#i18n-inst-title", mk ? "Sledi ne & Kontaktiraj ne" : "Na ndiqni & Kontaktoni");
    setText("#i18n-inst-lead", mk ? "@vlerahomee za novi proizvodi, ponudi i inspiracija." : "@vlerahomee per produkte te reja, oferta dhe inspirim ditor.");
    setText("#i18n-footer-desc", mk ? "Ednostavni naracki so Cash on Delivery / Payment on Post." : "Porosi te thjeshta me Cash on Delivery / Payment on Post.");
    setText("#i18n-footer-quick", mk ? "Brzo" : "Shpejt");
    setText("#i18n-footer-shop", mk ? "Prodavnica" : "Shop");
    setText("#i18n-footer-categories", mk ? "Kategorii" : "Kategorite");
    setText("#i18n-footer-checkout", mk ? "Naplata" : "Checkout");
    setText("#i18n-footer-info", "Info");
    setText("#i18n-footer-about", mk ? "Za Nas" : "Rreth Nesh");
    setText("#i18n-footer-contact", "Kontakt");
    setText("#i18n-footer-search", mk ? "Prebaraj" : "Kerko");
  }
  setText("#trust-cash-label", mk ? "Samo kesh pri dostava" : "Vetem Cash ne Dorezim");
  setText("#trust-free-label", mk ? `Besplatna posta nad ${freeShippingThreshold()} EUR` : `Poste falas mbi ${freeShippingThreshold()} EUR`);
}

function money(v) {
  return `${Number(v || 0).toFixed(2)} EUR`;
}

function fmtSkopjeDate(value) {
  if (!value) return "-";
  let raw = String(value).trim();
  if (!raw) return "-";
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(raw)) {
    raw = `${raw.replace(" ", "T")}Z`;
  }
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return "-";
  try {
    return new Intl.DateTimeFormat("sq-AL", {
      timeZone: "Europe/Skopje",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    }).format(d);
  } catch {
    return d.toLocaleString("sq-AL");
  }
}

function toImageUrl(path) {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  if (path.startsWith("/")) return `${API_ORIGIN}${path}`;
  return path;
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function showOrderSuccessNotice() {
  const mk = getLang() === "mk";
  const title = mk ? "Narackata e prifatena" : "Porosia u pranua";
  const text = mk
    ? "Faleminderit! Narackata e registrirana uspesno. Ke te kontaktojme shpejt."
    : "Faleminderit! Porosia juaj u regjistrua me sukses. Do t'ju kontaktojme shpejt.";

  const old = document.querySelector("#order-success-notice");
  if (old) old.remove();

  const wrap = document.createElement("div");
  wrap.id = "order-success-notice";
  wrap.className = "order-success-notice";
  wrap.innerHTML = `
    <div class="order-success-card">
      <div class="order-success-icon">✓</div>
      <h3>${title}</h3>
      <p>${text}</p>
    </div>
  `;
  document.body.appendChild(wrap);
}

function showContactSuccessNotice() {
  const mk = getLang() === "mk";
  const title = mk ? "Porakata e pratena" : "Mesazhi eshte derguar me sukses!";
  const text = mk
    ? "Faleminderit! Ke ve kontaktirame shpejt."
    : "Faleminderit! Do t'ju kontaktojme sa me shpejt.";

  const old = document.querySelector("#contact-success-notice");
  if (old) old.remove();

  const wrap = document.createElement("div");
  wrap.id = "contact-success-notice";
  wrap.className = "order-success-notice";
  wrap.innerHTML = `
    <div class="order-success-card">
      <div class="order-success-icon contact-success-icon">&#9993;</div>
      <h3>${title}</h3>
      <p>${text}</p>
    </div>
  `;
  wrap.addEventListener("click", () => wrap.remove());
  document.body.appendChild(wrap);
  setTimeout(() => wrap.remove(), 2200);
}

function showWhatsAppSuccessNotice() {
  const old = document.querySelector("#wa-success-notice");
  if (old) old.remove();
  const wrap = document.createElement("div");
  wrap.id = "wa-success-notice";
  wrap.className = "order-success-notice";
  wrap.innerHTML = `
    <div class="order-success-card">
      <div class="order-success-icon contact-success-icon">&#10003;</div>
      <h3>Mesazhi u dergua me sukses!</h3>
      <p>Faleminderit. Mesazhi juaj u ruajt dhe do t'ju kontaktojme shpejt.</p>
    </div>
  `;
  wrap.addEventListener("click", () => wrap.remove());
  document.body.appendChild(wrap);
  setTimeout(() => wrap.remove(), 2200);
}

function showInlineToast(message, type = "success") {
  const old = document.querySelector("#inline-toast");
  if (old) old.remove();
  const toast = document.createElement("div");
  toast.id = "inline-toast";
  toast.className = `inline-toast inline-toast--${type}`;
  toast.innerHTML = `
    <span class="inline-toast-icon">${type === "success" ? "✓" : "!"}</span>
    <span class="inline-toast-text">${escapeHtml(message)}</span>
  `;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add("show"));
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 220);
  }, 1700);
}

function getAdminToken() {
  return localStorage.getItem(ADMIN_TOKEN_KEY) || "";
}

function setAdminToken(token) {
  if (!token) return;
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
}

function clearAdminToken() {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
}

function isAdminPage() {
  const page = (window.location.pathname.split("/").pop() || "").toLowerCase();
  return page === "admin.html" || !!document.querySelector(".admin-shell");
}

function setAdminUiLocked(locked) {
  if (!isAdminPage()) return;
  const shell = document.querySelector("#admin-shell") || document.querySelector(".admin-shell");
  const auth = document.querySelector("#admin-auth-screen");
  if (shell) shell.classList.toggle("admin-shell--locked", !!locked);
  if (auth) auth.style.display = locked ? "grid" : "none";
}

async function adminLogin(email, password) {
  let response;
  try {
    response = await fetch(`${API_BASE}/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
  } catch {
    throw new Error("Backend nuk u lidh. Nise backend-in ne portin 4000.");
  }
  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }
  if (!response.ok || !payload.success) {
    const fallback = response.status === 404
      ? "Backend nuk eshte redeploy me /api/admin/login."
      : `Admin login deshtoi (HTTP ${response.status}).`;
    throw new Error(payload?.message || fallback);
  }
  return payload.data || {};
}

async function ensureAdminSession() {
  if (!isAdminPage()) return true;
  const token = getAdminToken();
  if (token) {
    setAdminUiLocked(false);
    return true;
  }

  setAdminUiLocked(true);
  const form = document.querySelector("#admin-login-form");
  const emailInput = document.querySelector("#admin-login-email");
  const passInput = document.querySelector("#admin-login-password");
  const passToggle = document.querySelector("#admin-password-toggle");
  const submitBtn = document.querySelector("#admin-login-submit");
  const errorEl = document.querySelector("#admin-login-error");

  if (!form || !emailInput || !passInput) {
    throw new Error("Forma e login admin mungon.");
  }

  if (passToggle && !passToggle.dataset.bound) {
    passToggle.dataset.bound = "1";
    passToggle.onclick = () => {
      const show = passInput.type === "password";
      passInput.type = show ? "text" : "password";
      passToggle.textContent = show ? "🙈" : "👁";
      passToggle.setAttribute("aria-label", show ? "Fsheh password" : "Shfaq password");
    };
  }

  errorEl.textContent = "";
  return new Promise((resolve) => {
    form.onsubmit = async (e) => {
      e.preventDefault();
      const email = String(emailInput.value || "").trim();
      const password = String(passInput.value || "").trim();
      if (!email || !password) {
        errorEl.textContent = "Shkruaj email dhe password.";
        return;
      }
      submitBtn.disabled = true;
      submitBtn.textContent = "Duke hyre...";
      errorEl.textContent = "";
      try {
        const data = await adminLogin(email, password);
        if (!data?.token) throw new Error("Token admin mungon.");
        setAdminToken(data.token);
        setAdminUiLocked(false);
        passInput.value = "";
        resolve(true);
      } catch (error) {
        errorEl.textContent = error?.message || "Login deshtoi.";
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Hyr ne Admin";
      }
    };
  });
}

function ensureWhatsAppDirectLinks() {
  const waUrl = getWhatsAppUrl();
  document.querySelectorAll(`a[href*="wa.me"], a[href*="api.whatsapp.com"], .wa-link-only, .social-wa, #contact-whatsapp-link`).forEach((a) => {
    a.setAttribute("href", waUrl);
    a.setAttribute("target", "_blank");
    a.setAttribute("rel", "noopener noreferrer");
  });
}

function ensureGmailDirectLinks() {
  const email = state.settings.email || getBusinessEmail();
  const mailto = `mailto:${email}`;

  document.querySelectorAll(".social-pair-inline").forEach((wrap) => {
    let a = wrap.querySelector(".gmail-link-only");
    if (!a) {
      a = document.createElement("a");
      a.className = "gmail-link-only";
      a.setAttribute("aria-label", "Gmail Vlera Home");
      wrap.appendChild(a);
    }
    a.innerHTML = gmailIconMarkup();
    a.setAttribute("href", mailto);
  });

  const socialList = document.querySelector(".social-ig")?.closest("ul");
  if (socialList) {
    let item = socialList.querySelector(".social-gmail")?.closest("li");
    if (!item) {
      item = document.createElement("li");
      item.innerHTML = `<a class="social-gmail" href="${mailto}">${gmailIconMarkup()}<span>${email}</span></a>`;
      socialList.appendChild(item);
    }
    const a = item.querySelector(".social-gmail");
    if (a) {
      a.setAttribute("href", mailto);
      const span = a.querySelector("span");
      if (span) span.textContent = email;
      if (!a.querySelector(".gmail-icon")) {
        a.insertAdjacentHTML("afterbegin", gmailIconMarkup());
      }
    }
  }

  const contactAside = document.querySelector("#contact-email-text")?.parentElement;
  if (contactAside) {
    const contactEmail = contactAside.querySelector("#contact-email-text");
    if (contactEmail) {
      contactEmail.innerHTML = `Email: <a class="gmail-inline-link" href="${mailto}">${gmailIconMarkup()}<span>${email}</span></a>`;
    }

    let row = contactAside.querySelector("#contact-gmail-row");
    if (!row) {
      row = document.createElement("p");
      row.id = "contact-gmail-row";
      row.style.fontSize = "18px";
      row.style.lineHeight = "1.9";
      row.innerHTML = `Gmail: <a id="contact-gmail-link" class="gmail-inline-link" href="${mailto}">${gmailIconMarkup()}<span>${email}</span></a>`;
      contactAside.appendChild(row);
    }
    const link = row.querySelector("#contact-gmail-link");
    if (link) {
      link.setAttribute("href", mailto);
      link.innerHTML = `${gmailIconMarkup()}<span>${email}</span>`;
    }
  }

  document.querySelectorAll("a[href^='mailto:']").forEach((a) => {
    a.setAttribute("href", mailto);
    if (!a.querySelector(".gmail-icon")) {
      const text = (a.textContent || "").trim() || email;
      a.innerHTML = `${gmailIconMarkup()}<span>${text}</span>`;
      a.classList.add("gmail-inline-link");
    }
  });
}

function getPageSourceName() {
  const file = (window.location.pathname.split("/").pop() || "index.html").toLowerCase();
  return file.replace(".html", "");
}

function ensureWhatsAppLeadModal() {
  let overlay = document.querySelector("#wa-lead-overlay");
  if (overlay) return overlay;
  overlay = document.createElement("div");
  overlay.id = "wa-lead-overlay";
  overlay.className = "wa-lead-overlay";
  overlay.innerHTML = `
    <div class="wa-lead-modal" role="dialog" aria-modal="true" aria-labelledby="wa-lead-title">
      <button class="wa-lead-close" type="button" aria-label="Mbyll">&times;</button>
      <h3 id="wa-lead-title">Kontakto Ne WhatsApp</h3>
      <p class="wa-lead-sub">Ju lutem plotesoni te dhenat. Mesazhi ruhet ne sistem dhe dergohet ne WhatsApp.</p>
      <form id="wa-lead-form" class="wa-lead-form">
        <label>
          Emri
          <input name="fullName" type="text" placeholder="Emri juaj">
        </label>
        <label>
          Telefoni
          <input name="phone" type="tel" placeholder="07X XXX XXX" required>
        </label>
        <label>
          Mesazhi
          <textarea name="message" rows="4" placeholder="Shkruani mesazhin tuaj..." required></textarea>
        </label>
        <div class="wa-lead-actions">
          <button type="button" class="btn wa-cancel-btn">Anulo</button>
          <button type="submit" class="btn btn-primary">Dergo Mesazhin</button>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(overlay);
  return overlay;
}

function openWhatsAppLeadModal(_defaultMessage = "", onSubmit) {
  const overlay = ensureWhatsAppLeadModal();
  const form = overlay.querySelector("#wa-lead-form");
  const closeBtn = overlay.querySelector(".wa-lead-close");
  const cancelBtn = overlay.querySelector(".wa-cancel-btn");
  const messageInput = form?.querySelector("[name='message']");
  if (!form || !messageInput) return;

  messageInput.value = "";
  overlay.classList.add("show");
  document.body.classList.add("wa-lead-open");
  setTimeout(() => form.querySelector("[name='fullName']")?.focus(), 30);

  const closeModal = () => {
    overlay.classList.remove("show");
    document.body.classList.remove("wa-lead-open");
  };

  const closeViaOverlay = (e) => {
    if (e.target === overlay) closeModal();
  };
  overlay.addEventListener("click", closeViaOverlay, { once: true });
  closeBtn.onclick = closeModal;
  cancelBtn.onclick = closeModal;

  form.onsubmit = async (e) => {
    e.preventDefault();
    const fullName = String(form.querySelector("[name='fullName']")?.value || "").trim();
    const phone = String(form.querySelector("[name='phone']")?.value || "").trim();
    const message = String(form.querySelector("[name='message']")?.value || "").trim();
    if (!phone || !message) {
      showInlineToast("Shkruaj telefonin dhe mesazhin.", "warn");
      return;
    }
    await onSubmit({ fullName, phone, message });
    closeModal();
  };
}

function bindWhatsAppCaptureLinks() {
  const selectors = [
    ".wa-link-only",
    ".social-wa",
    ".wa-float-btn",
    "#contact-whatsapp-link",
    `a[href*="wa.me"]`,
    `a[href*="api.whatsapp.com"]`
  ];
  document.querySelectorAll(selectors.join(",")).forEach((link) => {
    if (link.dataset.waCaptureBound === "1") return;
    link.dataset.waCaptureBound = "1";
    link.onclick = async (e) => {
      e.preventDefault();
      const defaultMessage = (link.getAttribute("data-whatsapp-text") || "").trim();
      openWhatsAppLeadModal(defaultMessage, async ({ fullName, phone, message }) => {
        try {
          await api("/whatsapp-messages", {
            method: "POST",
            body: JSON.stringify({
              full_name: fullName || "Klient Website",
              phone,
              message,
              source_page: getPageSourceName()
            })
          });
          showWhatsAppSuccessNotice();
        } catch (error) {
          console.error(error);
          showInlineToast("Mesazhi nuk u dergua.", "warn");
        }
      });
    };
  });
}

async function api(path, options = {}, retried = false) {
  const token = getAdminToken();
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    },
    ...options
  });
  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }
  if (!response.ok || !payload.success) {
    if (response.status === 401 && isAdminPage()) {
      clearAdminToken();
      if (!retried) {
        const okSession = await ensureAdminSession();
        if (okSession) {
          return api(path, options, true);
        }
      }
    }
    const fallback = `Request failed: ${path} (HTTP ${response.status})`;
    throw new Error(payload?.message || fallback);
  }
  return payload.data;
}

async function apiUploadImage(file) {
  if (!file) return "";
  const optimizeToWebp = async (sourceFile) => {
    if (!sourceFile || !sourceFile.type || !sourceFile.type.startsWith("image/")) return sourceFile;
    const type = sourceFile.type.toLowerCase();
    if (type === "image/webp" || type === "image/svg+xml" || type === "image/gif") return sourceFile;

    const objectUrl = URL.createObjectURL(sourceFile);
    try {
      const image = await new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = objectUrl;
      });

      const sourceW = Math.max(1, Number(image.naturalWidth || image.width || 1));
      const sourceH = Math.max(1, Number(image.naturalHeight || image.height || 1));
      const maxSide = 1800;
      const scale = Math.min(1, maxSide / Math.max(sourceW, sourceH));
      const targetW = Math.max(1, Math.round(sourceW * scale));
      const targetH = Math.max(1, Math.round(sourceH * scale));

      const canvas = document.createElement("canvas");
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext("2d", { alpha: false });
      if (!ctx) return sourceFile;
      ctx.drawImage(image, 0, 0, targetW, targetH);

      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/webp", 0.82));
      if (!blob) return sourceFile;

      const baseName = (sourceFile.name || "image").replace(/\.[^.]+$/, "");
      return new File([blob], `${baseName}.webp`, { type: "image/webp", lastModified: Date.now() });
    } catch {
      return sourceFile;
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  };

  const optimizedFile = await optimizeToWebp(file);
  const form = new FormData();
  form.append("image", optimizedFile);
  const token = getAdminToken();
  const response = await fetch(`${API_BASE}/uploads/image`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form
  });
  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }
  if (!response.ok || !payload?.success) throw new Error(payload?.message || `Image upload failed (HTTP ${response.status})`);
  return payload.data.path || "";
}

async function fetchProductsPage(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      query.set(key, String(value));
    }
  });
  return api(`/products?${query.toString()}`);
}

function getCart() {
  try {
    const raw = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

function getWishlist() {
  try {
    const raw = JSON.parse(localStorage.getItem(WISHLIST_KEY) || "[]");
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

function setWishlist(items) {
  localStorage.setItem(WISHLIST_KEY, JSON.stringify(items));
}

function isWish(productId) {
  return getWishlist().includes(productId);
}

async function toggleWishlist(productId) {
  const list = getWishlist();
  const idx = list.indexOf(productId);
  const isRemoving = idx >= 0;
  if (isRemoving) list.splice(idx, 1);
  else list.push(productId);
  setWishlist(list);
  try {
    await api(`/products/${productId}/${isRemoving ? "unlike" : "like"}`, { method: "POST" });
  } catch (error) {
    console.error(error);
  }
  if (document.querySelector("#wishlist-grid")) {
    await loadWishlistProducts();
  }
  rerenderAll();
}

function setCart(items) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  syncCartCount();
}

function syncCartCount() {
  const total = getCart().reduce((sum, x) => sum + (x.qty || 1), 0);
  document.querySelectorAll("[data-cart-count]").forEach((el) => {
    el.textContent = String(total);
  });
}

function addToCart(product) {
  const stockQty = Number(product.stock_qty ?? 0);
  if (stockQty <= 0) {
    showInlineToast("Produkti nuk ka stok.", "warn");
    return;
  }
  const cart = getCart();
  const found = cart.find((x) => x.id === product.id);
  if (found) {
    if (found.qty >= stockQty) {
      showInlineToast(`Nuk mund te shtosh me shume se stoku (${stockQty} cope).`, "warn");
      return;
    }
    found.qty += 1;
    found.stock_qty = stockQty;
  }
  else cart.push({ ...product, qty: 1 });
  setCart(cart);
  showInlineToast(t("added_to_cart"), "success");
}

function removeFromCart(id) {
  const cart = getCart().filter((x) => x.id !== id);
  setCart(cart);
  renderCartBlocks();
}

function changeQty(id, delta) {
  const cart = getCart();
  const item = cart.find((x) => x.id === id);
  if (!item) return;
  const stockQty = Number(item.stock_qty ?? 999);
  if (delta > 0 && Number.isFinite(stockQty) && stockQty >= 0 && item.qty >= stockQty) {
    showInlineToast(`Maksimumi ne stok: ${stockQty} cope.`, "warn");
    return;
  }
  item.qty = Math.max(1, item.qty + delta);
  setCart(cart);
  renderCartBlocks();
}

function categoryCard(category) {
  return `
    <a class="category-card" href="shop.html?category=${encodeURIComponent(category.name)}">
      <img src="${toImageUrl(category.image_path) || PLACEHOLDER_CATEGORY}" alt="${category.name}" loading="lazy" decoding="async" width="800" height="800">
      <div class="info">
        <h3>${category.name}</h3>
        <p>${category.description || t("click_category_products")}</p>
      </div>
    </a>
  `;
}

function productCard(product) {
  const hasDiscount = Number(product.discount_price || 0) > 0 && Number(product.discount_price) < Number(product.price);
  const price = hasDiscount ? Number(product.discount_price) : Number(product.price);
  const percent = hasDiscount ? Math.round(((Number(product.price) - Number(product.discount_price)) / Number(product.price)) * 100) : 0;
  const old = hasDiscount ? `<span class="old">${money(product.price)}</span>` : "";
  const badge = hasDiscount ? `<span class="discount-pill">-${percent}%</span>` : "";
  const sold = Number(product.sold_count || 0);
  const isTopSold = Number(product.is_best_seller || 0) === 1 || sold >= 3;
  const topSoldBadge = isTopSold ? `<span class="top-sold-badge">Top Sold</span>` : "";
  const stockQty = Number(product.stock_qty ?? 999);
  const isInStock = stockQty > 0;
  const stockBadge = !isInStock ? `<span class="top-sold-badge" style="background:#8a1221">Out of stock</span>` : "";
  const disabledAttr = isInStock ? "" : "disabled";
  return `
    <article class="product-card">
      <div class="product-media">
        <a class="product-media-link" href="product.html?id=${product.id}">
          <img src="${toImageUrl(product.image_path) || PLACEHOLDER_PRODUCT}" alt="${product.title}" loading="lazy" decoding="async" width="900" height="900">
        </a>
        ${topSoldBadge}
        ${stockBadge}
      </div>
      <div class="meta">
        <h3 class="product-title"><a class="product-title-link" href="product.html?id=${product.id}">${product.title}</a></h3>
        <div class="price product-price"><span class="price-current">${money(price)}</span>${old}${badge}</div>
        <div class="product-actions">
          <button class="wish-btn ${isWish(product.id) ? "active" : ""}" data-wish data-id="${product.id}" aria-label="Wishlist">${isWish(product.id) ? "&#9829;" : "&#9825;"}</button>
          <button class="small-btn primary" data-add-cart ${disabledAttr}
            data-id="${product.id}"
            data-title="${product.title}"
            data-price="${price}"
            data-image="${toImageUrl(product.image_path) || PLACEHOLDER_PRODUCT}"
            data-stock-qty="${stockQty}">
            <span class="add-cart-icon" aria-hidden="true">🛒</span>
            <span>${t("add_short")}</span>
          </button>
          <button class="small-btn buy-now-btn" data-buy-now ${disabledAttr}
            data-id="${product.id}"
            data-title="${product.title}"
            data-price="${price}"
            data-image="${toImageUrl(product.image_path) || PLACEHOLDER_PRODUCT}"
            data-stock-qty="${stockQty}">
            ${t("buy_now_short")}
          </button>
        </div>
      </div>
    </article>
  `;
}

function skeletonCards(count = 8) {
  return Array.from({ length: count })
    .map(
      () => `
      <article class="skeleton-card" aria-hidden="true">
        <div class="skeleton-media"></div>
        <div class="skeleton-body">
          <div class="skeleton-line w80"></div>
          <div class="skeleton-line w52"></div>
          <div class="skeleton-actions">
            <div class="skeleton-btn"></div>
            <div class="skeleton-btn"></div>
            <div class="skeleton-btn"></div>
          </div>
        </div>
      </article>
    `
    )
    .join("");
}

function showInitialSkeletons() {
  const maps = [
    { selector: "#home-products", count: 8 },
    { selector: "#home-bestsellers", count: 4 },
    { selector: "#home-newarrivals", count: 4 },
    { selector: "#shop-products", count: 8 },
    { selector: "#search-grid", count: 8 }
  ];
  maps.forEach(({ selector, count }) => {
    const wrap = document.querySelector(selector);
    if (!wrap) return;
    if ((wrap.innerHTML || "").trim()) return;
    wrap.innerHTML = skeletonCards(count);
  });
}

function bindAddButtons() {
  document.querySelectorAll("[data-add-cart]").forEach((btn) => {
    btn.onclick = () => {
      if (btn.disabled) return;
      addToCart({
        id: Number(btn.dataset.id),
        title: btn.dataset.title,
        price: Number(btn.dataset.price),
        image: btn.dataset.image || PLACEHOLDER_PRODUCT,
        stock_qty: Number(btn.dataset.stockQty || 0)
      });
    };
  });
  document.querySelectorAll("[data-buy-now]").forEach((btn) => {
    btn.onclick = () => {
      if (btn.disabled) return;
      if (Number(btn.dataset.stockQty || 0) <= 0) {
        alert("Produkti nuk ka stok.");
        return;
      }
      const product = {
        id: Number(btn.dataset.id),
        title: btn.dataset.title,
        price: Number(btn.dataset.price),
        image: btn.dataset.image || PLACEHOLDER_PRODUCT,
        stock_qty: Number(btn.dataset.stockQty || 0)
      };
      const cart = getCart();
      const found = cart.find((x) => x.id === product.id);
      if (found) {
        if (found.qty >= Number(product.stock_qty || 0)) {
          alert(`Nuk mund te shtosh me shume se stoku (${Number(product.stock_qty || 0)} cope).`);
          return;
        }
        found.qty += 1;
        found.stock_qty = Number(product.stock_qty || 0);
      }
      else cart.push({ ...product, qty: 1 });
      setCart(cart);
      window.location.href = "checkout.html";
    };
  });
}

function bindWishButtons() {
  document.querySelectorAll("[data-wish]").forEach((btn) => {
    btn.onclick = async () => {
      const id = Number(btn.dataset.id);
      await toggleWishlist(id);
    };
  });
}

async function loadHomeProducts({ append = false } = {}) {
  if (!document.querySelector("#home-products")) return;
  const nextPage = append ? state.homePagination.page + 1 : 1;
  const data = await fetchProductsPage({ page: nextPage, limit: state.homePagination.limit, sort: "newest" });
  const items = data.items || [];
  state.homeProducts = append ? [...state.homeProducts, ...items] : items;
  state.homePagination = data.pagination || { page: 1, totalPages: 1, total: state.homeProducts.length, limit: state.homePagination.limit };
}

async function loadHomeBestSellers({ append = false } = {}) {
  if (!document.querySelector("#home-bestsellers")) return;
  const nextPage = append ? state.bestPagination.page + 1 : 1;
  let mode = append ? state.bestMode : "flagged";
  let data = null;

  if (mode === "flagged") {
    data = await fetchProductsPage({
      page: nextPage,
      limit: state.bestPagination.limit,
      is_best_seller: 1,
      sort: "newest"
    });
    if (!append && !(data.items || []).length) {
      mode = "fallback";
      data = await fetchProductsPage({ page: 1, limit: state.bestPagination.limit, sort: "sold_desc" });
    }
  } else {
    data = await fetchProductsPage({ page: nextPage, limit: state.bestPagination.limit, sort: "sold_desc" });
  }

  const items = data.items || [];
  state.bestProducts = append ? [...state.bestProducts, ...items] : items;
  state.bestPagination = data.pagination || { page: 1, totalPages: 1, total: state.bestProducts.length, limit: state.bestPagination.limit };
  state.bestMode = mode;
}

async function loadHomeNewArrivals({ append = false } = {}) {
  if (!document.querySelector("#home-newarrivals")) return;
  const nextPage = append ? state.newPagination.page + 1 : 1;
  let mode = append ? state.newMode : "flagged";
  let data = null;

  if (mode === "flagged") {
    data = await fetchProductsPage({
      page: nextPage,
      limit: state.newPagination.limit,
      is_new_arrival: 1,
      sort: "newest"
    });
    if (!append && !(data.items || []).length) {
      mode = "fallback";
      data = await fetchProductsPage({ page: 1, limit: state.newPagination.limit, sort: "newest" });
    }
  } else {
    data = await fetchProductsPage({ page: nextPage, limit: state.newPagination.limit, sort: "newest" });
  }

  const items = data.items || [];
  state.newProducts = append ? [...state.newProducts, ...items] : items;
  state.newPagination = data.pagination || { page: 1, totalPages: 1, total: state.newProducts.length, limit: state.newPagination.limit };
  state.newMode = mode;
}

async function loadShopProducts({ append = false } = {}) {
  if (!document.querySelector("#shop-products")) return;
  const search = document.querySelector("#shop-search");
  const category = document.querySelector("#shop-category");
  const sort = document.querySelector("#shop-sort");
  const minPrice = document.querySelector("#shop-min-price");
  const maxPrice = document.querySelector("#shop-max-price");
  const topSoldOnly = document.querySelector("#shop-top-sold");
  const newOnly = document.querySelector("#shop-new-only");
  if (search) state.shopFilters.q = (search.value || "").trim();
  if (category) state.shopFilters.category = (category.value || "").trim();
  if (sort) state.shopFilters.sort = sort.value || "newest";
  if (minPrice) state.shopFilters.minPrice = (minPrice.value || "").trim();
  if (maxPrice) state.shopFilters.maxPrice = (maxPrice.value || "").trim();
  if (topSoldOnly) state.shopFilters.topSoldOnly = !!topSoldOnly.checked;
  if (newOnly) state.shopFilters.newOnly = !!newOnly.checked;
  const nextPage = append ? state.shopPagination.page + 1 : 1;
  const data = await fetchProductsPage({
    page: nextPage,
    limit: state.shopFilters.limit,
    q: state.shopFilters.q,
    category: state.shopFilters.category,
    sort: state.shopFilters.sort,
    min_price: state.shopFilters.minPrice,
    max_price: state.shopFilters.maxPrice,
    min_sold: state.shopFilters.topSoldOnly ? 3 : "",
    is_new_arrival: state.shopFilters.newOnly ? 1 : "",
    has_discount: state.shopFilters.discountOnly ? 1 : ""
  });
  const items = data.items || [];
  state.shopProducts = append ? [...state.shopProducts, ...items] : items;
  state.shopPagination = data.pagination || { page: 1, totalPages: 1, total: state.shopProducts.length, limit: state.shopFilters.limit };
  state.productTotal = Math.max(state.productTotal, Number(state.shopPagination.total || 0));
}

async function loadProductDetailsData() {
  const titleEl = document.querySelector("#product-title");
  if (!titleEl) return;
  const id = Number(new URLSearchParams(window.location.search).get("id"));
  if (!id) {
    state.productDetails = null;
    return;
  }
  state.productDetails = await api(`/products/${id}`);
}

async function loadRelatedProductsData() {
  const wrap = document.querySelector("#product-related");
  if (!wrap) return;
  const current = state.productDetails;
  if (!current) {
    state.relatedProducts = [];
    return;
  }

  const categoryData = await fetchProductsPage({
    page: 1,
    limit: 12,
    category: current.category_name || "",
    sort: "sold_desc"
  });
  let related = (categoryData.items || []).filter((x) => Number(x.id) !== Number(current.id));

  if (related.length < 4) {
    const fallbackData = await fetchProductsPage({ page: 1, limit: 12, sort: "newest" });
    const seen = new Set([Number(current.id), ...related.map((x) => Number(x.id))]);
    const extra = (fallbackData.items || []).filter((x) => !seen.has(Number(x.id)));
    related = [...related, ...extra];
  }

  state.relatedProducts = related.slice(0, 4);
}

async function loadSearchResultsData() {
  const grid = document.querySelector("#search-grid");
  if (!grid) return;
  const q = (new URLSearchParams(window.location.search).get("q") || "").toLowerCase().trim();
  if (!q) {
    state.searchProducts = [];
    return;
  }
  const data = await fetchProductsPage({ page: 1, limit: 48, q, sort: "newest" });
  state.searchProducts = data.items || [];
}

async function loadWishlistProducts() {
  const wrap = document.querySelector("#wishlist-grid");
  if (!wrap) return;
  const ids = getWishlist();
  if (!ids.length) {
    state.wishlistProducts = [];
    return;
  }
  const rows = await Promise.all(ids.map((id) => api(`/products/${id}`).catch(() => null)));
  state.wishlistProducts = rows.filter(Boolean);
}

async function loadAdminProducts({ append = false } = {}) {
  const body = document.querySelector("#admin-products-body");
  if (!body) return;
  const nextPage = append ? state.adminProductPagination.page + 1 : 1;
  let data = await fetchProductsPage({
    page: nextPage,
    limit: state.adminProductFilters.limit,
    sort: "newest",
    include_inactive: 1
  });
  if (data?.pagination?.totalPages && nextPage > data.pagination.totalPages) {
    state.adminProductFilters.page = data.pagination.totalPages;
    data = await fetchProductsPage({
      page: state.adminProductFilters.page,
      limit: state.adminProductFilters.limit,
      sort: "newest",
      include_inactive: 1
    });
  }
  state.adminProducts = append ? [...state.adminProducts, ...(data.items || [])] : (data.items || []);
  state.adminProductPagination = data.pagination || { page: 1, totalPages: 1, total: state.adminProducts.length, limit: state.adminProductFilters.limit };
  state.productTotal = Number(state.adminProductPagination.total || state.productTotal || 0);
}

function renderHomeCategories() {
  const wrap = document.querySelector("#home-categories");
  if (!wrap) return;
  const list = [...state.categories];
  const visible = Math.min(state.homeCategoriesVisible, list.length);
  wrap.innerHTML = visible ? list.slice(0, visible).map(categoryCard).join("") : `<div class="panel"><p class="lead" style="text-align:left;margin:0">${t("empty_categories")}</p></div>`;
  const btn = document.querySelector("#home-categories-more");
  if (btn) {
    const remain = Math.max(0, list.length - visible);
    if (remain > 0) {
      btn.textContent = getLang() === "mk" ? `Prikazhi poveke (${remain})` : `Shfaq me shume (${remain})`;
      btn.classList.remove("hidden");
      btn.disabled = false;
    } else {
      btn.classList.add("hidden");
      btn.disabled = true;
    }
  }
}

function renderCategoriesPage() {
  const wrap = document.querySelector("#categories-grid");
  if (!wrap) return;
  const list = [...state.categories];
  const visible = Math.min(state.categoriesPageVisible, list.length);
  wrap.innerHTML = visible ? list.slice(0, visible).map(categoryCard).join("") : `<div class="panel"><p class="lead" style="text-align:left;margin:0">${t("empty_categories")}</p></div>`;
  const btn = document.querySelector("#categories-more");
  if (btn) {
    const remain = Math.max(0, list.length - visible);
    if (remain > 0) {
      btn.textContent = getLang() === "mk" ? `Prikazhi poveke (${remain})` : `Shfaq me shume (${remain})`;
      btn.classList.remove("hidden");
      btn.disabled = false;
    } else {
      btn.classList.add("hidden");
      btn.disabled = true;
    }
  }
}

function renderHomeProducts() {
  const wrap = document.querySelector("#home-products");
  if (!wrap) return;
  const list = [...state.homeProducts];
  const visible = list.length;
  wrap.innerHTML = visible ? list.map(productCard).join("") : `<div class="panel"><p class="lead" style="text-align:left;margin:0">${t("empty_products_admin")}</p></div>`;
  const btn = document.querySelector("#home-products-more");
  if (btn) {
    const remain = Math.max(0, Number(state.homePagination.total || 0) - visible);
    if (state.homePagination.page < state.homePagination.totalPages && remain > 0) {
      btn.textContent = getLang() === "mk" ? `Prikazi povekje (${remain})` : `Shfaq me shume (${remain})`;
      btn.classList.remove("hidden");
      btn.disabled = false;
    } else {
      btn.classList.add("hidden");
      btn.disabled = true;
    }
  }
  bindAddButtons();
  bindWishButtons();
}

function renderHomeBestSellers() {
  const wrap = document.querySelector("#home-bestsellers");
  if (!wrap) return;
  const list = [...state.bestProducts];
  const visible = list.length;
  wrap.innerHTML = visible ? list.map(productCard).join("") : `<div class="panel"><p class="lead" style="text-align:left;margin:0">${t("empty_products")}</p></div>`;
  const btn = document.querySelector("#home-bestsellers-more");
  if (btn) {
    const remain = Math.max(0, Number(state.bestPagination.total || 0) - visible);
    if (state.bestPagination.page < state.bestPagination.totalPages && remain > 0) {
      btn.textContent = getLang() === "mk" ? `Prikazhi poveke (${remain})` : `Shfaq me shume (${remain})`;
      btn.classList.remove("hidden");
      btn.disabled = false;
    } else {
      btn.classList.add("hidden");
      btn.disabled = true;
    }
  }
  bindAddButtons();
  bindWishButtons();
}

function renderHomeNewArrivals() {
  const wrap = document.querySelector("#home-newarrivals");
  if (!wrap) return;
  const list = [...state.newProducts];
  const visible = list.length;
  wrap.innerHTML = visible ? list.map(productCard).join("") : `<div class="panel"><p class="lead" style="text-align:left;margin:0">${t("empty_products")}</p></div>`;
  const btn = document.querySelector("#home-newarrivals-more");
  if (btn) {
    const remain = Math.max(0, Number(state.newPagination.total || 0) - visible);
    if (state.newPagination.page < state.newPagination.totalPages && remain > 0) {
      btn.textContent = getLang() === "mk" ? `Prikazhi poveke (${remain})` : `Shfaq me shume (${remain})`;
      btn.classList.remove("hidden");
      btn.disabled = false;
    } else {
      btn.classList.add("hidden");
      btn.disabled = true;
    }
  }
  bindAddButtons();
  bindWishButtons();
}

function populateSelects() {
  const shopSelect = document.querySelector("#shop-category");
  const adminProductSelect = document.querySelector("#admin-product-category");
  const adminCategoryProfile = document.querySelector("#admin-category-profile-select");

  if (shopSelect) {
    const current = shopSelect.value;
    shopSelect.innerHTML = `<option value="">Kategoria</option>${state.categories.map((c) => `<option value="${c.name}">${c.name}</option>`).join("")}`;
    if (state.categories.some((c) => c.name === current)) {
      shopSelect.value = current;
    } else {
      const fromUrl = new URLSearchParams(window.location.search).get("category");
      if (fromUrl && state.categories.some((c) => c.name === fromUrl)) {
        shopSelect.value = fromUrl;
      }
    }
  }

  if (adminProductSelect) {
    const current = adminProductSelect.value;
    adminProductSelect.innerHTML = `<option value="">Zgjedh kategorine</option>${state.categories.map((c) => `<option value="${c.id}">${c.name}</option>`).join("")}`;
    if (state.categories.some((c) => String(c.id) === String(current))) adminProductSelect.value = current;
  }

  if (adminCategoryProfile) {
    const current = adminCategoryProfile.value;
    adminCategoryProfile.innerHTML = `<option value="">Zgjedh kategorine</option>${state.categories.map((c) => `<option value="${c.id}">${c.name}</option>`).join("")}`;
    if (state.categories.some((c) => String(c.id) === String(current))) adminCategoryProfile.value = current;
  }
}

function renderShopProducts() {
  const wrap = document.querySelector("#shop-products");
  if (!wrap) return;
  const items = [...state.shopProducts];
  const visible = items.length;
  wrap.innerHTML = items.length
    ? items.map(productCard).join("")
    : `<div class="panel"><p class="lead" style="text-align:left;margin:0">${getLang() === "mk" ? "Ne e pronajden nitu eden proizvod." : "Nuk u gjet asnje produkt."}</p></div>`;
  const btn = document.querySelector("#shop-products-more");
  if (btn) {
    const remain = Math.max(0, Number(state.shopPagination.total || 0) - visible);
    if (state.shopPagination.page < state.shopPagination.totalPages && remain > 0) {
      btn.textContent = getLang() === "mk" ? `Prikazi povekje (${remain})` : `Shfaq me shume (${remain})`;
      btn.classList.remove("hidden");
      btn.disabled = false;
    } else {
      btn.classList.add("hidden");
      btn.disabled = true;
    }
  }
  bindAddButtons();
  bindWishButtons();
}

function renderProductDetails() {
  const titleEl = document.querySelector("#product-title");
  if (!titleEl) return;
  const product = state.productDetails;
  if (!product) return;

  const hasDiscount = Number(product.discount_price || 0) > 0 && Number(product.discount_price) < Number(product.price);
  const price = hasDiscount ? Number(product.discount_price) : Number(product.price);
  const percent = hasDiscount ? Math.round(((Number(product.price) - Number(product.discount_price)) / Number(product.price)) * 100) : 0;
  titleEl.textContent = product.title;
  const img = document.querySelector("#product-image");
  const gallery = document.querySelector("#product-gallery");
  const allImages = [toImageUrl(product.image_path) || PLACEHOLDER_PRODUCT, ...((product.gallery_paths || []).map((x) => toImageUrl(x)).filter(Boolean))]
    .filter(Boolean)
    .filter((src, index, arr) => arr.indexOf(src) === index);
  if (img) img.src = allImages[0] || PLACEHOLDER_PRODUCT;
  if (gallery) {
    gallery.innerHTML = allImages
      .map(
        (src, index) => `
        <button type="button" class="${index === 0 ? "active" : ""}" data-product-thumb="${src}">
          <img src="${src}" alt="${product.title}" loading="lazy" decoding="async" width="96" height="96">
        </button>
      `
      )
      .join("");
    gallery.querySelectorAll("[data-product-thumb]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (img) img.src = btn.dataset.productThumb || PLACEHOLDER_PRODUCT;
        gallery.querySelectorAll("button").forEach((x) => x.classList.remove("active"));
        btn.classList.add("active");
      });
    });
  }
  const priceEl = document.querySelector("#product-price");
  if (priceEl) {
    priceEl.innerHTML = hasDiscount
      ? `<span class="price-current">${money(price)}</span> <span class="old">${money(product.price)}</span> <span class="discount-pill">-${percent}%</span>`
      : `<span class="price-current">${money(price)}</span>`;
  }
  const catEl = document.querySelector("#product-category");
  if (catEl) catEl.textContent = product.category_name || "Pa kategori";
  const descEl = document.querySelector("#product-description");
  if (descEl) descEl.textContent = product.description || "Produkt premium per kuzhine dhe dekor.";

  const addBtn = document.querySelector("#product-add-btn");
  if (addBtn) {
    const stockQty = Number(product.stock_qty ?? 999);
    addBtn.dataset.id = String(product.id);
    addBtn.dataset.title = product.title;
    addBtn.dataset.price = String(price);
    addBtn.dataset.image = allImages[0] || PLACEHOLDER_PRODUCT;
    addBtn.dataset.stockQty = String(stockQty);
    addBtn.disabled = stockQty <= 0;
    bindAddButtons();
  }
}

function renderCartBlocks() {
  const wrap = document.querySelector("#cart-items");
  const subtotalEl = document.querySelector("#cart-subtotal");
  const totalEl = document.querySelector("#cart-total");
  if (!wrap || !subtotalEl || !totalEl) return;
  const onCheckoutPage = window.location.pathname.endsWith("/checkout.html") || window.location.pathname.endsWith("checkout.html");

  const cart = getCart();
  if (!cart.length) {
    wrap.innerHTML = `<p class="lead" style="text-align:left;margin:0">${t("empty_cart")}</p>`;
    subtotalEl.textContent = money(0);
    const shippingEl = document.querySelector("#cart-shipping");
    if (shippingEl) shippingEl.textContent = money(0);
    totalEl.textContent = money(0);
    const mobileTotal = document.querySelector("#mobile-cart-total");
    if (mobileTotal) mobileTotal.textContent = money(0);
    const mobileSubmit = document.querySelector("#mobile-checkout-submit");
    if (mobileSubmit) mobileSubmit.disabled = true;
    return;
  }

  wrap.innerHTML = cart
    .map((item) => {
      const stockQty = Number(item.stock_qty);
      const reachedStock = Number.isFinite(stockQty) && stockQty >= 0 && Number(item.qty || 0) >= stockQty;
      const stockHtml = onCheckoutPage
        ? `<div class="badge" style="margin-top:6px">Stoku: ${Number.isFinite(stockQty) ? Math.max(0, stockQty) : "-"} cope</div>`
        : "";
      return `
      <div class="cart-item">
        <img src="${item.image || PLACEHOLDER_PRODUCT}" alt="${item.title}" loading="lazy" decoding="async" width="90" height="90">
        <div>
          <h3 style="margin:0 0 6px">${item.title}</h3>
          <div class="price">${money(item.price)}</div>
          ${onCheckoutPage ? `<div class="badge" style="margin-top:6px">Sasia: x${Number(item.qty || 1)}</div>` : ""}
          ${stockHtml}
          <div style="display:flex;gap:6px;margin-top:8px">
            <button class="small-btn" onclick="changeQty(${item.id},-1)">-</button>
            <button class="small-btn">${item.qty}</button>
            <button class="small-btn" onclick="changeQty(${item.id},1)" ${reachedStock ? "disabled" : ""}>+</button>
            <button class="small-btn" onclick="removeFromCart(${item.id})">Hiqe</button>
          </div>
        </div>
        <strong>${money(item.price * item.qty)}</strong>
      </div>
    `;
    })
    .join("");

  const subtotal = cart.reduce((sum, x) => sum + x.price * x.qty, 0);
  const zoneId = Number(document.querySelector("#checkout-form [name='deliveryZone']")?.value || 0);
  const zone = state.deliveryZones.find((x) => Number(x.id) === zoneId);
  const shippingFee = resolveShippingFee(subtotal, zone ? Number(zone.fee || 0) : 0);
  subtotalEl.textContent = money(subtotal);
  const shippingEl = document.querySelector("#cart-shipping");
  if (shippingEl) shippingEl.textContent = money(shippingFee);
  const freeShippingHint = document.querySelector("#free-shipping-hint");
  if (freeShippingHint) {
    const remain = Math.max(0, freeShippingThreshold() - subtotal);
    freeShippingHint.textContent =
      remain <= 0
        ? (getLang() === "mk" ? "Postata e besplatna za ovaa naracka." : `Posta falas per porosi mbi ${freeShippingThreshold()} EUR.`)
        : (getLang() === "mk"
            ? `Uste ${money(remain)} do besplatna posta.`
            : `Edhe ${money(remain)} per poste falas.`);
  }
  const grandTotal = subtotal + shippingFee;
  totalEl.textContent = money(grandTotal);
  const mobileTotal = document.querySelector("#mobile-cart-total");
  if (mobileTotal) mobileTotal.textContent = money(grandTotal);
  const mobileSubmit = document.querySelector("#mobile-checkout-submit");
  if (mobileSubmit) mobileSubmit.disabled = false;
}

function renderSearchResults() {
  const label = document.querySelector("#search-label");
  const grid = document.querySelector("#search-grid");
  if (!label || !grid) return;
  const q = (new URLSearchParams(window.location.search).get("q") || "").toLowerCase().trim();
  label.textContent = q ? `${t("search_results_for")}: "${q}"` : t("search_prompt");
  const items = [...state.searchProducts];
  grid.innerHTML = items.length ? items.map(productCard).join("") : `<div class="panel"><p class="lead" style="text-align:left;margin:0">${t("no_search_results")}</p></div>`;
  bindAddButtons();
  bindWishButtons();
}

function renderWishlistPage() {
  const wrap = document.querySelector("#wishlist-grid");
  if (!wrap) return;
  const items = [...state.wishlistProducts];
  wrap.innerHTML = items.length ? items.map(productCard).join("") : `<div class="panel"><p class="lead" style="text-align:left;margin:0">${t("empty_wishlist")}</p></div>`;
  bindAddButtons();
  bindWishButtons();
}

function renderAdminProducts() {
  const body = document.querySelector("#admin-products-body");
  if (!body) return;
  body.innerHTML = state.adminProducts.length
    ? state.adminProducts
        .map((p) => `
      <tr>
        <td>${p.id}</td>
        <td><img src="${toImageUrl(p.image_path) || PLACEHOLDER_PRODUCT}" alt="${p.title}" style="width:40px;height:40px;border-radius:6px;object-fit:cover"></td>
        <td>${p.title}</td>
        <td>${p.category_name || "-"}</td>
        <td>${money(Number(p.discount_price || 0) > 0 ? p.discount_price : p.price)}</td>
        <td>${Number(p.stock_qty || 0)}</td>
        <td>
          ${Number(p.likes_count || 0) > 0 ? `<span class="badge">Liked</span>` : ""}
          ${Number(p.is_new_arrival) === 1 ? `<span class="badge">New</span>` : ""}
          ${Number(p.is_best_seller) === 1 ? `<span class="badge">Best</span>` : ""}
          ${Number(p.sold_count || 0) > 0 ? `<span class="badge">${Number(p.sold_count)} sold</span>` : ""}
          ${Number(p.is_active || 0) === 1 ? `<span class="badge">Active</span>` : `<span class="badge" style="background:#fce7e7;color:#8a1221">Hidden</span>`}
        </td>
        <td class="admin-row-actions">
          <button class="small-btn" onclick="editProduct(${p.id})">Edit</button>
          <button class="small-btn" onclick="deleteProduct(${p.id})">Fshi</button>
        </td>
      </tr>`)
        .join("")
    : `<tr><td colspan="8">Nuk ka produkte ende.</td></tr>`;
}

function renderAdminProductPagination() {
  const info = document.querySelector("#products-page-info");
  const more = document.querySelector("#products-more");
  if (!info) return;
  const { page, totalPages, total } = state.adminProductPagination;
  const visible = state.adminProducts.length;
  const remain = Math.max(0, Number(total || 0) - visible);
  info.textContent = `${visible}/${total} produkte`;
  if (more) {
    if (page < totalPages && remain > 0) {
      more.textContent = `Shfaq me shume (${remain})`;
      more.classList.remove("hidden");
      more.disabled = false;
    } else {
      more.classList.add("hidden");
      more.disabled = true;
    }
  }
}

function renderAdminCategories() {
  const body = document.querySelector("#admin-categories-body");
  if (!body) return;
  const visible = Math.min(state.adminVisible.categories, state.categories.length);
  body.innerHTML = visible
    ? state.categories
        .slice(0, visible)
        .map((c) => `
      <tr>
        <td>${c.id}</td>
        <td><img src="${toImageUrl(c.image_path) || PLACEHOLDER_CATEGORY}" alt="${c.name}" style="width:40px;height:40px;border-radius:6px;object-fit:cover"></td>
        <td>${c.name}</td>
        <td>${c.description || "-"}</td>
        <td><button class="small-btn" onclick="deleteCategory(${c.id})">Fshi</button></td>
      </tr>`)
        .join("")
    : `<tr><td colspan="5">Nuk ka kategori ende.</td></tr>`;
  const more = document.querySelector("#categories-more-admin");
  if (more) {
    const remain = Math.max(0, state.categories.length - visible);
    if (remain > 0) {
      more.textContent = `Shfaq me shume (${remain})`;
      more.classList.remove("hidden");
      more.disabled = false;
    } else {
      more.classList.add("hidden");
      more.disabled = true;
    }
  }
}

function renderAdminDeliveryZones() {
  const body = document.querySelector("#admin-zones-body");
  if (!body) return;
  const visible = Math.min(state.adminVisible.zones, state.deliveryZones.length);
  body.innerHTML = visible
    ? state.deliveryZones
        .slice(0, visible)
        .map(
          (zone) => `
      <tr>
        <td>${zone.id}</td>
        <td>${zone.name}</td>
        <td>${money(zone.fee)}</td>
      </tr>`
        )
        .join("")
    : `<tr><td colspan="3">Nuk ka zona dergese ende.</td></tr>`;
  const more = document.querySelector("#zones-more-admin");
  if (more) {
    const remain = Math.max(0, state.deliveryZones.length - visible);
    if (remain > 0) {
      more.textContent = `Shfaq me shume (${remain})`;
      more.classList.remove("hidden");
      more.disabled = false;
    } else {
      more.classList.add("hidden");
      more.disabled = true;
    }
  }
}

function renderAdminOrders() {
  const body = document.querySelector("#admin-orders-body");
  if (!body) return;
  body.innerHTML = state.orders.length
    ? state.orders
        .map((order) => {
          const items = Array.isArray(order.items) ? order.items : [];
          const totalPieces = items.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
          const productsText = items.length
            ? `<div class="order-products-list">${items
                .map((item) => `<div>${item.product_title || "Produkt"} x${Number(item.quantity) || 1}</div>`)
                .join("")}</div>`
            : "-";
          const photosHtml = items.length
            ? `<div><div class="badge" style="margin-bottom:6px">${items.length} foto / ${totalPieces} cope</div><div class="order-photos-grid">${items
                .map((item) => {
                  const img = item?.product_image ? toImageUrl(item.product_image) : PLACEHOLDER_PRODUCT;
                  const title = item?.product_title || "Produkt";
                  return `<a href="${img}" target="_blank" rel="noopener noreferrer"><img src="${img}" alt="${title}" title="${title}" class="order-photo-thumb"></a>`;
                })
                .join("")}</div></div>`
            : "-";
          const createdAt = fmtSkopjeDate(order.created_at);
          return `
            <tr>
            <td>${order.order_number}</td>
            <td>${createdAt}</td>
            <td>${order.full_name}</td>
            <td>${order.phone || "-"}</td>
            <td>${productsText}</td>
            <td>${photosHtml}</td>
            <td>${order.city || "-"}</td>
            <td>${order.delivery_zone || "-"}</td>
            <td>${money(order.delivery_fee || 0)}</td>
            <td>${money(order.total)}</td>
            <td>
              <div class="admin-status-actions">
                <select class="small-btn" data-order-status-id="${order.id}">
                  ${["Pending", "Confirmed", "Shipped", "Delivered", "Cancelled"]
                    .map((status) => `<option value="${status}" ${order.status === status ? "selected" : ""}>${status}</option>`)
                    .join("")}
                </select>
                <button class="small-btn" type="button" data-order-status-save="${order.id}">Ruaj</button>
                <button class="small-btn" type="button" data-order-delete="${order.id}" style="border-color:#d69aa4;color:#92263a">Fshi</button>
              </div>
            </td>
          </tr>
          `;
        })
        .join("")
    : `<tr><td colspan="11">Nuk ka porosi ende.</td></tr>`;
}

function renderAdminCustomers() {
  const body = document.querySelector("#admin-customers-body");
  if (!body) return;
  const visible = Math.min(state.adminVisible.customers, state.customers.length);
  body.innerHTML = visible
    ? state.customers
        .slice(0, visible)
        .map(
          (customer) => `
        <tr>
          <td>${customer.id}</td>
          <td>${customer.full_name || "-"}</td>
          <td>${customer.phone || "-"}</td>
          <td>${customer.city || "-"}</td>
          <td>${customer.address || "-"}</td>
          <td>${Number(customer.total_orders || 0)}</td>
          <td><button class="small-btn" type="button" data-customer-delete="${customer.id}" style="border-color:#d69aa4;color:#92263a">Fshi</button></td>
        </tr>`
        )
        .join("")
    : `<tr><td colspan="7">Nuk ka kliente ende.</td></tr>`;
  const more = document.querySelector("#customers-more-admin");
  if (more) {
    const remain = Math.max(0, state.customers.length - visible);
    if (remain > 0) {
      more.textContent = `Shfaq me shume (${remain})`;
      more.classList.remove("hidden");
      more.disabled = false;
    } else {
      more.classList.add("hidden");
      more.disabled = true;
    }
  }
}

function renderAdminContactMessages() {
  const body = document.querySelector("#admin-contacts-body");
  if (!body) return;
  const visible = Math.min(state.adminVisible.contacts, state.contactMessages.length);
  body.innerHTML = visible
    ? state.contactMessages
        .slice(0, visible)
        .map(
          (msg) => `
        <tr>
          <td>${msg.id}</td>
          <td>${msg.full_name || "-"}</td>
          <td>${msg.phone || "-"}</td>
          <td>${msg.email || "-"}</td>
          <td>${msg.message || "-"}</td>
          <td>${fmtSkopjeDate(msg.created_at)}</td>
          <td><button class="small-btn" type="button" data-contact-delete="${msg.id}" style="border-color:#d69aa4;color:#92263a">Fshi</button></td>
        </tr>`
        )
        .join("")
    : `<tr><td colspan="7">Nuk ka mesazhe ende.</td></tr>`;
  const more = document.querySelector("#contacts-more-admin");
  if (more) {
    const remain = Math.max(0, state.contactMessages.length - visible);
    if (remain > 0) {
      more.textContent = `Shfaq me shume (${remain})`;
      more.classList.remove("hidden");
      more.disabled = false;
    } else {
      more.classList.add("hidden");
      more.disabled = true;
    }
  }
}

function renderAdminSettings() {
  const form = document.querySelector("#admin-settings-form");
  if (!form) return;
  form.querySelector("[name='storeName']").value = state.settings.store_name || "";
  form.querySelector("[name='phone']").value = state.settings.phone || "";
  form.querySelector("[name='email']").value = state.settings.email || "";
  form.querySelector("[name='instagramUrl']").value = state.settings.instagram_url || "";
  form.querySelector("[name='freeShippingThreshold']").value = Number(state.settings.free_shipping_threshold || FREE_SHIPPING_THRESHOLD_FALLBACK);
}

function renderAdminOrderPagination() {
  const info = document.querySelector("#orders-page-info");
  const more = document.querySelector("#orders-more");
  if (!info) return;
  const { page, totalPages, total } = state.orderPagination;
  const visible = state.orders.length;
  const remain = Math.max(0, Number(total || 0) - visible);
  info.textContent = `${visible}/${total} porosi`;
  if (more) {
    if (page < totalPages && remain > 0) {
      more.textContent = `Shfaq me shume (${remain})`;
      more.classList.remove("hidden");
      more.disabled = false;
    } else {
      more.classList.add("hidden");
      more.disabled = true;
    }
  }
}

function renderAdminStats() {
  const map = {
    "#kpi-products": state.productTotal,
    "#kpi-categories": state.categories.length,
    "#kpi-orders": state.orderStats.total_orders,
    "#kpi-pending": state.orderStats.pending_orders,
    "#kpi-customers": state.orderStats.total_customers
  };
  Object.entries(map).forEach(([selector, value]) => {
    const el = document.querySelector(selector);
    if (el) el.textContent = String(value);
  });
}

async function loadAdminOrders({ append = false } = {}) {
  const hasOrdersUI = document.querySelector("#admin-orders-body") || document.querySelector("#kpi-orders");
  if (!hasOrdersUI) return;
  const nextPage = append ? state.orderPagination.page + 1 : 1;
  const params = new URLSearchParams();
  params.set("page", String(nextPage));
  params.set("limit", String(state.orderFilters.limit));
  if (state.orderFilters.q) params.set("q", state.orderFilters.q);
  if (state.orderFilters.status) params.set("status", state.orderFilters.status);
  const data = await api(`/orders?${params.toString()}`);
  state.orders = append ? [...state.orders, ...(data.items || [])] : (data.items || []);
  state.orderPagination = data.pagination || { page: 1, totalPages: 1, total: state.orders.length, limit: state.orderFilters.limit };
  state.orderStats = data.stats || {
    total_orders: state.orders.length,
    pending_orders: state.orders.filter((x) => x.status === "Pending").length,
    total_customers: new Set(state.orders.map((x) => `${x.full_name}_${x.phone}`)).size
  };
}

async function loadAdminCustomers() {
  const hasCustomersUI = document.querySelector("#admin-customers-body");
  if (!hasCustomersUI) return;
  state.customers = await api("/customers");
}

async function loadAdminContactMessages() {
  const hasContactsUI = document.querySelector("#admin-contacts-body");
  if (!hasContactsUI) return;
  state.contactMessages = await api("/contacts");
}

async function loadAdminWhatsAppMessages() {
  const hasWhatsAppUI = document.querySelector("#admin-whatsapp-body");
  if (!hasWhatsAppUI) return;
  try {
    state.whatsappMessages = await api("/whatsapp-messages");
  } catch (error) {
    const msg = String(error?.message || "").toLowerCase();
    if (msg.includes("route not found") || msg.includes("http 404")) {
      state.whatsappMessages = [];
      return;
    }
    throw error;
  }
}

async function loadSettingsData() {
  try {
    const data = await api("/settings");
    state.settings = { ...state.settings, ...(data || {}) };
  } catch {
    // keep defaults if settings endpoint is not available yet
  }
}

async function loadCoreData() {
  try {
    const adminMode = isAdminPage();
    if (adminMode) {
      const okSession = await ensureAdminSession();
      if (!okSession) return;
    }
    await loadSettingsData();
    state.categories = await api("/categories");
    state.slides = await api("/slides");
    state.deliveryZones = await api("/delivery-zones");
    populateSelects();
    const tasks = [
      loadHomeProducts({ append: false }),
      loadHomeBestSellers(),
      loadHomeNewArrivals(),
      loadShopProducts({ append: false }),
      loadProductDetailsData(),
      loadSearchResultsData(),
      loadWishlistProducts()
    ];
    if (adminMode) {
      tasks.push(loadAdminProducts(), loadAdminOrders(), loadAdminCustomers(), loadAdminContactMessages(), loadAdminWhatsAppMessages());
    }
    await Promise.all(tasks);
    await loadRelatedProductsData();
    applyBusinessSettings();
  } catch (error) {
    console.error(error);
    const message = error?.message || "";
    if (message.includes("autorizuar") || message.includes("login")) {
      alert("Admin session skadoi. Rihyr ne admin.");
      window.location.href = "admin.html";
      return;
    }
    alert(`Admin error: ${message || "Backend nuk u lidh. Nise backend-in ne portin 4000."}`);
  }
}

function renderAdminWhatsAppMessages() {
  const body = document.querySelector("#admin-whatsapp-body");
  if (!body) return;
  const visible = Math.min(state.adminVisible.whatsapp, state.whatsappMessages.length);
  body.innerHTML = visible
    ? state.whatsappMessages
        .slice(0, visible)
        .map(
          (msg) => `
        <tr>
          <td>${msg.id}</td>
          <td>${msg.full_name || "-"}</td>
          <td>${msg.phone || "-"}</td>
          <td>${msg.message || "-"}</td>
          <td>${msg.source_page || "-"}</td>
          <td>${fmtSkopjeDate(msg.created_at)}</td>
          <td><button class="small-btn" type="button" data-whatsapp-delete="${msg.id}" style="border-color:#d69aa4;color:#92263a">Fshi</button></td>
        </tr>`
        )
        .join("")
    : `<tr><td colspan="7">Nuk ka WhatsApp mesazhe ende.</td></tr>`;
  const more = document.querySelector("#whatsapp-more-admin");
  if (more) {
    const remain = Math.max(0, state.whatsappMessages.length - visible);
    if (remain > 0) {
      more.textContent = `Shfaq me shume (${remain})`;
      more.classList.remove("hidden");
      more.disabled = false;
    } else {
      more.classList.add("hidden");
      more.disabled = true;
    }
  }
}

function renderProductRelated() {
  const wrap = document.querySelector("#product-related");
  if (!wrap) return;
  const list = [...state.relatedProducts];
  wrap.innerHTML = list.length
    ? list.map(productCard).join("")
    : `<div class="panel"><p class="lead" style="text-align:left;margin:0">${t("empty_products")}</p></div>`;
  bindAddButtons();
  bindWishButtons();
}

function populateDeliveryZones() {
  const select = document.querySelector("#checkout-form [name='deliveryZone']");
  if (!select) return;
  const current = select.value;
  select.innerHTML = `
    <option value="">${t("choose_zone")}</option>
    ${state.deliveryZones
      .map((zone) => `<option value="${zone.id}">${zone.name} (${money(zone.fee)})</option>`)
      .join("")}
  `;
  if (state.deliveryZones.some((zone) => String(zone.id) === String(current))) {
    select.value = current;
  }
}

function bootSearchForms() {
  document.querySelectorAll("[data-search-form]").forEach((form) => {
    if (form.dataset.smartReady === "1") return;
    form.dataset.smartReady = "1";
    const input = form.querySelector("input[name='q']");
    if (!input) return;

    const submitSearch = () => {
      const q = (input.value || "").trim();
      if (!q) return;
      window.location.href = `search.html?q=${encodeURIComponent(q)}`;
    };

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      submitSearch();
    });

    let suggest = form.querySelector(".search-suggest");
    if (!suggest) {
      suggest = document.createElement("div");
      suggest.className = "search-suggest hidden";
      form.appendChild(suggest);
    }

    let timer = null;
    let requestId = 0;
    const closeSuggest = () => suggest.classList.add("hidden");
    const openSuggest = () => suggest.classList.remove("hidden");

    const renderSuggest = (q, products, categories) => {
      const productItems = products
        .slice(0, 6)
        .map((p) => {
          const hasDiscount = Number(p.discount_price || 0) > 0 && Number(p.discount_price) < Number(p.price);
          const price = hasDiscount ? Number(p.discount_price) : Number(p.price);
          return `
            <div class="search-suggest-item" data-search-go="product.html?id=${p.id}">
              <img src="${toImageUrl(p.image_path) || PLACEHOLDER_PRODUCT}" alt="${escapeHtml(p.title)}" loading="lazy" decoding="async" width="56" height="56">
              <div class="search-suggest-text">
                <span class="search-suggest-title">${escapeHtml(p.title)}</span>
                <span class="search-suggest-sub">${escapeHtml(p.category_name || "Kategori")}</span>
              </div>
              <span class="search-suggest-price">${money(price)}</span>
            </div>
          `;
        })
        .join("");

      const categoryItems = categories
        .slice(0, 3)
        .map((c) => `<div class="search-suggest-cat" data-search-go="shop.html?category=${encodeURIComponent(c.name)}">Kategori: <strong>${escapeHtml(c.name)}</strong></div>`)
        .join("");

      const hasData = productItems || categoryItems;
      suggest.innerHTML = hasData
        ? `${productItems}${categoryItems}<div class="search-suggest-foot" data-search-go="search.html?q=${encodeURIComponent(q)}">Shiko te gjitha rezultatet</div>`
        : `<div class="search-suggest-foot" data-search-go="search.html?q=${encodeURIComponent(q)}">Nuk ka rezultate. Kliko per kerkimin e plote.</div>`;
    };

    const loadSuggest = async () => {
      const q = (input.value || "").trim();
      if (q.length < 2) {
        closeSuggest();
        return;
      }
      const currentRequest = ++requestId;
      try {
        const data = await fetchProductsPage({ page: 1, limit: 6, q, sort: "newest" });
        if (currentRequest !== requestId) return;
        const products = data.items || [];
        const lower = q.toLowerCase();
        const categories = state.categories.filter((c) => (c.name || "").toLowerCase().includes(lower));
        renderSuggest(q, products, categories);
        openSuggest();
      } catch {
        closeSuggest();
      }
    };

    input.addEventListener("input", () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(loadSuggest, 180);
    });
    input.addEventListener("focus", () => {
      if ((input.value || "").trim().length >= 2) loadSuggest();
    });
    input.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeSuggest();
    });

    suggest.addEventListener("click", (e) => {
      const row = e.target.closest("[data-search-go]");
      if (!row) return;
      window.location.href = row.dataset.searchGo;
    });

    document.addEventListener("click", (e) => {
      if (!form.contains(e.target)) closeSuggest();
    });
  });
}

function bootHeaderShrink() {
  const header = document.querySelector(".header");
  if (!header) return;
  const onScroll = () => {
    header.classList.toggle("shrink", window.scrollY > 18);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
}

function initMobileHamburgerMenu() {
  if (isAdminPage()) return;
  const header = document.querySelector(".header");
  const headerInner = document.querySelector(".header .header-inner");
  const nav = document.querySelector(".header .nav");
  if (!header || !headerInner || !nav) return;
  if (document.querySelector(".mobile-menu-toggle")) return;

  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "mobile-menu-toggle";
  toggle.setAttribute("aria-label", "Hap menune");
  toggle.setAttribute("aria-expanded", "false");
  toggle.innerHTML = "<span></span><span></span><span></span>";

  const overlay = document.createElement("div");
  overlay.className = "mobile-nav-overlay";

  const drawer = document.createElement("nav");
  drawer.className = "mobile-nav-drawer";
  drawer.setAttribute("aria-label", "Mobile navigation");

  const closeMenu = () => {
    document.body.classList.remove("mobile-nav-open");
    toggle.setAttribute("aria-expanded", "false");
  };

  const renderDrawerLinks = () => {
    const links = Array.from(nav.querySelectorAll("a"))
      .map((a) => `<a class="mobile-nav-link" href="${a.getAttribute("href") || "#"}">${a.textContent || ""}</a>`)
      .join("");
    drawer.innerHTML = `
      <div class="mobile-nav-head">
        <button type="button" class="mobile-nav-close" aria-label="Mbyll menune">&times;</button>
      </div>
      ${links}
    `;
    drawer.querySelector(".mobile-nav-close")?.addEventListener("click", closeMenu);
    drawer.querySelectorAll("a").forEach((a) => a.addEventListener("click", closeMenu));
  };

  const openMenu = () => {
    renderDrawerLinks();
    document.body.classList.add("mobile-nav-open");
    toggle.setAttribute("aria-expanded", "true");
  };

  toggle.addEventListener("click", () => {
    if (document.body.classList.contains("mobile-nav-open")) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  overlay.addEventListener("click", closeMenu);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMenu();
  });
  window.addEventListener("resize", () => {
    if (window.innerWidth > 980) closeMenu();
  });

  headerInner.insertBefore(toggle, headerInner.firstChild);
  header.appendChild(overlay);
  header.appendChild(drawer);
}

function bootRevealAnimations() {
  const targets = document.querySelectorAll(
    "main > .section, .page-head, .hero-copy, .brand-box, .shipping-box, .insta-box, .why-card"
  );
  if (!targets.length) return;
  targets.forEach((el) => el.classList.add("reveal-on-scroll"));

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-inview");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
  );

  targets.forEach((el) => observer.observe(el));
}

function bootSlider() {
  const slider = document.querySelector("#hero-slider");
  const slides = Array.from(document.querySelectorAll("#hero-slider-track img"));
  const dots = Array.from(document.querySelectorAll("#hero-slider-dots span"));
  const prev = document.querySelector("#hero-prev");
  const next = document.querySelector("#hero-next");
  if (!slides.length) return;
  if (sliderTimer) {
    clearInterval(sliderTimer);
    sliderTimer = null;
  }
  let idx = 0;
  const restartAuto = () => {
    if (sliderTimer) clearInterval(sliderTimer);
    if (slides.length <= 1) return;
    sliderTimer = setInterval(() => {
      idx = (idx + 1) % slides.length;
      paint();
    }, 4200);
  };
  const paint = () => {
    slides.forEach((x, i) => x.classList.toggle("active", i === idx));
    dots.forEach((x, i) => x.classList.toggle("active", i === idx));
  };
  const go = (step) => {
    idx = (idx + step + slides.length) % slides.length;
    paint();
    restartAuto();
  };
  paint();
  dots.forEach((dot, i) => {
    dot.onclick = () => {
      idx = i;
      paint();
      restartAuto();
    };
  });
  if (prev) prev.onclick = () => go(-1);
  if (next) next.onclick = () => go(1);
  if (slider) {
    slider.onmouseenter = () => {
      if (sliderTimer) {
        clearInterval(sliderTimer);
        sliderTimer = null;
      }
    };
    slider.onmouseleave = () => restartAuto();
  }
  restartAuto();
}

function renderHeroSlides() {
  const track = document.querySelector("#hero-slider-track");
  const dots = document.querySelector("#hero-slider-dots");
  if (!track || !dots) return;

  const slides = state.slides.length
    ? state.slides
    : [
        { image_path: "./assets/placeholders/hero.svg", caption: "" },
        { image_path: "./assets/placeholders/promo.svg", caption: "" }
      ];

  slides.forEach((slide) => {
    const src = toImageUrl(slide.image_path) || PLACEHOLDER_PRODUCT;
    const preload = new Image();
    preload.decoding = "async";
    preload.src = src;
  });

  track.innerHTML = slides
    .map(
      (slide, index) => `
        <img class="${index === 0 ? "active" : ""}" src="${toImageUrl(slide.image_path) || PLACEHOLDER_PRODUCT}" alt="${slide.caption || "Slider"}" loading="${index === 0 ? "eager" : "lazy"}" decoding="async" fetchpriority="${index === 0 ? "high" : "auto"}" width="1600" height="900">
      `
    )
    .join("");

  dots.innerHTML = slides.map((_, index) => `<span class="${index === 0 ? "active" : ""}"></span>`).join("");
  bootSlider();
}

function bootAdminNavigation() {
  const links = Array.from(document.querySelectorAll("[data-admin-nav]"));
  const pages = Array.from(document.querySelectorAll("[data-admin-page]"));
  if (!links.length || !pages.length) return;

  const showPage = (pageId) => {
    pages.forEach((page) => page.classList.toggle("active", page.dataset.adminPage === pageId));
    links.forEach((link) => link.classList.toggle("active", link.dataset.adminNav === pageId));
  };

  const fromHash = (window.location.hash || "").replace("#", "").trim();
  const initial = links.some((link) => link.dataset.adminNav === fromHash) ? fromHash : links[0].dataset.adminNav;
  showPage(initial);

  links.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const target = link.dataset.adminNav;
      if (!target) return;
      showPage(target);
      history.replaceState(null, "", `#${target}`);
    });
  });
}

function bootContactForm() {
  const form = document.querySelector("#contact-form");
  if (!form) return;
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fullName = form.querySelector("[name='fullName']")?.value.trim() || "";
    const email = form.querySelector("[name='email']")?.value.trim() || "";
    const phone = form.querySelector("[name='phone']")?.value.trim() || "";
    const message = form.querySelector("[name='message']")?.value.trim() || "";
    if (!fullName || !message) {
      alert("Ploteso emrin dhe mesazhin.");
      return;
    }
    try {
      await api("/contacts", {
        method: "POST",
        body: JSON.stringify({
          full_name: fullName,
          email,
          phone,
          message
        })
      });
      form.reset();
      showContactSuccessNotice();
    } catch (error) {
      alert(error.message || "Mesazhi nuk u dergua.");
    }
  });
}

function bootShopFilters() {
  const search = document.querySelector("#shop-search");
  const category = document.querySelector("#shop-category");
  const sort = document.querySelector("#shop-sort");
  const minPrice = document.querySelector("#shop-min-price");
  const maxPrice = document.querySelector("#shop-max-price");
  const topSoldOnly = document.querySelector("#shop-top-sold");
  const newOnly = document.querySelector("#shop-new-only");
  const resetBtn = document.querySelector("#shop-reset-filters");
  const chipButtons = Array.from(document.querySelectorAll("[data-shop-chip]"));
  if (!search || !category || !sort) return;
  const urlCategory = new URLSearchParams(window.location.search).get("category");
  if (urlCategory) category.value = urlCategory;

  const syncChipState = () => {
    chipButtons.forEach((btn) => {
      const chip = btn.dataset.shopChip;
      let active = false;
      if (chip === "top") active = !!state.shopFilters.topSoldOnly;
      if (chip === "new") active = !!state.shopFilters.newOnly;
      if (chip === "under25") active = String(state.shopFilters.maxPrice) === "25" && String(state.shopFilters.minPrice || "") === "";
      if (chip === "under50") active = String(state.shopFilters.maxPrice) === "50" && String(state.shopFilters.minPrice || "") === "";
      if (chip === "discount") active = !!state.shopFilters.discountOnly;
      btn.classList.toggle("active", active);
    });
  };

  const applyFiltersAndReload = async () => {
    state.shopFilters.q = (search.value || "").trim();
    state.shopFilters.category = (category.value || "").trim();
    state.shopFilters.sort = sort.value || "newest";
    state.shopFilters.minPrice = (minPrice?.value || "").trim();
    state.shopFilters.maxPrice = (maxPrice?.value || "").trim();
    state.shopFilters.topSoldOnly = !!topSoldOnly?.checked;
    state.shopFilters.newOnly = !!newOnly?.checked;
    state.shopFilters.page = 1;
    syncChipState();
    await loadShopProducts({ append: false });
    renderShopProducts();
  };

  const applyChip = async (chip) => {
    if (chip === "top" && topSoldOnly) topSoldOnly.checked = !topSoldOnly.checked;
    if (chip === "new" && newOnly) newOnly.checked = !newOnly.checked;
    if (chip === "under25" && maxPrice) {
      if (String(maxPrice.value || "") === "25" && String(minPrice?.value || "") === "") {
        maxPrice.value = "";
      } else {
        if (minPrice) minPrice.value = "";
        maxPrice.value = "25";
      }
    }
    if (chip === "under50" && maxPrice) {
      if (String(maxPrice.value || "") === "50" && String(minPrice?.value || "") === "") {
        maxPrice.value = "";
      } else {
        if (minPrice) minPrice.value = "";
        maxPrice.value = "50";
      }
    }
    if (chip === "discount") {
      state.shopFilters.discountOnly = !state.shopFilters.discountOnly;
    }
    if (chip === "clear") {
      search.value = "";
      category.value = "";
      sort.value = "newest";
      if (minPrice) minPrice.value = "";
      if (maxPrice) maxPrice.value = "";
      if (topSoldOnly) topSoldOnly.checked = false;
      if (newOnly) newOnly.checked = false;
      state.shopFilters.discountOnly = false;
    }
    await applyFiltersAndReload();
  };

  [search, category, sort, minPrice, maxPrice, topSoldOnly, newOnly].filter(Boolean).forEach((el) => {
    el.addEventListener("input", applyFiltersAndReload);
    el.addEventListener("change", applyFiltersAndReload);
  });
  chipButtons.forEach((btn) => {
    btn.addEventListener("click", async () => applyChip(btn.dataset.shopChip));
  });
  if (resetBtn) {
    resetBtn.addEventListener("click", async () => {
      search.value = "";
      category.value = "";
      sort.value = "newest";
      if (minPrice) minPrice.value = "";
      if (maxPrice) maxPrice.value = "";
      if (topSoldOnly) topSoldOnly.checked = false;
      if (newOnly) newOnly.checked = false;
      state.shopFilters.discountOnly = false;
      await applyFiltersAndReload();
    });
  }
  syncChipState();
}

async function bootCheckout() {
  const form = document.querySelector("#checkout-form");
  if (!form) return;
  document.body.classList.add("checkout-has-sticky");
  const mobileSubmit = document.querySelector("#mobile-checkout-submit");
  if (mobileSubmit) {
    mobileSubmit.addEventListener("click", () => form.requestSubmit());
  }
  form.querySelector("[name='deliveryZone']")?.addEventListener("change", renderCartBlocks);
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const cart = getCart();
    if (!cart.length) return alert(t("empty_cart"));

    const fullName = form.querySelector("[name='fullName']").value.trim();
    const phone = form.querySelector("[name='phone']").value.trim();
    const deliveryZoneId = Number(form.querySelector("[name='deliveryZone']").value || 0);
    const city = form.querySelector("[name='city']").value.trim();
    const address = form.querySelector("[name='address']").value.trim();
    const social = form.querySelector("[name='social']").value.trim();
    const note = form.querySelector("[name='note']").value.trim();
    if (!fullName || !phone || !deliveryZoneId || !city || !address) return alert(t("fill_required"));
    const payload = {
      customer: {
        full_name: fullName,
        phone,
        city,
        address,
        social_name: social,
        note
      },
      items: cart.map((x) => ({
        product_id: x.id,
        quantity: x.qty
      })),
      delivery_zone_id: deliveryZoneId
    };

    try {
      await api("/orders", { method: "POST", body: JSON.stringify(payload) });
      setCart([]);
      showOrderSuccessNotice();
      await new Promise((resolve) => setTimeout(resolve, 1400));
      window.location.href = "index.html";
    } catch (error) {
      alert(error.message);
    }
  });
}

async function bootAdmin() {
  if (!isAdminPage()) return;
  const okSession = await ensureAdminSession();
  if (!okSession) return;
  const logoutLink = document.querySelector("#admin-logout-link");
  if (logoutLink) {
    logoutLink.onclick = (e) => {
      e.preventDefault();
      clearAdminToken();
      setAdminUiLocked(true);
      window.location.href = "admin.html";
    };
  }
  bootAdminNavigation();
  const ordersSearch = document.querySelector("#admin-orders-search");
  const ordersStatus = document.querySelector("#admin-orders-status");
  const ordersMore = document.querySelector("#orders-more");
  const ordersBody = document.querySelector("#admin-orders-body");
  const customersBody = document.querySelector("#admin-customers-body");
  const contactsBody = document.querySelector("#admin-contacts-body");
  const whatsappBody = document.querySelector("#admin-whatsapp-body");
  const productsMore = document.querySelector("#products-more");
  const settingsForm = document.querySelector("#admin-settings-form");
  const slidesMore = document.querySelector("#slides-more-admin");
  const categoriesMore = document.querySelector("#categories-more-admin");
  const zonesMore = document.querySelector("#zones-more-admin");
  const customersMore = document.querySelector("#customers-more-admin");
  const contactsMore = document.querySelector("#contacts-more-admin");
  const whatsappMore = document.querySelector("#whatsapp-more-admin");

  const refreshOrders = async () => {
    await loadAdminOrders();
    renderAdminOrders();
    renderAdminOrderPagination();
    renderAdminStats();
  };
  const refreshProducts = async () => {
    await loadAdminProducts();
    renderAdminProducts();
    renderAdminProductPagination();
    renderAdminStats();
  };
  const refreshCustomers = async () => {
    await loadAdminCustomers();
    renderAdminCustomers();
  };
  const refreshContacts = async () => {
    await loadAdminContactMessages();
    renderAdminContactMessages();
  };
  const refreshWhatsApp = async () => {
    await loadAdminWhatsAppMessages();
    renderAdminWhatsAppMessages();
  };
  const refreshSettings = async () => {
    await loadSettingsData();
    renderAdminSettings();
    applyBusinessSettings();
  };

  if (ordersSearch) {
    ordersSearch.addEventListener("input", async () => {
      state.orderFilters.q = ordersSearch.value.trim();
      state.orderFilters.page = 1;
      state.orders = [];
      await refreshOrders();
    });
  }

  if (ordersStatus) {
    ordersStatus.addEventListener("change", async () => {
      state.orderFilters.status = ordersStatus.value;
      state.orderFilters.page = 1;
      state.orders = [];
      await refreshOrders();
    });
  }

  if (ordersMore) {
    ordersMore.addEventListener("click", async () => {
      if (state.orderPagination.page >= state.orderPagination.totalPages) return;
      await loadAdminOrders({ append: true });
      renderAdminOrders();
      renderAdminOrderPagination();
      renderAdminStats();
    });
  }

  if (ordersBody) {
    ordersBody.addEventListener("click", async (e) => {
      const deleteBtn = e.target.closest("[data-order-delete]");
      if (deleteBtn) {
        const id = Number(deleteBtn.getAttribute("data-order-delete"));
        if (!id) return;
        const okDelete = window.confirm("A je i sigurt qe don me fshi kete porosi? Stoku do te rikthehet.");
        if (!okDelete) return;
        try {
          await api(`/orders/${id}`, { method: "DELETE" });
          await refreshOrders();
        } catch (error) {
          alert(error.message || "Porosia nuk u fshi.");
        }
        return;
      }

      const saveBtn = e.target.closest("[data-order-status-save]");
      if (!saveBtn) return;
      const id = Number(saveBtn.getAttribute("data-order-status-save"));
      if (!id) return;
      const select = ordersBody.querySelector(`[data-order-status-id="${id}"]`);
      const status = select?.value || "";
      if (!status) return;
      try {
        await api(`/orders/${id}/status`, {
          method: "PATCH",
          body: JSON.stringify({ status })
        });
        await refreshOrders();
      } catch (error) {
        alert(error.message || "Statusi nuk u ruajt.");
      }
    });
  }

  if (customersBody) {
    customersBody.addEventListener("click", async (e) => {
      const deleteBtn = e.target.closest("[data-customer-delete]");
      if (!deleteBtn) return;
      const id = Number(deleteBtn.getAttribute("data-customer-delete"));
      if (!id) return;
      const okDelete = window.confirm("A je i sigurt qe don me fshi kete klient?");
      if (!okDelete) return;
      try {
        await api(`/customers/${id}`, { method: "DELETE" });
        await loadAdminCustomers();
        renderAdminCustomers();
      } catch (error) {
        alert(error.message || "Klienti nuk u fshi.");
      }
    });
  }

  if (contactsBody) {
    const deleteContactMessage = async (id) => {
      try {
        await api("/contacts/delete", {
          method: "POST",
          body: JSON.stringify({ id })
        });
        return;
      } catch (_) {
      }
      try {
        await api(`/contacts/${id}`, { method: "DELETE" });
        return;
      } catch (_) {
      }
      await api(`/contacts?id=${id}`, { method: "DELETE" });
    };

    contactsBody.addEventListener("click", async (e) => {
      const deleteBtn = e.target.closest("[data-contact-delete]");
      if (!deleteBtn) return;
      const id = Number(deleteBtn.getAttribute("data-contact-delete"));
      if (!id) return;
      const okDelete = window.confirm("A je i sigurt qe don me fshi kete mesazh?");
      if (!okDelete) return;
      try {
        await deleteContactMessage(id);
        await loadAdminContactMessages();
        renderAdminContactMessages();
      } catch (error) {
        alert(error.message || "Mesazhi nuk u fshi.");
      }
    });
  }

  if (whatsappBody) {
    whatsappBody.addEventListener("click", async (e) => {
      const deleteBtn = e.target.closest("[data-whatsapp-delete]");
      if (!deleteBtn) return;
      const id = Number(deleteBtn.getAttribute("data-whatsapp-delete"));
      if (!id) return;
      const okDelete = window.confirm("A je i sigurt qe don me fshi kete WhatsApp mesazh?");
      if (!okDelete) return;
      try {
        await api(`/whatsapp-messages/${id}`, { method: "DELETE" });
        await refreshWhatsApp();
      } catch (error) {
        alert(error.message || "WhatsApp mesazhi nuk u fshi.");
      }
    });
  }

  if (productsMore) {
    productsMore.addEventListener("click", async () => {
      if (state.adminProductPagination.page >= state.adminProductPagination.totalPages) return;
      await loadAdminProducts({ append: true });
      renderAdminProducts();
      renderAdminProductPagination();
      renderAdminStats();
    });
  }

  if (slidesMore) {
    slidesMore.addEventListener("click", () => {
      state.adminVisible.slides += ADMIN_STEP;
      renderAdminSlides();
    });
  }
  if (categoriesMore) {
    categoriesMore.addEventListener("click", () => {
      state.adminVisible.categories += ADMIN_STEP;
      renderAdminCategories();
    });
  }
  if (zonesMore) {
    zonesMore.addEventListener("click", () => {
      state.adminVisible.zones += ADMIN_STEP;
      renderAdminDeliveryZones();
    });
  }
  if (customersMore) {
    customersMore.addEventListener("click", () => {
      state.adminVisible.customers += ADMIN_STEP;
      renderAdminCustomers();
    });
  }
  if (contactsMore) {
    contactsMore.addEventListener("click", () => {
      state.adminVisible.contacts += ADMIN_STEP;
      renderAdminContactMessages();
    });
  }
  if (whatsappMore) {
    whatsappMore.addEventListener("click", () => {
      state.adminVisible.whatsapp += ADMIN_STEP;
      renderAdminWhatsAppMessages();
    });
  }

  if (settingsForm) {
    settingsForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      try {
        const payload = {
          store_name: settingsForm.querySelector("[name='storeName']").value.trim(),
          phone: settingsForm.querySelector("[name='phone']").value.trim(),
          email: settingsForm.querySelector("[name='email']").value.trim(),
          instagram_url: settingsForm.querySelector("[name='instagramUrl']").value.trim(),
          free_shipping_threshold: Number(settingsForm.querySelector("[name='freeShippingThreshold']").value || 0)
        };
        state.settings = await api("/settings", {
          method: "PUT",
          body: JSON.stringify(payload)
        });
        await refreshSettings();
        alert("Business settings u ruajten.");
      } catch (error) {
        alert(error.message || "Business settings nuk u ruajten.");
      }
    });
  }

  const slideForm = document.querySelector("#admin-slide-form");
  if (slideForm) {
    slideForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      try {
        const caption = slideForm.querySelector("[name='caption']").value.trim();
        const file = slideForm.querySelector("[name='image']").files?.[0];
        if (!file) return alert("Zgjedh nje foto per slide.");
        const imagePath = await apiUploadImage(file);
        await api("/slides", {
          method: "POST",
          body: JSON.stringify({ image_path: imagePath, caption })
        });
        slideForm.reset();
        await loadCoreData();
        rerenderAll();
      } catch (error) {
        alert(error.message);
      }
    });
  }

  const categoryForm = document.querySelector("#admin-category-form");
  if (categoryForm) {
    categoryForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      try {
        const name = categoryForm.querySelector("[name='name']").value.trim();
        const description = categoryForm.querySelector("[name='description']").value.trim();
        const file = categoryForm.querySelector("[name='image']").files?.[0];
        const imagePath = await apiUploadImage(file);
        await api("/categories", {
          method: "POST",
          body: JSON.stringify({ name, description, image_path: imagePath })
        });
        categoryForm.reset();
        await loadCoreData();
        rerenderAll();
      } catch (error) {
        alert(error.message);
      }
    });
  }

  const categoryProfileForm = document.querySelector("#admin-category-profile-form");
  if (categoryProfileForm) {
    categoryProfileForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      try {
        const id = Number(categoryProfileForm.querySelector("[name='categoryId']").value);
        const category = state.categories.find((x) => x.id === id);
        if (!category) return alert("Zgjedh nje kategori.");
        const description = categoryProfileForm.querySelector("[name='description']").value.trim();
        const file = categoryProfileForm.querySelector("[name='image']").files?.[0];
        const uploaded = file ? await apiUploadImage(file) : category.image_path;
        await api(`/categories/${id}`, {
          method: "PUT",
          body: JSON.stringify({
            name: category.name,
            description,
            image_path: uploaded || ""
          })
        });
        categoryProfileForm.reset();
        await loadCoreData();
        rerenderAll();
      } catch (error) {
        alert(error.message);
      }
    });
  }

  const productForm = document.querySelector("#admin-product-form");
  if (productForm) {
    resetProductFormMode(productForm);
    productForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      try {
        const productId = Number(productForm.querySelector("[name='productId']").value || 0);
        const title = productForm.querySelector("[name='title']").value.trim();
        const categoryId = Number(productForm.querySelector("[name='category']").value);
        const price = Number(productForm.querySelector("[name='price']").value || 0);
        const discountPrice = Number(productForm.querySelector("[name='discountPrice']").value || 0);
        const description = productForm.querySelector("[name='description']").value.trim();
        const isNewArrival = productForm.querySelector("[name='isNewArrival']").checked ? 1 : 0;
        const isBestSeller = productForm.querySelector("[name='isBestSeller']").checked ? 1 : 0;
        const stockQty = Number(productForm.querySelector("[name='stockQty']").value || 0);
        const isActive = productForm.querySelector("[name='isActive']").checked ? 1 : 0;
        const file = productForm.querySelector("[name='image']").files?.[0];
        const galleryFiles = Array.from(productForm.querySelector("[name='galleryImages']").files || []);
        const uploadedImage = file ? await apiUploadImage(file) : "";
        const uploadedGallery = galleryFiles.length ? await Promise.all(galleryFiles.map((x) => apiUploadImage(x))) : [];
        const imagePath = uploadedImage || productForm.dataset.editingImagePath || "";
        const soldCount = productId ? Number(productForm.dataset.editingSoldCount || 0) : 0;
        const existingGallery = (() => {
          try {
            return JSON.parse(productForm.dataset.editingGalleryPaths || "[]");
          } catch {
            return [];
          }
        })();
        const galleryPaths = (uploadedGallery.length ? uploadedGallery : existingGallery).filter(Boolean);
        const payload = {
          category_id: categoryId,
          title,
          price,
          discount_price: discountPrice,
          description,
          image_path: imagePath,
          gallery_paths: galleryPaths,
          is_new_arrival: isNewArrival,
          is_best_seller: isBestSeller,
          sold_count: soldCount,
          stock_qty: stockQty,
          is_active: isActive
        };

        if (productId) {
          await api(`/products/${productId}`, {
            method: "PUT",
            body: JSON.stringify(payload)
          });
        } else {
          await api("/products", {
            method: "POST",
            body: JSON.stringify(payload)
          });
        }
        productForm.reset();
        resetProductFormMode(productForm);
        await loadCoreData();
        rerenderAll();
      } catch (error) {
        alert(error.message);
      }
    });
    document.querySelector("#admin-product-cancel-edit")?.addEventListener("click", () => {
      productForm.reset();
      resetProductFormMode(productForm);
    });
  }

  document.querySelector("#btn-clear-orders")?.addEventListener("click", async () => {
    const okDelete = window.confirm("A je i sigurt? Do te fshihen te gjitha porosite dhe do rikthehet stoku.");
    if (!okDelete) return;
    try {
      await api("/orders", { method: "DELETE" });
      await refreshOrders();
      await refreshCustomers();
      await refreshProducts();
      alert("Te gjitha porosite u fshine me sukses.");
    } catch (error) {
      alert(error.message || "Nuk u arrit te fshihen porosite.");
    }
  });

  document.querySelector("#btn-clear-products")?.addEventListener("click", async () => {
    const okDelete = window.confirm("A je i sigurt? Do te fshihen te gjitha produktet.");
    if (!okDelete) return;
    try {
      await api("/products", { method: "DELETE" });
      await loadCoreData();
      rerenderAll();
      alert("Te gjitha produktet u fshine me sukses.");
    } catch (error) {
      alert(error.message || "Nuk u arrit te fshihen produktet.");
    }
  });

  document.querySelector("#btn-reset-storage")?.addEventListener("click", () => {
    localStorage.removeItem(CART_KEY);
    syncCartCount();
    alert("Shporta lokale u pastrua.");
  });

  await refreshCustomers();
  await refreshContacts();
  await refreshSettings();
}

function resetProductFormMode(form) {
  if (!form) return;
  const productIdInput = form.querySelector("[name='productId']");
  if (productIdInput) productIdInput.value = "";
  const stockInput = form.querySelector("[name='stockQty']");
  if (stockInput) stockInput.value = "999";
  const activeInput = form.querySelector("[name='isActive']");
  if (activeInput) activeInput.checked = true;
  form.dataset.editingImagePath = "";
  form.dataset.editingSoldCount = "0";
  form.dataset.editingGalleryPaths = "[]";
  const submitBtn = form.querySelector(".admin-product-submit");
  if (submitBtn) submitBtn.textContent = "Ruaj Produktin";
}

function editProduct(id) {
  const form = document.querySelector("#admin-product-form");
  const product = state.adminProducts.find((x) => Number(x.id) === Number(id));
  if (!form || !product) return;
  form.querySelector("[name='productId']").value = String(product.id);
  form.querySelector("[name='title']").value = product.title || "";
  form.querySelector("[name='category']").value = String(product.category_id || "");
  form.querySelector("[name='price']").value = String(Number(product.price || 0));
  form.querySelector("[name='discountPrice']").value = String(Number(product.discount_price || 0));
  form.querySelector("[name='description']").value = product.description || "";
  form.querySelector("[name='isNewArrival']").checked = Number(product.is_new_arrival || 0) === 1;
  form.querySelector("[name='isBestSeller']").checked = Number(product.is_best_seller || 0) === 1;
  form.querySelector("[name='stockQty']").value = String(Number(product.stock_qty || 0));
  form.querySelector("[name='isActive']").checked = Number(product.is_active || 0) === 1;
  form.dataset.editingImagePath = product.image_path || "";
  form.dataset.editingSoldCount = String(Number(product.sold_count || 0));
  form.dataset.editingGalleryPaths = JSON.stringify(Array.isArray(product.gallery_paths) ? product.gallery_paths : []);
  const submitBtn = form.querySelector(".admin-product-submit");
  if (submitBtn) submitBtn.textContent = "Perditeso Produktin";
  document.querySelector('[data-admin-nav="products"]')?.click();
  window.location.hash = "#products";
  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function deleteProduct(id) {
  try {
    await api(`/products/${id}`, { method: "DELETE" });
    await loadCoreData();
    rerenderAll();
  } catch (error) {
    alert(error.message);
  }
}

async function deleteCategory(id) {
  try {
    await api(`/categories/${id}`, { method: "DELETE" });
    await loadCoreData();
    rerenderAll();
  } catch (error) {
    alert(error.message);
  }
}

async function deleteSlide(id) {
  try {
    await api(`/slides/${id}`, { method: "DELETE" });
    await loadCoreData();
    rerenderAll();
  } catch (error) {
    alert(error.message);
  }
}

function renderAdminSlides() {
  const body = document.querySelector("#admin-slides-body");
  if (!body) return;
  const visible = Math.min(state.adminVisible.slides, state.slides.length);
  body.innerHTML = visible
    ? state.slides
        .slice(0, visible)
        .map(
          (slide) => `
        <tr>
          <td>${slide.id}</td>
          <td><img src="${toImageUrl(slide.image_path) || PLACEHOLDER_PRODUCT}" alt="slide" style="width:56px;height:40px;border-radius:6px;object-fit:cover"></td>
          <td>${slide.caption || "-"}</td>
          <td><button class="small-btn" onclick="deleteSlide(${slide.id})">Fshi</button></td>
        </tr>`
        )
        .join("")
    : `<tr><td colspan="4">Nuk ka slide ende.</td></tr>`;
  const more = document.querySelector("#slides-more-admin");
  if (more) {
    const remain = Math.max(0, state.slides.length - visible);
    if (remain > 0) {
      more.textContent = `Shfaq me shume (${remain})`;
      more.classList.remove("hidden");
      more.disabled = false;
    } else {
      more.classList.add("hidden");
      more.disabled = true;
    }
  }
}

function prepareAdminTablesForMobile() {
  if (!isAdminPage()) return;
  document.querySelectorAll(".admin-main .table").forEach((table) => {
    const headers = Array.from(table.querySelectorAll("thead th")).map((th) => (th.textContent || "").trim());
    table.classList.add("admin-table-mobile");
    table.querySelectorAll("tbody tr").forEach((row) => {
      Array.from(row.children).forEach((cell, index) => {
        if (!cell.getAttribute("data-label")) {
          cell.setAttribute("data-label", headers[index] || "");
        }
      });
    });
  });
}

function rerenderAll() {
  renderHeroSlides();
  populateSelects();
  populateDeliveryZones();
  renderHomeCategories();
  renderCategoriesPage();
  renderHomeProducts();
  renderHomeBestSellers();
  renderHomeNewArrivals();
  renderShopProducts();
  renderProductDetails();
  renderProductRelated();
  renderCartBlocks();
  renderSearchResults();
  renderWishlistPage();
  renderAdminCategories();
  renderAdminDeliveryZones();
  renderAdminSlides();
  renderAdminProducts();
  renderAdminProductPagination();
  renderAdminOrders();
  renderAdminOrderPagination();
  renderAdminCustomers();
  renderAdminContactMessages();
  renderAdminWhatsAppMessages();
  renderAdminSettings();
  renderAdminStats();
  prepareAdminTablesForMobile();
  applyI18n();
}

document.addEventListener("DOMContentLoaded", async () => {
  if (isAdminPage()) {
    clearAdminToken();
    setAdminUiLocked(true);
  }
  relocateHeaderSearchForms();
  window.addEventListener("resize", relocateHeaderSearchForms);
  setLang(getLang());
  document.querySelectorAll("[data-year]").forEach((el) => (el.textContent = String(new Date().getFullYear())));
  syncCartCount();
  bootSearchForms();
  bootHeaderShrink();
  initMobileHamburgerMenu();
  bootRevealAnimations();
  bootSlider();
  ensureInstagramFloatingButton();
  ensureInstagramDirectLinks();
  ensureTrustBar();
  showInitialSkeletons();
  bootContactForm();
  bootShopFilters();
  document.querySelector("#home-products-more")?.addEventListener("click", async () => {
    await loadHomeProducts({ append: true });
    renderHomeProducts();
  });
  document.querySelector("#home-categories-more")?.addEventListener("click", () => {
    state.homeCategoriesVisible += CATEGORY_STEP;
    renderHomeCategories();
  });
  document.querySelector("#categories-more")?.addEventListener("click", () => {
    state.categoriesPageVisible += CATEGORY_STEP;
    renderCategoriesPage();
  });
  document.querySelector("#home-bestsellers-more")?.addEventListener("click", async () => {
    await loadHomeBestSellers({ append: true });
    renderHomeBestSellers();
  });
  document.querySelector("#home-newarrivals-more")?.addEventListener("click", async () => {
    await loadHomeNewArrivals({ append: true });
    renderHomeNewArrivals();
  });
  document.querySelector("#shop-products-more")?.addEventListener("click", async () => {
    await loadShopProducts({ append: true });
    renderShopProducts();
  });
  await loadCoreData();
  await bootCheckout();
  await bootAdmin();
  rerenderAll();
});

window.deleteProduct = deleteProduct;
window.editProduct = editProduct;
window.deleteCategory = deleteCategory;
window.deleteSlide = deleteSlide;
window.changeQty = changeQty;
window.removeFromCart = removeFromCart;









