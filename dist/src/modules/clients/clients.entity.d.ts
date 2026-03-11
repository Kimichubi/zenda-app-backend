export interface ClientEntity {
    id: string;
    userId: string;
    name: string;
    phone: string;
    email: string | null;
    createdAt: Date;
}
