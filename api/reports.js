import { specFromRunName } from "./spec-from-run-name.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "https://marcoshioka.github.io");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  try {
    const ghRes = await fetch(
      "https://api.github.com/repos/marcoshioka/pages-test/actions/workflows/node.js.yml/runs?branch=main&per_page=30",
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
    const runs = data.workflow_runs || [];

    const enriched = runs.map((run) => {
      const durationSeconds =
        run.status === "completed" && run.run_started_at && run.updated_at
          ? Math.round((new Date(run.updated_at) - new Date(run.run_started_at)) / 1000)
          : null;

      return {
        id: run.id,
        spec: specFromRunName(run.name),
        status: run.status,
        conclusion: run.conclusion,
        url: run.html_url,
        created_at: run.created_at,
        duration_seconds: durationSeconds,
        message: run.head_commit?.message || null,
      };
    });

    const total = enriched.length;
    const successCount = enriched.filter(r => r.conclusion === "success").length;
    const failureCount = enriched.filter(r => r.conclusion === "failure").length;
    const cancelledCount = enriched.filter(r => r.conclusion === "cancelled").length;
    const otherCount = total - successCount - failureCount - cancelledCount;

    const completedDurations = enriched
      .map(r => r.duration_seconds)
      .filter(d => d !== null);
    const avgDurationSeconds = completedDurations.length
      ? Math.round(completedDurations.reduce((a, b) => a + b, 0) / completedDurations.length)
      : null;

    const specMap = {};
    for (const r of enriched) {
      const label = r.spec === "all" ? "✨ All Tests" : r.spec.split("/").pop();
      if (!specMap[label]) specMap[label] = { spec: label, total: 0, success: 0, failure: 0 };
      specMap[label].total++;
      if (r.conclusion === "success") specMap[label].success++;
      if (r.conclusion === "failure") specMap[label].failure++;
    }
    const bySpec = Object.values(specMap)
      .map(s => ({ ...s, successRate: s.total ? Math.round((s.success / s.total) * 100) : 0 }))
      .sort((a, b) => b.total - a.total);

    const recentFailures = enriched
      .filter(r => r.conclusion === "failure")
      .slice(0, 5)
      .map(r => ({ id: r.id, spec: r.spec, url: r.url, created_at: r.created_at, message: r.message }));

    return res.status(200).json({
      totalRuns: total,
      successCount,
      failureCount,
      cancelledCount,
      otherCount,
      successRate: total ? Math.round((successCount / total) * 100) : 0,
      avgDurationSeconds,
      bySpec,
      recentFailures,
      trend: enriched
        .slice()
        .reverse()
        .map(r => ({ id: r.id, conclusion: r.conclusion, status: r.status, created_at: r.created_at, spec: r.spec })),
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
