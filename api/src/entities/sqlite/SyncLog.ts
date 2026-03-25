import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

export enum SyncAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
}

export enum SyncStatus {
  PENDING = 'pending',
  SYNCED = 'synced',
  CONFLICT = 'conflict',
}

@Entity('sync_log')
export class SyncLog {
  @PrimaryColumn()
  id: string;

  @Column()
  entity: string; // 'incident' | 'user' | ...

  @Column()
  entityId: string;

  @Column()
  action: SyncAction;

  @Column()
  status: SyncStatus;

  @Column({ type: 'simple-json' })
  payload: Record<string, unknown>;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  syncedAt: Date;
}
