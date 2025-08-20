// utils/store.js
// Simple in-memory store for run messages
// ⚠️ Resets if Vercel restarts — for persistence use KV/DB

let runMessages = {}; // { runId: message }

export function saveRunMessage(runId, message) {
  runMessages[runId] = message;
}

export function getRunMessage(runId) {
  return runMessages[runId];
}

export function getAllMessages() {
  return runMessages;
}
