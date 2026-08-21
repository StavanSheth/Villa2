CREATE TABLE IF NOT EXISTS nodes (
  id VARCHAR(255) PRIMARY KEY,
  type VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  qualified_name VARCHAR(512) NOT NULL,
  language VARCHAR(50) NOT NULL,
  repository VARCHAR(255) NOT NULL,
  module VARCHAR(255) NOT NULL,
  file VARCHAR(512) NOT NULL,
  relative_path VARCHAR(512) NOT NULL,
  line_start INT,
  line_end INT,
  column_start INT,
  column_end INT,
  parent_id VARCHAR(255),
  metadata JSONB,
  hash VARCHAR(64) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_nodes_file ON nodes(file);
CREATE INDEX IF NOT EXISTS idx_nodes_qualified_name ON nodes(qualified_name);

CREATE TABLE IF NOT EXISTS symbols (
  symbol_id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  qualified_name VARCHAR(512) NOT NULL,
  type VARCHAR(255),
  scope VARCHAR(50) NOT NULL,
  file VARCHAR(512) NOT NULL,
  line INT,
  column INT,
  parent VARCHAR(255),
  definition VARCHAR(255),
  references JSONB,
  imports JSONB,
  exports JSONB,
  calls JSONB,
  called_by JSONB,
  reads JSONB,
  writes JSONB,
  type_information TEXT
);

CREATE INDEX IF NOT EXISTS idx_symbols_file ON symbols(file);
