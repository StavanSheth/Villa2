---
name: gitnexus-local-wiki
description: "Use this skill when the user wants to generate or regenerate a wiki.md file from an already-indexed GitNexus repository. The wiki is generated locally by querying the graph database — no LLM API key or internet required."
---

# GitNexus Local Wiki Generator — AI Skill

This skill generates a comprehensive `wiki.md` from any GitNexus-indexed repository by querying the local graph database directly. No internet or API keys needed.

## Prerequisites

- Repository must already be indexed by GitNexus (`.gitnexus/` directory exists)
- GitNexus installed globally: `gitnexus --version`
- Node.js available: `node --version`

## When to Use

- User asks to "generate wiki", "create documentation from graph", or "export knowledge graph"
- User wants to refresh/update the wiki after code changes
- User wants a readable summary of what GitNexus indexed

## How to Generate

### Option 1 — Using the Script

```bash
node "C:\Projects\Mavon\Clients\reposit-solar\discovery\scripts\gitnexus-wiki-local.mjs" "<REPO_PATH>"
```

### Option 2 — Using the Batch Script

```cmd
"C:\Projects\Mavon\Clients\reposit-solar\discovery\Skills\GitNexus\scripts\gitnexus-index.bat" "<REPO_PATH>"
```

The batch script runs both `gitnexus analyze` AND wiki generation in one step.

### Option 3 — Manual Cypher Queries

If the scripts aren't available, you can query the graph directly:

```bash
cd "<REPO_PATH>"

# Node types and counts
gitnexus cypher "MATCH (n) RETURN labels(n) AS type, count(*) AS count ORDER BY count DESC"

# All classes
gitnexus cypher "MATCH (n:Class) RETURN n.name AS name, n.filePath AS file ORDER BY name"

# All methods
gitnexus cypher "MATCH (n:Method) RETURN n.name AS name, n.filePath AS file ORDER BY name"

# All interfaces
gitnexus cypher "MATCH (n:Interface) RETURN n.name AS name, n.filePath AS file ORDER BY name"

# All routes
gitnexus cypher "MATCH (n:Route) RETURN n.name AS name, n.filePath AS file ORDER BY name"

# All functions
gitnexus cypher "MATCH (n:Function) RETURN n.name AS name, n.filePath AS file ORDER BY name LIMIT 500"

# All constants
gitnexus cypher "MATCH (n:Const) RETURN n.name AS name, n.filePath AS file ORDER BY name LIMIT 200"

# Relationship types
gitnexus cypher "MATCH (a)-[r]->(b) RETURN label(r) AS rel, count(*) AS count ORDER BY count DESC"
```

Then assemble the results into a markdown file and save to `<REPO_PATH>/.gitnexus/wiki.md`.

## Output Location

- **Default**: `<REPO_PATH>/.gitnexus/wiki.md`
- If user requests a custom path, copy the file there after generation.

## What the Wiki Contains

| Section | Source Query |
|---|---|
| Index Summary | `gitnexus.json` metadata |
| Node Type Distribution | `MATCH (n) RETURN labels(n), count(*)` |
| Classes | `MATCH (n:Class) RETURN n.name, n.filePath` |
| Methods | `MATCH (n:Method) RETURN n.name, n.filePath` |
| Interfaces & Types | `MATCH (n:Interface) RETURN n.name, n.filePath` |
| API Routes | `MATCH (n:Route) RETURN n.name, n.filePath` |
| Functions | `MATCH (n:Function) RETURN n.name, n.filePath` |
| Constants | `MATCH (n:Const) RETURN n.name, n.filePath` |
| Capabilities | `gitnexus.json` capabilities section |
