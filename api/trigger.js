export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "https://marcoshioka.github.io");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { message } = req.body;

  // 1. Trigger workflow_dispatch
  const dispatch = await fetch(
    "https://api.github.com/repos/marcoshioka/pages-test/actions/workflows/node.js.yml/dispatches",
    {
      method: "POST",
      headers: {
        "Accept": "application/vnd.github+json",
        "Authorization": `Bearer ${process.env.GITHUB_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ ref: "main", inputs: { message } })
    }
  );

  if (!dispatch.ok) {
    const err = await dispatch.text();
    return res.status(dispatch.status).json({ error: err });
  }

  // 2. Poll for the new run (avoid race condition)
  let run = null;
  for (let i = 0; i < 5; i++) {   // retry up to 5 times
    const runs = await fetch(
      "https://api.github.com/repos/marcoshioka/pages-test/actions/workflows/node.js.yml/runs?branch=main&per_page=1",
      {
        headers: {
          "Authorization": `Bearer ${process.env.GITHUB_TOKEN}`,
          "Accept": "application/vnd.github+json"
        }
      }
    );
    const data = await runs.json();
    run = data.workflow_runs?.[0];
    if (run) break;
    await new Promise(r => setTimeout(r, 2000)); // wait 2s before retry
  }

  if (!run) {
    return res.status(202).json({
      success: true,
      message: "Workflow dispatched, but no run found yet. Try again shortly."
    });
  }

  return res.status(200).json({
    success: true,
    runId: run.id,        // 🔑 camelCase for frontend
    runUrl: run.html_url,
    status: run.status,
    conclusion: run.conclusion
  });
}
