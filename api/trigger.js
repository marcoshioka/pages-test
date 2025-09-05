export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "https://marcoshioka.github.io");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { message, spec = "all" } = req.body;

  try {
    // 1. Trigger workflow with spec + message
    const dispatch = await fetch(
      "https://api.github.com/repos/marcoshioka/pages-test/actions/workflows/node.js.yml/dispatches",
      {
        method: "POST",
        headers: {
          "Accept": "application/vnd.github+json",
          "Authorization": `Bearer ${process.env.GITHUB_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ref: "main",
          inputs: {
            message: message || (spec === "all" ? "✨ Run All Tests" : `Run ${spec}`),
            spec
          }
        })
      }
    );

    if (!dispatch.ok) {
      const err = await dispatch.text();
      return res.status(dispatch.status).json({ error: err });
    }

    // 2. Wait briefly for GitHub to register the run
    await new Promise(r => setTimeout(r, 2000));

    // 3. Fetch the most recent runs
    const runsRes = await fetch(
      "https://api.github.com/repos/marcoshioka/pages-test/actions/workflows/node.js.yml/runs?branch=main&per_page=3",
      {
        headers: {
          "Authorization": `Bearer ${process.env.GITHUB_TOKEN}`,
          "Accept": "application/vnd.github+json"
        }
      }
    );

    const data = await runsRes.json();
    if (!runsRes.ok) {
      return res.status(runsRes.status).json({ error: data });
    }

    // 4. Pick the most recent run
    const run = data.workflow_runs?.sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    )[0];

    return res.status(200).json({
      success: true,
      id: run?.id,
      url: run?.html_url,
      status: run?.status,
      conclusion: run?.conclusion,
      spec,
      message: message || (spec === "all" ? "✨ Run All Tests" : `Run ${spec}`)
    });
  } catch (err) {
    console.error("Trigger error:", err);
    return res.status(500).json({ error: err.message });
  }
}
