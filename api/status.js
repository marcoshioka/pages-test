// api/status.js
import { getRuns } from "../utils/store.js";

export default function handler(req, res) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*"); // allow all origins
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const runs = getRuns();
    const latest = runs[0] || null;
    res.status(200).json({ latest });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
