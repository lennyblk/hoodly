import { UserRole } from '../../../entities/mongodb/User';

export type JwtPayload = {
  userId: string;
  email: string;
  role: UserRole;
  neighbourhoodId: string | null;
};
