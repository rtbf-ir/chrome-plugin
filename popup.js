const extensionApi = globalThis.browser ?? globalThis.chrome;
const DATA_URL = "https://rtbf.ir/data/data.json";
const CACHE_KEY = "rtbfDirectory";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

const DIFFICULTY_COLORS = { "impossible-label": "#000000", "hard-label": "#a32100", "easy-label": "#129141", "medium-label": "#ffa800" };
const DIFFICULTY_IMAGES = { "impossible-label": "assets/images/d_impossible_logo.png", "hard-label": "assets/images/d_hard_logo.png", "easy-label": "assets/images/d_easy_logo.png", "medium-label": "assets/images/d_medium_logo.png" };

function cacheAgeLabel(timestamp) {
  return new Intl.DateTimeFormat("fa-IR", { dateStyle: "short", timeStyle: "short" }).format(timestamp);
}

function showStatus(message, isError = false) {
  const status = document.querySelector(".data-status");
  status.textContent = message;
  status.classList.toggle("is-error", isError);
  status.hidden = false;
}

function hideSpinner() { document.querySelector(".spinner-container").style.display = "none"; }

function changeIcon(difficulty, tabId) {
  if (DIFFICULTY_IMAGES[difficulty]) extensionApi.action.setIcon({ path: DIFFICULTY_IMAGES[difficulty], tabId });
}

function showDifficulty(item, tabId) {
  const { difficulty: label, keytype, info, deleteurl, name } = item;
  changeIcon(keytype, tabId);
  const difficulty = document.querySelector(".difficulty-text");
  difficulty.textContent = label;
  difficulty.style.backgroundColor = DIFFICULTY_COLORS[keytype] || "#666";
  document.querySelector(".difficulty-info").textContent = info || "";
  const removeButton = document.querySelector(".remove-button");
  if (deleteurl && deleteurl !== "#") {
    removeButton.style.display = "block";
    removeButton.href = /^https?:\/\//i.test(deleteurl) ? deleteurl : `https://${deleteurl}`;
  }
  document.querySelector(".service-name").textContent = `در «${name}»`;
  hideSpinner();
  document.querySelector(".difficulty-container").style.display = "flex";
}

function showNotSupported() {
  hideSpinner();
  document.querySelector(".not-supported-container").style.display = "block";
}

async function getDirectory() {
  const cached = (await extensionApi.storage.local.get(CACHE_KEY))[CACHE_KEY];
  if (cached?.data && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    showStatus(`اطلاعات: آخرین به‌روزرسانی ${cacheAgeLabel(cached.fetchedAt)}`);
    return cached.data;
  }
  try {
    const response = await fetch(DATA_URL);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    await extensionApi.storage.local.set({ [CACHE_KEY]: { data, fetchedAt: Date.now() } });
    showStatus("اطلاعات به‌تازگی از rtbf.ir به‌روزرسانی شد.");
    return data;
  } catch (error) {
    if (cached?.data) {
      showStatus(`اتصال برقرار نشد؛ نسخهٔ ذخیره‌شدهٔ ${cacheAgeLabel(cached.fetchedAt)} نمایش داده می‌شود.`, true);
      return cached.data;
    }
    throw error;
  }
}

async function initialize() {
  try {
    const [tab] = await extensionApi.tabs.query({ active: true, lastFocusedWindow: true });
    if (!tab?.url || !/^https?:/i.test(tab.url)) throw new Error("unsupported-url");
    const websites = await getDirectory();
    const item = RTBFDomainUtils.findWebsite(websites, new URL(tab.url).hostname);
    item ? showDifficulty(item, tab.id) : showNotSupported();
  } catch (error) {
    hideSpinner();
    showStatus(error.message === "unsupported-url" ? "این صفحه قابل بررسی نیست؛ یک وب‌سایت معمولی را باز کنید." : "دریافت فهرست سرویس‌ها ممکن نشد. اتصال اینترنت را بررسی کرده و دوباره تلاش کنید.", true);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("closeButton").addEventListener("click", () => window.close());
  initialize();
});
