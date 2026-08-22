---
name: gitnexus-local-index
description: "Use this skill when the user wants to index a repository with GitNexus locally, generate the .gitnexus knowledge graph (lbug file), and create a wiki.md. This skill covers the full local workflow: analyze → verify → generate wiki. No internet required — GitNexus is installed globally on this machine."
---

# GitNexus Local Indexing — AI Skill

This skill instructs you (the AI agent) to run GitNexus locally on this machine to index any target repository and generate its knowledge graph + wiki.

## Prerequisites (Already Installed)

- **GitNexus**: Installed globally (`npm install -g gitnexus@latest`)
- **Node.js**: v22.20.0
- **Git**: 2.47.1

Verify with:
```bash
gitnexus --version
node --version
git --version
```

## Before Starting — Ask the User

You MUST ask the user these questions before running anything:

1. **Target repository path** — The absolute path to the Git repository to index.
   - Example: `C:\Projects\MyApp`
   - Validate it is a valid Git repo: `git -C "<path>" rev-parse --is-inside-work-tree`

2. **Output destination** — Where should `.gitnexus/` (lbug file) and `wiki.md` be saved?
   - **Default**: `<target-repo>/.gitnexus/` (inside the target repo itself)
   - User may specify a different path if they don't want to modify the target repo.

3. **Analysis options** (optional, default to NO for both):
   - Embeddings? (slower, adds semantic search)
   - PDG/control-flow? (deeper analysis, slower)

## Step-by-Step Execution

### Step 1 — Validate the Target Repository

```bash
git -C "<TARGET_REPO_PATH>" rev-parse --is-inside-work-tree
```

If this fails, STOP and tell the user the path is not a valid Git repository.

### Step 2 — Run GitNexus Analysis

From the target repository root:

```bash
cd "<TARGET_REPO_PATH>"
gitnexus analyze
```

With optional flags:
```bash
gitnexus analyze --embeddings        # Add embeddings
gitnexus analyze --pdg               # Add PDG analysis
gitnexus analyze --embeddings --pdg  # Both
```

This creates the `.gitnexus/` directory containing:
- `lbug` — The binary graph database (knowledge graph)
- `gitnexus.json` — Index metadata (stats, capabilities)
- `meta.json` — Duplicate metadata
- `run.cjs` — Auto-runner script
- `parse-cache/` — Parsed file cache
- `parsedfile-cache/` — Additional cache

It also generates `AGENTS.md` and `CLAUDE.md` in the repo root.

### Step 3 — Verify the Index

```bash
cd "<TARGET_REPO_PATH>"
gitnexus status
gitnexus list
```

Confirm status shows "✅ up-to-date".

### Step 4 — Generate wiki.md

Run the local wiki generator script (no LLM API key needed):

```bash
node "<DISCOVERY_ROOT>/scripts/gitnexus-wiki-local.mjs" "<TARGET_REPO_PATH>"
```

Where `<DISCOVERY_ROOT>` is `C:\Projects\Mavon\Clients\reposit-solar\discovery`.

Or use the batch script:
```bash
"<DISCOVERY_ROOT>\Skills\GitNexus\scripts\gitnexus-index.bat" "<TARGET_REPO_PATH>"
```

This saves `wiki.md` to `<TARGET_REPO_PATH>/.gitnexus/wiki.md`.

### Step 5 — If User Wants a Custom Output Path

If the user specified a different output path:

```bash
copy "<TARGET_REPO_PATH>\.gitnexus\lbug" "<CUSTOM_PATH>\lbug"
copy "<TARGET_REPO_PATH>\.gitnexus\wiki.md" "<CUSTOM_PATH>\wiki.md"
copy "<TARGET_REPO_PATH>\.gitnexus\gitnexus.json" "<CUSTOM_PATH>\gitnexus.json"
```

### Step 6 — Report Results

After completion, report:
- Repository name and path
- Number of files, symbols, edges, clusters, execution flows
- Whether embeddings and PDG were enabled
- Location of the lbug file and wiki.md
- Any warnings or errors

## Important Rules

- NEVER delete the target repository
- NEVER run analysis on the wrong repository
- ALWAYS confirm the target path with the user before running
- ALWAYS run from the target repository root directory
- The `lbug` file is binary — do NOT try to read it directly. Use `gitnexus cypher`, `gitnexus query`, or `gitnexus context` to query it.
- The `wiki.md` file IS human-readable markdown

## Querying the Graph After Indexing

```bash
gitnexus query "search term"          # Semantic search
gitnexus context SymbolName           # Full symbol context
gitnexus impact SymbolName upstream   # Blast radius
gitnexus cypher "MATCH (n:Class) RETURN n.name, n.filePath"  # Raw Cypher
gitnexus status                       # Index health
gitnexus list                         # All indexed repos
```

## Troubleshooting

| Problem | Solution |
|---|---|
| `gitnexus: command not found` | Run `npm install -g gitnexus@latest` |
| `Not inside a git repository` | `cd` to the repo root first |
| `FTS extension unavailable` | Windows limitation, doesn't affect core functionality |
| `VECTOR index unavailable` | Windows limitation, exact-scan fallback works fine |
| Index is stale | Run `gitnexus analyze` again |
| Index is corrupt | Run `gitnexus clean --force` then `gitnexus analyze` |
