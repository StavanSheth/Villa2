import { Pool } from 'pg';
import { GraphNode, SymbolRecord } from '@codegraph/shared';

export class PostgresStorage {
  private pool: Pool;

  constructor(connectionString: string) {
    this.pool = new Pool({ connectionString });
  }

  async initializeSchema(schemaSql: string): Promise<void> {
    await this.pool.query(schemaSql);
  }

  async upsertNode(node: GraphNode): Promise<void> {
    const query = `
      INSERT INTO nodes (
        id, type, name, qualified_name, language, repository, module, file, relative_path,
        line_start, line_end, column_start, column_end, parent_id, metadata, hash, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, CURRENT_TIMESTAMP
      ) ON CONFLICT (id) DO UPDATE SET
        type = EXCLUDED.type,
        name = EXCLUDED.name,
        qualified_name = EXCLUDED.qualified_name,
        line_start = EXCLUDED.line_start,
        line_end = EXCLUDED.line_end,
        column_start = EXCLUDED.column_start,
        column_end = EXCLUDED.column_end,
        metadata = EXCLUDED.metadata,
        hash = EXCLUDED.hash,
        updated_at = CURRENT_TIMESTAMP;
    `;
    
    await this.pool.query(query, [
      node.id, node.type, node.name, node.qualified_name, node.language, node.repository, node.module,
      node.file, node.relative_path, node.line_start, node.line_end, node.column_start, node.column_end,
      node.parent_id, JSON.stringify(node.metadata), node.hash
    ]);
  }

  async upsertSymbol(symbol: SymbolRecord): Promise<void> {
    const query = `
      INSERT INTO symbols (
        symbol_id, name, qualified_name, type, scope, file, line, column,
        parent, definition, references, imports, exports, calls, called_by, reads, writes, type_information
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18
      ) ON CONFLICT (symbol_id) DO UPDATE SET
        type = EXCLUDED.type,
        references = EXCLUDED.references,
        imports = EXCLUDED.imports,
        exports = EXCLUDED.exports,
        calls = EXCLUDED.calls,
        called_by = EXCLUDED.called_by,
        reads = EXCLUDED.reads,
        writes = EXCLUDED.writes,
        type_information = EXCLUDED.type_information;
    `;
    
    await this.pool.query(query, [
      symbol.symbol_id, symbol.name, symbol.qualified_name, symbol.type, symbol.scope, symbol.file,
      symbol.line, symbol.column, symbol.parent, symbol.definition,
      JSON.stringify(symbol.references), JSON.stringify(symbol.imports), JSON.stringify(symbol.exports),
      JSON.stringify(symbol.calls), JSON.stringify(symbol.called_by), JSON.stringify(symbol.reads),
      JSON.stringify(symbol.writes), symbol.type_information
    ]);
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}
