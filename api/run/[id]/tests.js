import AdmZip from "adm-zip";
import { XMLParser } from "fast-xml-parser";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "https://marcoshioka.github.io");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const { id } = req.query;
  const authHeaders = {
    "Authorization": `Bearer ${process.env.GITHUB_TOKEN}`,
    "Accept": "application/vnd.github+json"
  };

  try {
    const artifactsRes = await fetch(
      `https://api.github.com/repos/marcoshioka/pages-test/actions/runs/${id}/artifacts`,
      { headers: authHeaders }
    );

    if (!artifactsRes.ok) {
      const err = await artifactsRes.text();
      return res.status(artifactsRes.status).json({ error: err });
    }

    const artifactsData = await artifactsRes.json();
    const artifact = artifactsData.artifacts?.find(
      a => a.name === "cypress-results" && !a.expired
    );

    if (!artifact) {
      return res.status(404).json({
        error: "No test results available for this run (artifact missing or expired)"
      });
    }

    const zipRes = await fetch(artifact.archive_download_url, { headers: authHeaders });
    if (!zipRes.ok) {
      return res.status(zipRes.status).json({ error: "Failed to download test results artifact" });
    }

    const zipBuffer = Buffer.from(await zipRes.arrayBuffer());
    const zip = new AdmZip(zipBuffer);
    const xmlEntries = zip.getEntries().filter(e => e.entryName.endsWith(".xml"));

    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
      isArray: (name) => ["testsuite", "testcase"].includes(name)
    });

    const specs = [];
    for (const entry of xmlEntries) {
      const xml = entry.getData().toString("utf-8");
      let parsed;
      try {
        parsed = parser.parse(xml);
      } catch (err) {
        console.error(`Failed to parse ${entry.entryName}:`, err.message);
        continue;
      }

      const suites = parsed.testsuites?.testsuite || (parsed.testsuite ? [parsed.testsuite] : []);
      for (const suite of suites) {
        const rawCases = suite.testcase || [];
        const tests = rawCases.map(tc => {
          const failed = tc.failure !== undefined;
          const skipped = tc.skipped !== undefined;
          return {
            name: tc["@_name"],
            duration: tc["@_time"] ? parseFloat(tc["@_time"]) : null,
            status: failed ? "failed" : skipped ? "skipped" : "passed",
            failureMessage: failed
              ? (typeof tc.failure === "string" ? tc.failure : tc.failure?.["@_message"] || null)
              : null
          };
        });

        specs.push({
          file: suite["@_file"] || suite["@_name"] || entry.entryName,
          total: tests.length,
          passed: tests.filter(t => t.status === "passed").length,
          failed: tests.filter(t => t.status === "failed").length,
          skipped: tests.filter(t => t.status === "skipped").length,
          tests
        });
      }
    }

    return res.status(200).json({ runId: id, specs });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
