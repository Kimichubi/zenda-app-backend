export interface UserEntity {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  phone: string;
  businessName: string;
  slug: string;
  createdAt: Date;
}
