---
name: gitnexus-local-query
description: "Use this skill when the user wants to query, explore, or inspect the GitNexus knowledge graph for a locally-indexed repository. Covers Cypher queries, symbol context, impact analysis, and all CLI query tools. No internet required."
---

# GitNexus Local Query — AI Skill

Query the knowledge graph of any locally-indexed repository using GitNexus CLI tools. All operations are local — no internet needed.

## Prerequisites

- Repository must be indexed (`.gitnexus/` exists in repo root)
- All commands must be run from the target repo root: `cd "<REPO_PATH>"`

## Available Query Commands

### Semantic Search
```bash
gitnexus query "booking flow"
gitnexus query "authentication"
```
Returns matching execution flows and symbol definitions ranked by relevance.

### Symbol Context
```bash
gitnexus context BookingEngineService
```
Returns full context for a symbol: callers, callees, which execution flows it participates in, and its cluster/community.

### Impact Analysis
```bash
gitnexus impact BookingEngineService upstream
gitnexus impact BookingEngineService downstream
```
Returns the blast radius: direct callers/callees, affected processes, and risk level.

### Cypher Queries (Raw Graph Access)
```bash
# Count all node types
gitnexus cypher "MATCH (n) RETURN labels(n) AS type, count(*) AS cnt ORDER BY cnt DESC"

# Find all classes
gitnexus cypher "MATCH (n:Class) RETURN n.name AS name, n.filePath AS file"

# Find all functions in a specific file
gitnexus cypher "MATCH (n:Function) WHERE n.filePath = 'src/index.ts' RETURN n.name"

# Find callers of a function
gitnexus cypher "MATCH (a)-[r]->(b) WHERE b.name = 'createBooking' RETURN a.name, a.filePath"
```

#### Valid Node Labels
`File`, `Folder`, `Function`, `Class`, `Method`, `Interface`, `Const`, `Property`, `Route`, `Section`, `CodeElement`, `BasicBlock`, `CodeEmbedding`, `Process`, `Community`

#### Valid Node Properties
`name`, `filePath`, `startLine`, `endLine`

#### Valid Relationship Label
`CodeRelation` (all edges use this single label)

### Change Detection
```bash
gitnexus detect-changes
gitnexus detect-changes --scope compare --base-ref main
```

### Index Status
```bash
gitnexus status    # Current repo health
gitnexus list      # All indexed repos
gitnexus doctor    # Platform capabilities
```

## Troubleshooting

| Error | Meaning | Fix |
|---|---|---|
| `Cannot find property X for n` | Wrong Cypher property name | Use `name`, `filePath`, `startLine`, `endLine` only |
| `Table X does not exist` | Wrong node label | Use valid labels listed above |
| `Symbol 'X' not found` | Symbol name doesn't match exactly | Try `gitnexus query "X"` instead |
| `FTS extension unavailable` | Windows limitation | Ignore — queries still work via fallback |
