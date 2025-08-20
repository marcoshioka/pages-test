import { getRunMessage } from "../../../utils/store";

export default async function handler(req, res) {
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

  const run = await runRes.json();

  if (!run.id) return res.status(404).json({ error: "Run not found" });

  return res.status(200).json({
    id: run.id,
    name: run.name,
    status: run.status,
    conclusion: run.conclusion,
    url: run.html_url,
    message: getRunMessage(run.id) || "(none)"
  });
}
