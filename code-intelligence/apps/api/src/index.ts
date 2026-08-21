import express from 'express';
import { Neo4jGraph } from '@codegraph/graph';
import { PostgresStorage } from '@codegraph/storage';

const app = express();
const port = process.env.PORT || 3000;

// Initialize services (in production, use DI and proper configuration)
const graph = new Neo4jGraph(
  process.env.NEO4J_URI || 'bolt://localhost:7687',
  process.env.NEO4J_USER || 'neo4j',
  process.env.NEO4J_PASSWORD || 'password'
);

const storage = new PostgresStorage(
  process.env.POSTGRES_URI || 'postgresql://postgres:password@localhost:5433/codegraph'
);

app.use(express.json());

// API: Get Impact
app.get('/graph/node/:id/impact', async (req, res) => {
  try {
    const { id } = req.params;
    const impact = await graph.findImpact(id);
    res.json({ id, impact });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// API: System Status
app.get('/graph/status', (req, res) => {
  res.json({ status: 'ok', version: '1.0.0' });
});

// Start Server
app.listen(port, () => {
  console.log(`CodeGraph API running on http://localhost:${port}`);
});
