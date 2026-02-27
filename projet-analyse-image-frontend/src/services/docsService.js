/**
 * docsService.js
 *
 * Fetches user-facing documentation from the GitHub repository at runtime.
 * All docs live in /docs/user/ at the repo root.
 *
 * To add a new help page:
 *   1. Create docs/user/<your-page>.md in the repository
 *   2. Add an entry to docs/user/index.json
 *   That's it — no code change required.
 */

const REPO_BASE =
  'https://raw.githubusercontent.com/UniversalBuilder/BIOME/main/docs/user';

const TIMEOUT_MS = 8000;

function fetchWithTimeout(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  return fetch(url, { signal: controller.signal }).finally(() =>
    clearTimeout(timer)
  );
}

/**
 * Fetch the docs index (list of available pages).
 * @returns {Promise<{ pages: Array<{ id, title, description, file, icon }> }>}
 */
export async function fetchIndex() {
  const res = await fetchWithTimeout(`${REPO_BASE}/index.json`);
  if (!res.ok) {
    throw new Error(`Failed to load docs index (HTTP ${res.status})`);
  }
  return res.json();
}

/**
 * Fetch the raw markdown content of a single docs page.
 * @param {string} filename  e.g. "getting-started.md"
 * @returns {Promise<string>} raw markdown text
 */
export async function fetchPage(filename) {
  const res = await fetchWithTimeout(`${REPO_BASE}/${filename}`);
  if (!res.ok) {
    throw new Error(`Failed to load page "${filename}" (HTTP ${res.status})`);
  }
  return res.text();
}
