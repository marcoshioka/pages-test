// Shared helpers for index.html and reports.html

function getStoredTheme() {
  return localStorage.getItem("theme");
}

function effectiveTheme() {
  return getStoredTheme() || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
}

function applyTheme(theme) {
  if (theme === "dark" || theme === "light") {
    document.documentElement.dataset.theme = theme;
  } else {
    delete document.documentElement.dataset.theme;
  }
}

function updateThemeToggleUI() {
  const btn = document.getElementById("themeToggle");
  if (!btn) return;
  const theme = effectiveTheme();
  btn.textContent = theme === "dark" ? "☀️" : "🌙";
  btn.setAttribute("aria-label", theme === "dark" ? "Switch to light theme" : "Switch to dark theme");
}

function toggleTheme() {
  const next = effectiveTheme() === "dark" ? "light" : "dark";
  localStorage.setItem("theme", next);
  applyTheme(next);
  updateThemeToggleUI();
}

function initThemeToggle() {
  applyTheme(getStoredTheme());
  updateThemeToggleUI();
  document.getElementById("themeToggle")?.addEventListener("click", toggleTheme);
}

const STATUS_BADGES = {
  success: { cls: "badge-success", label: "success" },
  failure: { cls: "badge-failure", label: "failure" },
  cancelled: { cls: "badge-other", label: "cancelled" },
  in_progress: { cls: "badge-running", label: "running" },
  queued: { cls: "badge-running", label: "queued" }
};

// Renders a colored pill badge for a run's status/conclusion.
function statusBadge(status, conclusion) {
  const key = conclusion || status || "unknown";
  const entry = STATUS_BADGES[key] || { cls: "badge-other", label: key };
  return `<span class="badge ${entry.cls}">${entry.label}</span>`;
}

function skeletonRows(count, columns) {
  let rows = "";
  for (let i = 0; i < count; i++) {
    rows += `<tr class="skeleton-row">${
      Array.from({ length: columns }, () => `<td><div class="skeleton skeleton-bar"></div></td>`).join("")
    }</tr>`;
  }
  return rows;
}

document.addEventListener("DOMContentLoaded", initThemeToggle);
