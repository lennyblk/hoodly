import { Injectable, OnApplicationShutdown } from '@nestjs/common';
import neo4j, { Driver } from 'neo4j-driver';

@Injectable()
export class Neo4jService implements OnApplicationShutdown {
  private driver: Driver;

  constructor() {
    this.driver = neo4j.driver(
      process.env.NEO4J_URI || 'neo4j://neo4j:7687',
      neo4j.auth.basic(
        process.env.NEO4J_USER || 'neo4j',
        process.env.NEO4J_PASSWORD || 'password',
      ),
    );
  }

  async run(cypher: string, params: Record<string, any> = {}) {
    const session = this.driver.session();
    try {
      return await session.run(cypher, params);
    } finally {
      await session.close();
    }
  }

  async onApplicationShutdown() {
    await this.driver.close();
  }
}
