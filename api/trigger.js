export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { message } = req.body;

  const resp = await fetch(
    "https://api.github.com/repos/marcoshioka/pages-test/dispatches",
    {
      method: "POST",
      headers: {
        "Accept": "application/vnd.github+json",
        "Authorization": `Bearer ${process.env.GITHUB_TOKEN}`, // stored in Vercel
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        event_type: "run-ci",
        client_payload: { message }
      })
    }
  );

  if (!resp.ok) {
    const err = await resp.text();
    return res.status(resp.status).json({ error: err });
  }

  return res.status(200).json({ success: true });
}
