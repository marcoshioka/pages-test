export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "https://marcoshioka.github.io");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  const resp = await fetch(
    "https://api.github.com/repos/marcoshioka/pages-test/actions/workflows/node.js.yml/runs?branch=main&per_page=5",
    {
      headers: {
        "Authorization": `Bearer ${process.env.GITHUB_TOKEN}`,
        "Accept": "application/vnd.github+json"
      }
    }
  );

  if (!resp.ok) {
    const err = await resp.text();
    return res.status(resp.status).json({ error: err });
  }

  const data = await resp.json();
  const runs = data.workflow_runs?.map(run => ({
    id: run.id,
    status: run.status,
    conclusion: run.conclusion,
    url: run.html_url
  }));

  return res.status(200).json({ runs });
}
