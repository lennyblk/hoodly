import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { UserSqlite } from '../entities/sqlite/UserSqlite';
import { Incident } from '../entities/sqlite/Incident';
import { StatusParticipation } from '../entities/sqlite/StatusParticipation';
import { NeighbourhoodSqlite } from '../entities/sqlite/NeighbourhoodSqlite';
import { SyncLog } from '../entities/sqlite/SyncLog';

export const SqliteDataSource = new DataSource({
  type: 'better-sqlite3',
  database: process.env.SQLITE_PATH || './hoodly_local.db',
  entities: [
    UserSqlite,
    Incident,
    StatusParticipation,
    NeighbourhoodSqlite,
    SyncLog,
  ],
  synchronize: true,
  logging: process.env.NODE_ENV === 'development',
});
