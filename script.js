const API_BASE = "";
const TIMEOUT_MS = 12_000;
const isApiConfigured = Boolean(API_BASE && !API_BASE.includes("example.com"));

const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const searchResult = document.getElementById("searchResult");

const categoryFilter = document.getElementById("categoryFilter");
const sortFilter = document.getElementById("sortFilter");
const yearFilter = document.getElementById("yearFilter");
const applyFiltersBtn = document.getElementById("applyFiltersBtn");

const totalExportEl = document.getElementById("totalExport");
const topProductEl = document.getElementById("topProduct");
const topDestinationEl = document.getElementById("topDestination");
const fastestGrowingEl = document.getElementById("fastestGrowing");

const productList = document.getElementById("productList");
const exportChartCanvas = document.getElementById("exportChart");
const categoryPieCanvas = document.getElementById("categoryPieChart");
const countryBarCanvas = document.getElementById("countryBarChart");

const contactForm = document.getElementById("contactForm");
const contactStatus = document.getElementById("contactStatus");

let exportChart = null;
let categoryPieChart = null;
let countryBarChart = null;

let currentQuery = "";
let currentCategory = "all";
let currentSort = "desc";
let currentYear = "";

const MOCK = {
  stats: {
    totalExport: 50000000000,
    topProduct: "Rice",
    topDestination: "UAE",
    fastestGrowing: "Organic Spices"
  },
  products: [
    { id: 1, name: "Rice", category: "cereals", year: 2024, value: 12000000000, desc: "High quality rice exported worldwide." },
    { id: 2, name: "Spices (Mixed)", category: "spices", year: 2024, value: 9000000000, desc: "Aromatic spices with global demand." },
    { id: 3, name: "Tea", category: "spices", year: 2024, value: 4000000000, desc: "Renowned Indian teas shipped globally." },
    { id: 4, name: "Mangoes", category: "fruits", year: 2024, value: 2100000000, desc: "Seasonal fresh mango exports." }
  ],
  graph: {
    yearly: {
      years: [2021, 2022, 2023, 2024],
      values: [32000000000, 36000000000, 42000000000, 50000000000]
    },
    category: {
      labels: ["Cereals", "Spices", "Tea", "Fruits"],
      values: [40, 28, 15, 17]
    },
    countries: {
      labels: ["UAE", "USA", "UK", "China", "Nepal"],
      values: [12000000000, 9000000000, 7000000000, 5000000000, 3000000000]
    }
  }
};

function debounce(fn, wait = 300) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), wait);
  };
}

async function fetchWithTimeout(url, opts = {}, timeout = TIMEOUT_MS) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { signal: controller.signal, ...opts });
    clearTimeout(id);
    return res;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

function buildQuery(params = {}) {
  const query = new URLSearchParams();
  Object.keys(params).forEach((key) => {
    const value = params[key];
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, value);
    }
  });
  return query.toString() ? `?${query.toString()}` : "";
}

function getFallbackYear() {
  const filterYears = yearFilter
    ? Array.from(yearFilter.options)
        .map((option) => Number(option.value))
        .filter((value) => Number.isFinite(value))
    : [];
  const dataYears = MOCK.products
    .map((product) => Number(product.year))
    .filter((value) => Number.isFinite(value));

  const availableYears = [...filterYears, ...dataYears];
  return availableYears.length ? String(Math.max(...availableYears)) : String(new Date().getFullYear());
}

function getApiUrl(path) {
  return `${API_BASE.replace(/\/$/, "")}${path}`;
}

function filterMockProducts({ q = "", category = "all", year = "", sort = "desc" } = {}) {
  const filtered = MOCK.products
    .filter((product) => {
      const matchesQuery = !q || product.name.toLowerCase().includes(q.toLowerCase());
      const matchesCategory = category === "all" || product.category === category;
      const matchesYear = !year || String(product.year) === String(year);
      return matchesQuery && matchesCategory && matchesYear;
    })
    .sort((a, b) => (sort === "asc" ? a.value - b.value : b.value - a.value));

  return { products: filtered, meta: { total: filtered.length } };
}

