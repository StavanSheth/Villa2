# Universal Code Knowledge Graph (UCG)

This repository contains the architecture and implementation for the Universal Code Knowledge Graph system.

## Architecture

The system uses a modular architecture:
1.  **Parser Layer** (`@codegraph/parser`): Uses `ts-morph` (wrapping TS Compiler API) to extract AST and perform symbol resolution. Tree-sitter can be added for multi-language support.
2.  **Storage Layer** (`@codegraph/storage`): PostgreSQL acts as the Single Source of Truth (SSOT) for nodes and symbols.
3.  **Graph Layer** (`@codegraph/graph`): Neo4j stores the relationships between nodes for fast graph traversal and pathfinding.
4.  **API Layer** (`@codegraph/api`): Express API exposing impact analysis and querying.
5.  **CLI** (`@codegraph/cli`): Command line interface to trigger indexing and execute queries.

## Design Decisions
-   **TypeScript Engine**: Written in TS to perfectly align with `ts-morph` and the Next.js frontend requirements.
-   **Separation of Concerns**: Metadata (PostgreSQL) vs Relationships (Neo4j) vs Embeddings (Qdrant - Phase 4).

## Getting Started

1.  Start the databases (Docker required):
    ```bash
    # (Provide docker-compose here in full version)
    ```
2.  Install dependencies:
    ```bash
    pnpm install
    ```
3.  Build the workspace:
    ```bash
    pnpm build
    ```
4.  Run the CLI:
    ```bash
    pnpm --filter @codegraph/cli start scan ./src/target.ts
    ```
