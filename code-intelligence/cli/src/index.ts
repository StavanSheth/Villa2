#!/usr/bin/env node
import { Command } from 'commander';
import { TypeScriptParser } from '@codegraph/parser';
import { Neo4jGraph } from '@codegraph/graph';
import { PostgresStorage } from '@codegraph/storage';
import * as fs from 'fs';
import * as path from 'path';

const program = new Command();

program
  .name('codegraph')
  .description('Universal Code Knowledge Graph CLI')
  .version('1.0.0');

program.command('scan')
  .description('Scan a directory or file and index it')
  .argument('<path>', 'File or directory to scan')
  .option('-t, --tsconfig <path>', 'Path to tsconfig.json')
  .action(async (targetPath, options) => {
    const tsconfig = options.tsconfig || path.join(process.cwd(), 'tsconfig.json');
    if (!fs.existsSync(tsconfig)) {
      console.error(`tsconfig.json not found at ${tsconfig}`);
      process.exit(1);
    }
    
    console.log(`Scanning ${targetPath} using ${tsconfig}...`);
    const parser = new TypeScriptParser(tsconfig);
    
    // Simplification for demo: assuming targetPath is a single file
    const { nodes, edges, symbols } = parser.parseFile(path.resolve(targetPath));
    console.log(`Extracted ${nodes.length} nodes, ${edges.length} edges, and ${symbols.length} symbols.`);
    
    // In full implementation, we'd upsert to Postgres/Neo4j here
    console.log('Skipping DB upsert in CLI demo without active DB connections.');
  });

program.command('impact')
  .description('Find downstream impact of a node')
  .argument('<nodeId>', 'Node ID (e.g. function:file.ts:name)')
  .action(async (nodeId) => {
    const graph = new Neo4jGraph(
      process.env.NEO4J_URI || 'bolt://localhost:7687',
      process.env.NEO4J_USER || 'neo4j',
      process.env.NEO4J_PASSWORD || 'password'
    );
    
    try {
      console.log(`Finding impact for ${nodeId}...`);
      const impact = await graph.findImpact(nodeId);
      console.log(JSON.stringify(impact, null, 2));
    } catch (e) {
      console.error('Failed to connect to Neo4j or execute query', e);
    } finally {
      await graph.close();
    }
  });

program.parse();
