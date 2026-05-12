import { UserRole } from "@prisma/client";

export { UserRole };

export interface UserEntity {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  phone: string;
  businessId: string | null;
  role: UserRole;
  baseCommission: number;
  bio: string | null;
  instagramUrl: string | null;
  avatarPath: string | null;
  createdAt: Date;
}
