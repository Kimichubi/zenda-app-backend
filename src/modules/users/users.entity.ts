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
  createdAt: Date;
}
