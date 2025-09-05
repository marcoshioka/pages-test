export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "https://marcoshioka.github.io");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  try {
    // 1. Get last 10 runs
    const ghRes = await fetch(
      "https://api.github.com/repos/marcoshioka/pages-test/actions/workflows/node.js.yml/runs?branch=main&per_page=10",
      {
        headers: {
          "Authorization": `Bearer ${process.env.GITHUB_TOKEN}`,
          "Accept": "application/vnd.github+json"
        }
      }
    );

    if (!ghRes.ok) {
      const err = await ghRes.text();
      return res.status(ghRes.status).json({ error: err });
    }

    const data = await ghRes.json();

    // 2. Fetch details for each run → to get workflow_dispatch inputs
    const runsWithInputs = await Promise.all(
      data.workflow_runs.map(async (run) => {
        try {
          const detailRes = await fetch(run.url, {
            headers: {
              "Authorization": `Bearer ${process.env.GITHUB_TOKEN}`,
              "Accept": "application/vnd.github+json"
            }
          });
          const detail = await detailRes.json();

          return {
            id: run.id,
            status: run.status,
            conclusion: run.conclusion,
            url: run.html_url,
            // ✅ pull from inputs, fallback only if missing
            spec: detail?.inputs?.spec || "all"
          };
        } catch (err) {
          console.error("Error fetching run details:", err);
          return {
            id: run.id,
            status: run.status,
            conclusion: run.conclusion,
            url: run.html_url,
            spec: "all"
          };
        }
      })
    );

    return res.status(200).json({ runs: runsWithInputs });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
