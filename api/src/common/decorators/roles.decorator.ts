import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../entities/mongodb/User';

export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);
