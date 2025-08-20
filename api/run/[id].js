export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "https://marcoshioka.github.io");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const { id } = req.query;

  const runRes = await fetch(
    `https://api.github.com/repos/marcoshioka/pages-test/actions/runs/${id}`,
    {
      headers: {
        "Authorization": `Bearer ${process.env.GITHUB_TOKEN}`,
        "Accept": "application/vnd.github+json"
      }
    }
  );

  if (!runRes.ok) {
    const err = await runRes.text();
    return res.status(runRes.status).json({ error: err });
  }

  const run = await runRes.json();
  return res.status(200).json(normalizeRun(run));
}

function normalizeRun(run) {
  return {
    id: run.id,
    name: run.name,
    status: run.status,
    conclusion: run.conclusion,
    url: run.html_url,
    message: run.display_title || null
  };
}
