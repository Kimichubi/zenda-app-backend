import { CreateClientDto } from "./dto/create-client.dto";
import { UpdateClientDto } from "./dto/update-client.dto";
import { ClientsRepository } from "./clients.repository";
export declare class ClientsService {
    private readonly clientsRepository;
    constructor(clientsRepository: ClientsRepository);
    findAll(userId: string): Promise<import("./clients.entity").ClientEntity[]>;
    create(userId: string, dto: CreateClientDto): Promise<import("./clients.entity").ClientEntity>;
    update(userId: string, id: string, dto: UpdateClientDto): Promise<import("./clients.entity").ClientEntity | null>;
    remove(userId: string, id: string): Promise<void>;
}
