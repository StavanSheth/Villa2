#!/usr/bin/env node

/**
 * gitnexus-wiki-local.mjs
 * 
 * Generates a comprehensive wiki.md from any GitNexus-indexed repository.
 * No LLM API key required — queries the graph directly via Cypher.
 * 
 * Usage:
 *   node gitnexus-wiki-local.mjs                  # Run in current repo
 *   node gitnexus-wiki-local.mjs "C:\path\to\repo" # Run on specific repo
 * 
 * Output: <repo>/.gitnexus/wiki.md
 */

import { execSync } from 'child_process';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { resolve, basename } from 'path';

const repoPath = process.argv[2] || process.cwd();
const resolvedPath = resolve(repoPath);
const gitnexusDir = resolve(resolvedPath, '.gitnexus');

// ─── Helpers ───────────────────────────────────────────────────────
function cypher(query) {
  try {
    const raw = execSync(`gitnexus cypher "${query.replace(/"/g, '\\"')}"`, {
      cwd: resolvedPath,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    const lines = raw.split('\n');
    const jsonStart = lines.findIndex(l => l.trim().startsWith('{'));
    if (jsonStart === -1) return null;
    return JSON.parse(lines.slice(jsonStart).join('\n'));
  } catch {
    return null;
  }
}

// ─── Validate ──────────────────────────────────────────────────────
if (!existsSync(gitnexusDir)) {
  console.error(`\u274C No .gitnexus directory found at ${resolvedPath}`);
  console.error(`   Run: cd "${resolvedPath}" && gitnexus analyze`);
  process.exit(1);
}

console.log(`\uD83D\uDCCA Generating wiki for: ${resolvedPath}`);

// ─── Gather Data ───────────────────────────────────────────────────
let meta = {};
try {
  meta = JSON.parse(readFileSync(resolve(gitnexusDir, 'gitnexus.json'), 'utf-8'));
} catch { /* fallback */ }

const repoName = meta.remoteUrl
  ? basename(meta.remoteUrl.replace(/\.git$/, ''))
  : basename(resolvedPath);
const stats = meta.stats || {};
const now = new Date().toLocaleString();

console.log(`   Repository: ${repoName}`);
console.log(`   Stats: ${stats.nodes || '?'} nodes, ${stats.edges || '?'} edges`);

// Query node type distribution
console.log('   Querying node types...');
const nodeTypes = cypher("MATCH (n) RETURN labels(n) AS type, count(*) AS count ORDER BY count DESC");

// Query classes
console.log('   Querying classes...');
const classes = cypher("MATCH (n:Class) RETURN n.name AS name, n.filePath AS file ORDER BY name");

// Query methods
console.log('   Querying methods...');
const methods = cypher("MATCH (n:Method) RETURN n.name AS name, n.filePath AS file ORDER BY name");

// Query interfaces
console.log('   Querying interfaces...');
const interfaces = cypher("MATCH (n:Interface) RETURN n.name AS name, n.filePath AS file ORDER BY name");

// Query routes
console.log('   Querying routes...');
const routes = cypher("MATCH (n:Route) RETURN n.name AS name, n.filePath AS file ORDER BY name");

// Query functions (limit 500)
console.log('   Querying functions...');
const functions = cypher("MATCH (n:Function) RETURN n.name AS name, n.filePath AS file ORDER BY name LIMIT 500");

// Query constants (limit 200)
console.log('   Querying constants...');
const consts = cypher("MATCH (n:Const) RETURN n.name AS name, n.filePath AS file ORDER BY name LIMIT 200");

// Query relationships
console.log('   Querying relationships...');
const rels = cypher("MATCH (a)-[r]->(b) RETURN label(r) AS rel, count(*) AS count ORDER BY count DESC");

// ─── Build Markdown ────────────────────────────────────────────────
console.log('   Building markdown...');

let md = '';
md += `# ${repoName} \u2014 Code Knowledge Graph Wiki\n\n`;
md += `> Auto-generated from GitNexus index on ${now}\n`;
md += `> Repository: \`${resolvedPath}\`\n`;
if (meta.branch) md += `> Branch: \`${meta.branch}\``;
if (meta.lastCommit) md += ` | Commit: \`${meta.lastCommit.slice(0, 7)}\``;
md += '\n\n---\n\n';

md += '## Index Summary\n\n';
md += '| Metric | Count |\n|---|---|\n';
if (stats.files) md += `| **Files** | ${stats.files.toLocaleString()} |\n`;
if (stats.nodes) md += `| **Total Nodes (Symbols)** | ${stats.nodes.toLocaleString()} |\n`;
if (stats.edges) md += `| **Total Relationships** | ${stats.edges.toLocaleString()} |\n`;
if (stats.communities) md += `| **Clusters (Communities)** | ${stats.communities.toLocaleString()} |\n`;
if (stats.processes) md += `| **Execution Flows** | ${stats.processes.toLocaleString()} |\n`;
if (stats.embeddings) md += `| **Embeddings** | ${stats.embeddings.toLocaleString()} |\n`;
md += '\n';

if (nodeTypes?.markdown) {
  md += '## Node Type Distribution\n\n' + nodeTypes.markdown + '\n\n';
}

if (classes?.markdown && classes.row_count > 0) {
  md += `---\n\n## Classes (${classes.row_count})\n\n` + classes.markdown + '\n\n';
}

if (methods?.markdown && methods.row_count > 0) {
  md += `---\n\n## Methods (${methods.row_count})\n\n` + methods.markdown + '\n\n';
}

if (interfaces?.markdown && interfaces.row_count > 0) {
  md += `---\n\n## Interfaces & Types (${interfaces.row_count})\n\n` + interfaces.markdown + '\n\n';
}

if (routes?.markdown && routes.row_count > 0) {
  md += `---\n\n## API Routes (${routes.row_count})\n\n` + routes.markdown + '\n\n';
}

if (functions?.markdown && functions.row_count > 0) {
  const suffix = functions.row_count >= 500 ? ' (showing first 500)' : '';
  md += `---\n\n## Functions (${functions.row_count}${suffix})\n\n` + functions.markdown + '\n\n';
}

if (consts?.markdown && consts.row_count > 0) {
  const suffix = consts.row_count >= 200 ? ' (showing first 200)' : '';
  md += `---\n\n## Constants (${consts.row_count}${suffix})\n\n` + consts.markdown + '\n\n';
}

if (rels?.markdown && rels.row_count > 0) {
  md += `---\n\n## Relationship Types\n\n` + rels.markdown + '\n\n';
}

md += '---\n\n## GitNexus Capabilities\n\n';
md += '| Feature | Status |\n|---|---|\n';
const caps = meta.capabilities || {};
md += `| Graph store | ${caps.graph?.status === 'available' ? '\u2705 Available' : '\u26A0\uFE0F ' + (caps.graph?.status || 'Unknown')} |\n`;
md += `| Full-text search | ${caps.fts?.status === 'available' ? '\u2705 Available' : '\u26A0\uFE0F ' + (caps.fts?.status || 'Unknown')} |\n`;
md += `| Vector search | ${caps.vectorSearch?.status === 'available' ? '\u2705 Available' : '\u26A0\uFE0F ' + (caps.vectorSearch?.status || 'Unknown')} |\n`;
if (stats.embeddings > 0) md += `| Embeddings | \u2705 ${stats.embeddings.toLocaleString()} generated |\n`;
md += '\n';

md += `---\n\n*Generated by GitNexus \u2022 ${now}*\n`;

// ─── Write ─────────────────────────────────────────────────────────
const outPath = resolve(gitnexusDir, 'wiki.md');
writeFileSync(outPath, md, 'utf-8');

console.log(`\n\u2705 Wiki saved to: ${outPath}`);
console.log(`   ${md.split('\n').length} lines written`);
