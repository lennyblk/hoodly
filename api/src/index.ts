import 'reflect-metadata';
import * as dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { MongoDataSource } from './config/mongodb.datasource';
import { SqliteDataSource } from './config/sqlite.datasource';
import { neogma } from './config/neo4j.connection';

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

async function bootstrap() {
  await MongoDataSource.initialize();
  console.log('MongoDB connected');

  await SqliteDataSource.initialize();
  console.log('SQLite connected');

  await neogma.verifyConnectivity();
  console.log('Neo4j connected');

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

bootstrap().catch(console.error);
