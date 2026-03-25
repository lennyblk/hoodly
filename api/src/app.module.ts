import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// MongoDB entities
import { User } from './entities/mongodb/User';
import { RefreshToken } from './entities/mongodb/RefreshToken';
import { Neighbourhood } from './entities/mongodb/Neighbourhood';
import { Document } from './entities/mongodb/Document';
import { Announcement } from './entities/mongodb/Announcement';
import { Message } from './entities/mongodb/Message';
import { Conversation } from './entities/mongodb/Conversation';
import { Event } from './entities/mongodb/Event';
import { Vote } from './entities/mongodb/Vote';

// SQLite entities
import { UserSqlite } from './entities/sqlite/UserSqlite';
import { Incident } from './entities/sqlite/Incident';
import { StatusParticipation } from './entities/sqlite/StatusParticipation';
import { NeighbourhoodSqlite } from './entities/sqlite/NeighbourhoodSqlite';
import { SyncLog } from './entities/sqlite/SyncLog';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      name: 'mongodb',
      type: 'mongodb',
      url: process.env.MONGODB_URI || 'mongodb://localhost:27017/hoodly',
      entities: [User, RefreshToken, Neighbourhood, Document, Announcement, Message, Conversation, Event, Vote],
      synchronize: process.env.NODE_ENV !== 'production',
      logging: process.env.NODE_ENV === 'development',
    }),
    TypeOrmModule.forRoot({
      name: 'sqlite',
      type: 'better-sqlite3',
      database: process.env.SQLITE_PATH || './hoodly_local.db',
      entities: [UserSqlite, Incident, StatusParticipation, NeighbourhoodSqlite, SyncLog],
      synchronize: true,
      logging: process.env.NODE_ENV === 'development',
    }),
  ],
})
export class AppModule {}
