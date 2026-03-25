import { Entity, ObjectIdColumn, ObjectId, Column, CreateDateColumn } from 'typeorm';

export enum DocumentType {
  CONTRACT = 'contract',
  OTHER = 'other',
}

export enum DocumentStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  SIGNED = 'signed',
  ARCHIVED = 'archived',
}

export interface SignatureEntry {
  userId: ObjectId;
  hash: string;
  date: Date;
}

export interface SignatureZone {
  page: number;
  x: number;
  y: number;
  w: number;
  h: number;
}

@Entity('documents')
export class Document {
  @ObjectIdColumn()
  id: ObjectId;

  @Column()
  title: string;

  @Column({ default: DocumentType.OTHER })
  type: DocumentType;

  @Column()
  name: string;

  @Column({ type: 'string' })
  ownerId: string;

  @Column({ type: 'array', nullable: true })
  signers: string[];

  @Column({ type: 'array', nullable: true })
  signatures: SignatureEntry[];

  @Column({ default: DocumentStatus.DRAFT })
  status: DocumentStatus;

  @Column({ type: 'array', nullable: true })
  signatureZones: SignatureZone[];

  @CreateDateColumn()
  createdAt: Date;
}
