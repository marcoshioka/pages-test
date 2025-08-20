import { setCors } from "./cors.js";

export default async function handler(req, res) {
  setCors(res);

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  try {
    const runs = await fetch(
      "https://api.github.com/repos/marcoshioka/pages-test/actions/workflows/node.js.yml/runs?branch=main&per_page=1",
      {
        headers: {
          "Authorization": `Bearer ${process.env.GITHUB_TOKEN}`,
          "Accept": "application/vnd.github+json"
        }
      }
    ).then(r => r.json());

    const run = runs.workflow_runs?.[0];

    return res.status(200).json({
      id: run?.id,
      name: run?.name,
      status: run?.status,
      conclusion: run?.conclusion,
      url: run?.html_url
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
