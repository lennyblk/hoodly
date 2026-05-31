import { Global, Module, forwardRef } from '@nestjs/common';
import { Neo4jService } from './neo4j.service';
import { Neo4jController } from './neo4j.controller';
import { UsersModule } from '../mongodb/users/users.module';

@Global()
@Module({
  imports: [forwardRef(() => UsersModule)],
  controllers: [Neo4jController],
  providers: [Neo4jService],
  exports: [Neo4jService],
})
export class Neo4jModule {}
