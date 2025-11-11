/*
  Generates app-meta.json with version/description and top N changelog items.
  Single source of truth: projet-analyse-image-frontend/package.json (fallback to backend/package.json).
*/
const fs = require('fs');
const path = require('path');

function readJson(p) {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (e) {
    return null;
  }
}

function parseChangelog(changelogPath) {
  const result = { version: null, date: null, summary: [] };
  try {
    if (!fs.existsSync(changelogPath)) return result;
    const content = fs.readFileSync(changelogPath, 'utf8');
    const lines = content.split(/\r?\n/);
    let found = null;
    for (let i = 0; i < lines.length; i++) {
      const m = lines[i].match(/^## \[([^\]]+)\]\s*-\s*([^\n]+)$/);
      if (m && m[1] && m[1].toLowerCase() !== 'unreleased') {
        found = { idx: i, ver: m[1], date: m[2] };
        break;
      }
    }
    if (!found) {
      // Fallback to Unreleased
      for (let i = 0; i < lines.length; i++) {
        const m = lines[i].match(/^## \[([^\]]+)\]/);
        if (m && m[1] && m[1].toLowerCase() === 'unreleased') {
          found = { idx: i, ver: 'Unreleased', date: new Date().toISOString().slice(0,10) };
          break;
        }
      }
    }
    if (found) {
      result.version = found.ver;
      result.date = found.date;
      const bullets = [];
      for (let j = found.idx + 1; j < lines.length; j++) {
        const l = lines[j];
        if (/^## \[/.test(l)) break;
        const bm = /^\s*-\s+(.+)$/.exec(l);
        if (bm) bullets.push(bm[1].trim());
      }
      result.summary = bullets.slice(0, 6);
    }
  } catch {}
  return result;
}

(function main() {
  const repoRoot = path.resolve(__dirname, '..');
  const fePkgPath = path.join(repoRoot, 'projet-analyse-image-frontend', 'package.json');
  const bePkgPath = path.join(repoRoot, 'backend', 'package.json');
  const changelogPath = path.join(repoRoot, 'CHANGELOG.md');

  const fePkg = readJson(fePkgPath);
  const bePkg = readJson(bePkgPath);

  const version = (fePkg && fePkg.version) || (bePkg && bePkg.version) || 'unknown';
  const description = (fePkg && fePkg.description) || (bePkg && bePkg.description) || 'BIOME - Bio Imaging Organization and Management Environment';
  const cl = parseChangelog(changelogPath);

  const meta = {
    version,
    description,
    releaseDate: cl.date || new Date().toISOString().slice(0,10),
    source: fePkg ? 'frontend' : (bePkg ? 'backend' : null),
    changelog: cl
  };

  const outputs = [
    path.join(repoRoot, 'projet-analyse-image-frontend', 'resources', 'app-meta.json'),
    path.join(repoRoot, 'backend', 'app-meta.json'),
    path.join(repoRoot, 'projet-analyse-image-frontend', 'src-tauri', 'resources', 'backend', 'app-meta.json')
  ];

  outputs.forEach((out) => {
    try {
      fs.mkdirSync(path.dirname(out), { recursive: true });
      fs.writeFileSync(out, JSON.stringify(meta, null, 2), 'utf8');
      console.log(`[app-meta] Wrote ${out}`);
    } catch (e) {
      console.warn(`[app-meta] Failed to write ${out}: ${e.message}`);
    }
  });
})();
