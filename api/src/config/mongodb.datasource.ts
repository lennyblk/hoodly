import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User } from '../entities/mongodb/User';
import { RefreshToken } from '../entities/mongodb/RefreshToken';
import { Neighbourhood } from '../entities/mongodb/Neighbourhood';
import { Document } from '../entities/mongodb/Document';
import { Announcement } from '../entities/mongodb/Announcement';
import { Message } from '../entities/mongodb/Message';
import { Conversation } from '../entities/mongodb/Conversation';
import { Event } from '../entities/mongodb/Event';
import { Vote } from '../entities/mongodb/Vote';

export const MongoDataSource = new DataSource({
  type: 'mongodb',
  url: process.env.MONGODB_URI || 'mongodb://localhost:27017/hoodly',
  entities: [
    User,
    RefreshToken,
    Neighbourhood,
    Document,
    Announcement,
    Message,
    Conversation,
    Event,
    Vote,
  ],
  synchronize: process.env.NODE_ENV !== 'production',
  logging: process.env.NODE_ENV === 'development',
});
