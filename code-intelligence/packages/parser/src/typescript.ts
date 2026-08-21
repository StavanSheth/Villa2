import { Project, SourceFile, Node as TSNode, SyntaxKind } from 'ts-morph';
import { GraphNode, SymbolRecord, GraphEdge, NodeLanguage } from '@codegraph/shared';
import * as crypto from 'crypto';

export class TypeScriptParser {
  private project: Project;

  constructor(tsconfigPath: string) {
    this.project = new Project({
      tsConfigFilePath: tsconfigPath,
    });
  }

  parseFile(filePath: string): { nodes: GraphNode[], symbols: SymbolRecord[], edges: GraphEdge[] } {
    const sourceFile = this.project.getSourceFileOrThrow(filePath);
    const nodes: GraphNode[] = [];
    const symbols: SymbolRecord[] = [];
    const edges: GraphEdge[] = [];

    const fileHash = this.computeHash(sourceFile.getFullText());
    
    // 1. Create File Node
    const fileNode: GraphNode = {
      id: `file:${filePath}`,
      type: 'File',
      name: sourceFile.getBaseName(),
      qualified_name: filePath,
      language: this.detectLanguage(filePath),
      repository: 'local',
      module: 'unknown',
      file: filePath,
      relative_path: filePath,
      metadata: {},
      hash: fileHash,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    nodes.push(fileNode);

    // 2. Extract Functions and Classes
    sourceFile.getFunctions().forEach(func => {
      const name = func.getName() || 'anonymous';
      const funcId = `function:${filePath}:${name}`;
      
      nodes.push({
        id: funcId,
        type: 'Function',
        name,
        qualified_name: `${filePath}#${name}`,
        language: fileNode.language,
        repository: fileNode.repository,
        module: fileNode.module,
        file: filePath,
        relative_path: filePath,
        line_start: func.getStartLineNumber(),
        line_end: func.getEndLineNumber(),
        parent_id: fileNode.id,
        metadata: {},
        hash: fileHash,
        created_at: fileNode.created_at,
        updated_at: fileNode.updated_at,
      });

      edges.push({
        id: `edge:contains:${fileNode.id}:${funcId}`,
        source_id: fileNode.id,
        target_id: funcId,
        relationship: 'CONTAINS',
        confidence: 1.0,
        resolution_status: 'resolved',
        metadata: {}
      });

      // Extract calls within function
      func.getDescendantsOfKind(SyntaxKind.CallExpression).forEach(call => {
        const expression = call.getExpression();
        const calledSymbol = expression.getSymbol();
        
        if (calledSymbol) {
          const declarations = calledSymbol.getDeclarations();
          if (declarations.length > 0) {
            const dec = declarations[0];
            const targetFilePath = dec.getSourceFile().getFilePath();
            const targetName = calledSymbol.getName();
            const targetId = `function:${targetFilePath}:${targetName}`;
            
            edges.push({
              id: `edge:calls:${funcId}:${targetId}`,
              source_id: funcId,
              target_id: targetId,
              relationship: 'CALLS',
              source_location: {
                start: { line: call.getStartLineNumber(), column: 0 },
                end: { line: call.getEndLineNumber(), column: 0 }
              },
              confidence: 0.9,
              resolution_status: 'resolved',
              metadata: {}
            });
          }
        }
      });
    });

    // Extract basic symbols (Variables)
    sourceFile.getVariableDeclarations().forEach(v => {
      symbols.push({
        symbol_id: `symbol:${filePath}:${v.getName()}`,
        name: v.getName(),
        qualified_name: `${filePath}#${v.getName()}`,
        type: v.getType().getText(),
        scope: 'module', // simplify
        file: filePath,
        line: v.getStartLineNumber(),
        column: 0,
        references: v.findReferencesAsNodes().map(r => r.getSourceFile().getFilePath()),
        imports: [],
        exports: [],
        calls: [],
        called_by: [],
        reads: [],
        writes: []
      });
    });

    return { nodes, symbols, edges };
  }

  private computeHash(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  private detectLanguage(filePath: string): NodeLanguage {
    if (filePath.endsWith('.ts')) return 'TypeScript';
    if (filePath.endsWith('.tsx')) return 'TSX';
    if (filePath.endsWith('.js')) return 'JavaScript';
    return 'Unknown';
  }
}
