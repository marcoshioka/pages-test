// The workflow sets run-name: "Node.js CI – ${{ github.event.inputs.spec || 'all' }}",
// so the spec is already present on the run list response — no per-run detail
// fetch (and its extra GitHub API call) is needed to recover it.
export function specFromRunName(name) {
  if (!name || !name.includes("–")) return "all";
  const raw = name.split("–").pop().trim();
  return raw || "all";
}
