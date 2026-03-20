export interface ClientEntity {
  id: string;
  userId: string;
  name: string;
  phone: string;
  email: string | null;
  notes: string | null;
  status: "ACTIVE" | "INACTIVE";
  createdAt: Date;
}
