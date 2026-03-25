import { Neogma } from 'neogma';

export const neogma = new Neogma(
  {
    url: process.env.NEO4J_URI || 'neo4j://localhost:7687',
    username: process.env.NEO4J_USER || 'neo4j',
    password: process.env.NEO4J_PASSWORD || 'password',
  },
  {
    logger: process.env.NODE_ENV === 'development' ? console.log : undefined,
  }
);
