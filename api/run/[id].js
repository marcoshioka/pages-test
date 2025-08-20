export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "https://marcoshioka.github.io");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  const { id } = req.query;

  const resp = await fetch(
    `https://api.github.com/repos/marcoshioka/pages-test/actions/runs/${id}`,
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

  const run = await resp.json();
  return res.status(200).json({
    id: run.id,
    name: run.name,
    status: run.status,
    conclusion: run.conclusion,
    url: run.html_url,
    created_at: run.created_at,
    updated_at: run.updated_at
  });
}
