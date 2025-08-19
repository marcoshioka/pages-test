import type { VercelRequest, VercelResponse } from "vercel";

// EDIT these:
const OWNER = "marcoshioka";
const REPO = "pages-test";
const WORKFLOW_FILE = "node.js.yml"; // file inside .github/workflows

// Allow only your GitHub Pages origin(s)
const ALLOWED_ORIGINS = new Set<string>([
  "https://marcoshioka.github.io",
  "https://marcoshioka.github.io/pages-test", // if it's a project page
]);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS preflight
  if (req.method === "OPTIONS") {
    const origin = req.headers.origin ?? "";
    if (ALLOWED_ORIGINS.has(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
    }
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Trigger-Key");
    return res.status(204).end();
  }

  const origin = req.headers.origin ?? "";
  if (!ALLOWED_ORIGINS.has(origin)) {
    return res.status(403).json({ error: "Forbidden origin" });
  }
  res.setHeader("Access-Control-Allow-Origin", origin);

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Optional extra protection: a shared header key
  const clientKey = req.headers["x-trigger-key"];
  if (process.env.TRIGGER_KEY && clientKey !== process.env.TRIGGER_KEY) {
    return res.status(401).json({ error: "Invalid trigger key" });
  }

  const { ref = "main", inputs = {} } = (req.body || {});
  const ghToken = process.env.GH_PAT; // <-- set in Vercel env
  if (!ghToken) return res.status(500).json({ error: "Missing GH_PAT env" });

  const ghUrl = `https://api.github.com/repos/${OWNER}/${REPO}/actions/workflows/${WORKFLOW_FILE}/dispatches`;
  const ghResp = await fetch(ghUrl, {
    method: "POST",
    headers: {
      "Accept": "application/vnd.github+json",
      "Authorization": `Bearer ${ghToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ref, inputs }),
  });

  const text = await ghResp.text();
  if (!ghResp.ok) {
    return res.status(ghResp.status).send(text || "GitHub API error");
  }

  // GitHub returns 204 on success; respond 200 to make the browser happy
  return res.status(200).json({ ok: true });
}
