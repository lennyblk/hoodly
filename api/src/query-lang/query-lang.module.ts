import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QueryLangService } from './query-lang.service';
import { QueryLangController } from './query-lang.controller';
import { RolesGuard } from '../common/guards/roles.guard';
import { Document } from '../entities/mongodb/Document';

@Module({
  imports: [TypeOrmModule.forFeature([Document], 'mongodb')],
  controllers: [QueryLangController],
  providers: [QueryLangService, RolesGuard],
  exports: [QueryLangService],
})
export class QueryLangModule {}
