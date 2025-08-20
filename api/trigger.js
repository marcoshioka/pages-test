// api/trigger.js
import fetch from "node-fetch";
import { addRun } from "../utils/store.js";

export default async function handler(req, res) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message } = req.body;

    const ghRes = await fetch(
      `https://api.github.com/repos/marcoshioka/pages-test/actions/workflows/node.js.yml/dispatches`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
          Accept: "application/vnd.github.v3+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ref: "main",
          inputs: { message },
        }),
      }
    );

    if (!ghRes.ok) {
      const errorText = await ghRes.text();
      return res.status(ghRes.status).json({ error: errorText });
    }

    // Fake run entry so frontend can track immediately
    const fakeRun = {
      id: Date.now(),
      message,
      status: "queued",
      conclusion: null,
      url: "https://github.com/marcoshioka/pages-test/actions",
    };

    addRun(fakeRun);

    res.status(200).json(fakeRun);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
