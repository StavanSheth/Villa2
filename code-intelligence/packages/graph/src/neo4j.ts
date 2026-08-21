import neo4j, { Driver, Session } from 'neo4j-driver';
import { GraphNode, GraphEdge } from '@codegraph/shared';

export class Neo4jGraph {
  private driver: Driver;

  constructor(uri: string, user: string, pass: string) {
    this.driver = neo4j.driver(uri, neo4j.auth.basic(user, pass));
  }

  async close(): Promise<void> {
    await this.driver.close();
  }

  private getSession(): Session {
    return this.driver.session();
  }

  async upsertNode(node: GraphNode): Promise<void> {
    const session = this.getSession();
    try {
      // Neo4j node label requires standard characters, so we map NodeLanguage and NodeType as labels.
      const query = `
        MERGE (n:CodeNode { id: $id })
        SET n.type = $type,
            n.name = $name,
            n.language = $language,
            n.file = $file,
            n:${node.type} = true
      `;
      await session.run(query, {
        id: node.id,
        type: node.type,
        name: node.name,
        language: node.language,
        file: node.file
      });
    } finally {
      await session.close();
    }
  }

  async upsertEdge(edge: GraphEdge): Promise<void> {
    const session = this.getSession();
    try {
      // Dynamic relationship types require string concatenation in Cypher, but we assume
      // edge.relationship is strictly from our EdgeRelationship enum which is safe.
      const query = `
        MATCH (a:CodeNode { id: $source_id })
        MATCH (b:CodeNode { id: $target_id })
        MERGE (a)-[r:${edge.relationship} { id: $id }]->(b)
        SET r.confidence = $confidence,
            r.resolution_status = $resolution_status
      `;
      await session.run(query, {
        source_id: edge.source_id,
        target_id: edge.target_id,
        id: edge.id,
        confidence: edge.confidence,
        resolution_status: edge.resolution_status
      });
    } finally {
      await session.close();
    }
  }

  async findImpact(nodeId: string, maxDepth: number = 5): Promise<any> {
    const session = this.getSession();
    try {
      // Traverse downstream relationships to find impacted nodes
      const query = `
        MATCH (start:CodeNode { id: $nodeId })-[r*1..${maxDepth}]->(impacted:CodeNode)
        RETURN impacted.id AS id, impacted.type AS type, impacted.name AS name,
               length(r) AS depth
        ORDER BY depth ASC
      `;
      const result = await session.run(query, { nodeId });
      return result.records.map(record => ({
        id: record.get('id'),
        type: record.get('type'),
        name: record.get('name'),
        depth: record.get('depth').toNumber()
      }));
    } finally {
      await session.close();
    }
  }
}
