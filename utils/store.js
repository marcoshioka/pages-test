// utils/store.js
let runs = [];

/**
 * Save a new run into memory
 */
export function addRun(run) {
  runs.unshift(run); // add to top of history
  if (runs.length > 20) {
    runs = runs.slice(0, 20); // keep last 20
  }
}

/**
 * Update an existing run by ID
 */
export function updateRun(updated) {
  runs = runs.map(r => (String(r.id) === String(updated.id) ? updated : r));
}

/**
 * Get all runs stored
 */
export function getRuns() {
  return runs;
}
