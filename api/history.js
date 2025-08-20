// api/history.js
import { getRuns } from "../utils/store.js";

export default function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const runs = getRuns();
    res.status(200).json({ runs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
