import { UserRole, UserPlan } from "@prisma/client";

export { UserRole, UserPlan };

export interface UserEntity {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  phone: string;
  businessName: string;
  slug: string;
  role: UserRole;
  plan: UserPlan;
  pixKeyType?: string | null;
  pixKey?: string | null;
  pixName?: string | null;
  pixCity?: string | null;
  createdAt: Date;
}
