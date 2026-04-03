import { Entity, ObjectIdColumn, ObjectId, Column, CreateDateColumn } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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

export class SignatureEntry {
  @ApiProperty({ example: '64a1f2c3e4b5f6a7b8c9d0e1', type: String })
  userId: ObjectId;

  @ApiProperty({ example: 'abc123hash' })
  hash: string;

  @ApiProperty({ example: '2026-04-03T10:00:00.000Z' })
  date: Date;
}

export class SignatureZone {
  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 100 })
  x: number;

  @ApiProperty({ example: 200 })
  y: number;

  @ApiProperty({ example: 150 })
  w: number;

  @ApiProperty({ example: 50 })
  h: number;
}

@Entity('documents')
export class Document {
  @ApiProperty({ example: '64a1f2c3e4b5f6a7b8c9d0e1', type: String })
  @ObjectIdColumn()
  id: ObjectId;

  @ApiProperty({ example: 'Contrat de service - Jardinage' })
  @Column()
  title: string;

  @ApiProperty({ enum: DocumentType, default: DocumentType.OTHER })
  @Column({ default: DocumentType.OTHER })
  type: DocumentType;

  @ApiProperty({ example: 'contrat_jardinage.pdf' })
  @Column()
  name: string;

  @ApiProperty({ example: '64a1f2c3e4b5f6a7b8c9d0e2' })
  @Column({ type: 'string' })
  ownerId: string;

  @ApiPropertyOptional({ example: ['64a1f2c3e4b5f6a7b8c9d0e3'], type: [String] })
  @Column({ type: 'array', nullable: true })
  signers: string[];

  @ApiPropertyOptional({ type: [SignatureEntry] })
  @Column({ type: 'array', nullable: true })
  signatures: SignatureEntry[];

  @ApiProperty({ enum: DocumentStatus, default: DocumentStatus.DRAFT })
  @Column({ default: DocumentStatus.DRAFT })
  status: DocumentStatus;

  @ApiPropertyOptional({ type: [SignatureZone] })
  @Column({ type: 'array', nullable: true })
  signatureZones: SignatureZone[];

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;
}
