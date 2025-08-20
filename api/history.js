import { getAllMessages } from "../../utils/store";

export default async function handler(req, res) {
  const runsRes = await fetch(
    "https://api.github.com/repos/marcoshioka/pages-test/actions/runs?per_page=10",
    {
      headers: {
        "Authorization": `Bearer ${process.env.GITHUB_TOKEN}`,
        "Accept": "application/vnd.github+json"
      }
    }
  );

  const data = await runsRes.json();
  const messages = getAllMessages();

  const runs = data.workflow_runs?.map(run => ({
    id: run.id,
    status: run.status,
    conclusion: run.conclusion,
    url: run.html_url,
    message: messages[run.id] || "(none)"
  })) || [];

  res.status(200).json({ runs });
}
