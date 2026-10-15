// Backup file for the workspace data (download only; the live data is in Firestore).

const VERSION = 2;

export function workspaceToFile(data) {
  return new Blob([JSON.stringify({ version: VERSION, exportedAt: new Date().toISOString(), data }, null, 2)], {
    type: 'application/json',
  });
}
