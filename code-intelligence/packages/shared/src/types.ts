export type NodeLanguage = 
  | 'Python' | 'JavaScript' | 'TypeScript' | 'TSX' 
  | 'JSON' | 'YAML' | 'SQL' | 'Markdown' | 'Unknown';

export type NodeType = 
  | 'Repository' | 'Module' | 'Package' | 'Folder' | 'Subfolder' 
  | 'File' | 'Class' | 'Method' | 'Function' | 'Parameter' 
  | 'Variable' | 'Constant' | 'Import' | 'Export' | 'API' 
  | 'Database' | 'Table' | 'Column' | 'Event' | 'Queue' 
  | 'ExternalDependency' | 'EnvironmentVariable';

export type EdgeRelationship = 
  | 'CONTAINS' | 'DEFINES' | 'DECLARES' | 'EXPORTS' | 'IMPORTS'
  | 'DEPENDS_ON' | 'CALLS' | 'REFERENCES' | 'USES' | 'INHERITS'
  | 'IMPLEMENTS' | 'OVERRIDES' | 'INSTANTIATES' | 'EXTENDS'
  | 'INPUT' | 'ASSIGNMENT' | 'TRANSFORMATION' | 'READ' | 'WRITE'
  | 'RETURN' | 'PRODUCE' | 'CONSUME'
  | 'CALLS_API' | 'HANDLED_BY' | 'READS_TABLE' | 'WRITES_TABLE'
  | 'READS_COLUMN' | 'WRITES_COLUMN'
  | 'PUBLISHES' | 'SUBSCRIBES' | 'EMITS' | 'LISTENS_TO' | 'TRIGGERS'
  | 'DEFINED_IN' | 'READ_BY' | 'USED_BY' | 'AFFECTS'
  | 'COMMIT_CHANGED_FILE' | 'COMMIT_CHANGED_SYMBOL' 
  | 'FILE_CHANGED_BY' | 'SYMBOL_CHANGED_BY'
  | 'TESTS' | 'COVERS' | 'MOCKS' | 'FIXTURES_FOR';

export type ResolutionStatus = 'resolved' | 'partially_resolved' | 'unresolved' | 'static' | 'inferred' | 'runtime_only';

export interface Location {
  line: number;
  column: number;
}

export interface CodeRange {
  start: Location;
  end: Location;
}

export interface GraphNode {
  id: string; // Stable ID, e.g., repo:<repo_id>, file:<path>
  type: NodeType;
  name: string;
  qualified_name: string;
  language: NodeLanguage;
  repository: string;
  module: string;
  file: string;
  relative_path: string;
  line_start?: number;
  line_end?: number;
  column_start?: number;
  column_end?: number;
  parent_id?: string;
  metadata: Record<string, any>;
  hash: string;
  created_at: string;
  updated_at: string;
}

export interface GraphEdge {
  id: string;
  source_id: string;
  target_id: string;
  relationship: EdgeRelationship;
  source_location?: CodeRange;
  target_location?: CodeRange;
  confidence: number; // 0.0 to 1.0
  resolution_status: ResolutionStatus;
  language?: NodeLanguage;
  metadata: Record<string, any>;
}

export interface SymbolRecord {
  symbol_id: string;
  name: string;
  qualified_name: string;
  type: string;
  scope: 'global' | 'module' | 'class' | 'function' | 'block' | 'local' | 'closure';
  file: string;
  line: number;
  column: number;
  parent?: string;
  definition?: string;
  references: string[];
  imports: string[];
  exports: string[];
  calls: string[];
  called_by: string[];
  reads: string[];
  writes: string[];
  type_information?: string;
}
