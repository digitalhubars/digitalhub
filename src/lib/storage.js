// Backup file for the workspace data (download only; live records are in PocketBase).

const VERSION = 2;

export function workspaceToFile(data) {
  return new Blob([JSON.stringify({ version: VERSION, exportedAt: new Date().toISOString(), data }, null, 2)], {
    type: 'application/json',
  });
}