async function fetchStats() {
  if (!isApiConfigured) return MOCK.stats;

  try {
    const response = await fetchWithTimeout(getApiUrl("/stats"));
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (err) {
    console.warn("fetchStats failed; using mock data", err);
    return MOCK.stats;
  }
}

async function fetchProducts({ q = "", category = "all", year = "", sort = "desc" } = {}) {
  if (!isApiConfigured) {
    return filterMockProducts({ q, category, year, sort });
  }

  const params = {
    q: q || undefined,
    category: category !== "all" ? category : undefined,
    year: year || undefined,
    sort: sort || undefined
  };

  try {
    const response = await fetchWithTimeout(getApiUrl(`/products${buildQuery(params)}`));
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const json = await response.json();
    return Array.isArray(json) ? { products: json } : json;
  } catch (err) {
    console.warn("fetchProducts failed; using mock data", err);
    return filterMockProducts({ q, category, year, sort });
  }
}

async function fetchGraph(type = "yearly") {
  if (!isApiConfigured) return MOCK.graph[type];

  try {
    const response = await fetchWithTimeout(getApiUrl(`/graph/${type}`));
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (err) {
    console.warn("fetchGraph failed; using mock data", err);
    return MOCK.graph[type];
  }
}

async function postContact(payload) {
  if (!isApiConfigured) {
    return { success: true, message: "Message queued locally (demo mode)." };
  }

  try {
    const response = await fetchWithTimeout(getApiUrl("/contact"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`HTTP ${response.status}: ${text}`);
    }

    return await response.json();
  } catch (err) {
    console.warn("postContact failed; simulating success", err);
    return { success: true, message: "Message queued locally (demo mode)." };
  }
}

function moneyFmt(value) {
  if (typeof value !== "number") return value;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  return `$${value.toLocaleString()}`;
}

function clearChildren(el) {
  while (el?.firstChild) el.removeChild(el.firstChild);
}

function renderProducts(products = []) {
  clearChildren(searchResult);
  clearChildren(productList);

  if (!products.length) {
    const empty = document.createElement("p");
    empty.textContent = "No results found.";
    empty.style.textAlign = "center";
    empty.style.width = "100%";
    searchResult.appendChild(empty);
    return;
  }

  products.forEach((product) => {
    const card = document.createElement("div");
    card.className = "card fade-in";
    card.innerHTML = `
      <h3 style="margin-bottom: 6px">${product.name}</h3>
      <p style="margin-bottom: 8px; color: #666;">${product.desc || "-"}</p>
      <p style="font-weight: 700; margin-bottom: 8px;">${moneyFmt(product.value)}</p>
      <p style="font-size: 13px; color: #888">Category: ${product.category || "N/A"} | Year: ${product.year || "N/A"}</p>
    `;
    searchResult.appendChild(card);

    const tile = document.createElement("div");
    tile.className = "card fade-in";
    tile.style.padding = "18px";
    tile.innerHTML = `
      <h3 style="margin-bottom: 6px">${product.name}</h3>
      <p style="font-size: 14px; color: #666; margin-bottom: 8px;">${(product.desc || "").slice(0, 80)}${(product.desc || "").length > 80 ? "..." : ""}</p>
      <p style="font-weight: 700">${moneyFmt(product.value)}</p>
    `;
    productList.appendChild(tile);
  });
}

function animateCounter(el, toValue, formatter = (value) => value, duration = 900) {
  const end = Number(toValue) || 0;
  const frames = 60;
  let frame = 0;

  const timer = setInterval(() => {
    frame += 1;
    const progress = Math.min(frame / frames, 1);
    el.textContent = formatter(Math.round(end * progress));

    if (progress === 1) {
      clearInterval(timer);
    }
  }, duration / frames);
}

async function loadAndRenderStats() {
  try {
    const stats = await fetchStats();
    animateCounter(totalExportEl, stats.totalExport, moneyFmt, 1200);
    topProductEl.textContent = stats.topProduct || "-";
    topDestinationEl.textContent = stats.topDestination || "-";
    fastestGrowingEl.textContent = stats.fastestGrowing || "-";
  } catch (err) {
    console.error("Error loading stats:", err);
  }
}

function renderChartFallback(canvas, message) {
  if (!canvas?.parentElement) return;

  const fallback = document.createElement("p");
  fallback.className = "chart-fallback";
  fallback.textContent = message;
  canvas.replaceWith(fallback);
}

async function createCharts() {
  if (typeof Chart === "undefined") {
    renderChartFallback(exportChartCanvas, "Charts are unavailable right now because Chart.js could not be loaded.");
    renderChartFallback(categoryPieCanvas, "Reconnect to the internet or bundle Chart.js locally to restore this graph.");
    renderChartFallback(countryBarCanvas, "The rest of the page still works with the local demo data.");
    return;
  }

  const exportChartCtx = exportChartCanvas?.getContext("2d");
  const categoryPieCtx = categoryPieCanvas?.getContext("2d");
  const countryBarCtx = countryBarCanvas?.getContext("2d");

  if (!exportChartCtx || !categoryPieCtx || !countryBarCtx) return;

  const yearly = await fetchGraph("yearly");
  const category = await fetchGraph("category");
  const countries = await fetchGraph("countries");

  exportChart?.destroy();
  exportChart = new Chart(exportChartCtx, {
    type: "line",
    data: {
      labels: yearly.years || [],
      datasets: [{
        label: "Total exports",
        data: yearly.values || [],
        fill: true,
        tension: 0.25,
        pointRadius: 4
      }]
    },
    options: {
      plugins: { legend: { display: false } },
      responsive: true,
      scales: { y: { beginAtZero: false } },
      interaction: { mode: "index", intersect: false }
    }
  });

  categoryPieChart?.destroy();
  categoryPieChart = new Chart(categoryPieCtx, {
    type: "pie",
    data: {
      labels: category.labels || [],
      datasets: [{ data: category.values || [], hoverOffset: 8 }]
    },
    options: { responsive: true }
  });

  countryBarChart?.destroy();
  countryBarChart = new Chart(countryBarCtx, {
    type: "bar",
    data: {
      labels: countries.labels || [],
      datasets: [{ label: "Export Value", data: countries.values || [], borderRadius: 6 }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true } }
    }
  });
}

const debouncedSearch = debounce(async (query) => {
  currentQuery = query.trim();
  await loadProducts();
}, 350);

async function loadProducts() {
  clearChildren(searchResult);
  const loading = document.createElement("p");
  loading.textContent = "Loading...";
  loading.style.textAlign = "center";
  searchResult.appendChild(loading);

  try {
    const response = await fetchProducts({
      q: currentQuery,
      category: currentCategory,
      year: currentYear,
      sort: currentSort
    });
    renderProducts(response.products || []);
  } catch (err) {
    console.error("loadProducts error:", err);
    clearChildren(searchResult);
    const error = document.createElement("p");
    error.textContent = "Failed to load products.";
    error.style.textAlign = "center";
    searchResult.appendChild(error);
  }
}

function setupEventListeners() {
  searchInput?.addEventListener("input", (event) => debouncedSearch(event.target.value));
  searchBtn?.addEventListener("click", async () => {
    currentQuery = searchInput?.value.trim() || "";
    await loadProducts();
  });

  categoryFilter?.addEventListener("change", (event) => {
    currentCategory = event.target.value;
  });

  sortFilter?.addEventListener("change", (event) => {
    currentSort = event.target.value;
  });

  yearFilter?.addEventListener("change", (event) => {
    currentYear = event.target.value;
  });

  applyFiltersBtn?.addEventListener("click", async () => {
    await loadProducts();
    applyFiltersBtn.textContent = "Applied";
    setTimeout(() => {
      applyFiltersBtn.textContent = "Apply Filters";
    }, 900);
  });

  contactForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    contactStatus.textContent = "Sending...";

    const name = contactForm.querySelector("#name")?.value || "";
    const email = contactForm.querySelector("#email")?.value || "";
    const message = contactForm.querySelector("#message")?.value || "";

    if (!name || !email || !message) {
      contactStatus.textContent = "Fill all fields.";
      setTimeout(() => {
        contactStatus.textContent = "";
      }, 2500);
      return;
    }

    try {
      const response = await postContact({ name, email, message });
      contactStatus.textContent = response?.message || "Message sent!";
      contactForm.reset();
    } catch (err) {
      contactStatus.textContent = "Failed to send. Try later.";
    }

    setTimeout(() => {
      contactStatus.textContent = "";
    }, 4000);
  });
}

function syncYearFilter() {
  if (!yearFilter) {
    currentYear = getFallbackYear();
    return;
  }

  const fallbackYear = getFallbackYear();
  const hasYear = Array.from(yearFilter.options).some((option) => option.value === fallbackYear);

  if (!hasYear) {
    const option = document.createElement("option");
    option.value = fallbackYear;
    option.textContent = fallbackYear;
    yearFilter.add(option, yearFilter.options[0] || null);
  }

  yearFilter.value = fallbackYear;
  currentYear = fallbackYear;
}

async function init() {
  syncYearFilter();
  setupEventListeners();

  await Promise.all([
    loadAndRenderStats(),
    loadProducts(),
    createCharts()
  ]).catch((err) => console.warn("Initial load warning", err));
}

init();
