export interface ClientEntity {
  id: string;
  businessId: string;
  name: string;
  phone: string;
  email: string | null;
  notes: string | null;
  status: "ACTIVE" | "INACTIVE";
  createdAt: Date;
}
