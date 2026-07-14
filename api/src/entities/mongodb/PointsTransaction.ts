import { Entity, ObjectIdColumn, ObjectId, Column, CreateDateColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('points_transactions')
export class PointsTransaction {
  @ApiProperty({ example: '64a1f2c3e4b5f6a7b8c9d0e1', type: String })
  @ObjectIdColumn()
  _id: ObjectId;

  @ApiProperty({ example: '64a1f2c3e4b5f6a7b8c9d0e2' })
  @Column({ type: 'string' })
  userId: string;

  @ApiProperty({ example: -20, description: 'Positif = crédit, négatif = débit' })
  @Column()
  amount: number;

  @ApiProperty({ example: 'Paiement contrat' })
  @Column()
  reason: string;

  @ApiProperty({ example: 130 })
  @Column()
  balanceAfter: number;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;
}
