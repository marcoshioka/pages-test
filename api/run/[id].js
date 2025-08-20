// api/[id].js
import fetch from "node-fetch";
import { getRuns, updateRun } from "../utils/store.js";

export default async function handler(req, res) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const { id } = req.query;

  try {
    // First, try to find it in our in-memory store
    const runs = getRuns();
    const run = runs.find(r => String(r.id) === String(id));

    // If not found, fetch from GitHub
    if (!run) {
      const ghRes = await fetch(
        `https://api.github.com/repos/marcoshioka/pages-test/actions/runs/${id}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
            Accept: "application/vnd.github.v3+json",
          },
        }
      );

      if (!ghRes.ok) {
        const errText = await ghRes.text();
        return res.status(ghRes.status).json({ error: errText });
      }

      const ghRun = await ghRes.json();
      return res.status(200).json({
        id: ghRun.id,
        name: ghRun.name,
        status: ghRun.status,
        conclusion: ghRun.conclusion,
        url: ghRun.html_url,
        message: ghRun.event?.inputs?.message || "(none)",
      });
    }

    // If found locally, check if still running
    if (run.status === "queued" || run.status === "in_progress") {
      const ghRes = await fetch(
        `https://api.github.com/repos/marcoshioka/pages-test/actions/runs/${id}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
            Accept: "application/vnd.github.v3+json",
          },
        }
      );

      if (ghRes.ok) {
        const ghRun = await ghRes.json();
        updateRun({
          id: ghRun.id,
          name: ghRun.name,
          status: ghRun.status,
          conclusion: ghRun.conclusion,
          url: ghRun.html_url,
          message: run.message,
        });
      }
    }

    res.status(200).json(run);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
