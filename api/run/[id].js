// api/[id].js
import { getRun } from "../utils/store.js";

export default function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const { id } = req.query;
    const run = getRun(id);
    if (!run) return res.status(404).json({ error: "Run not found" });

    res.status(200).json(run);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
