import { ClientsService } from "./clients.service";
import { CreateClientDto } from "./dto/create-client.dto";
import { UpdateClientDto } from "./dto/update-client.dto";
export declare class ClientsController {
    private readonly clientsService;
    constructor(clientsService: ClientsService);
    findAll(user: {
        sub: string;
    }): Promise<import("./clients.entity").ClientEntity[]>;
    create(user: {
        sub: string;
    }, dto: CreateClientDto): Promise<import("./clients.entity").ClientEntity>;
    update(user: {
        sub: string;
    }, id: string, dto: UpdateClientDto): Promise<import("./clients.entity").ClientEntity | null>;
    remove(user: {
        sub: string;
    }, id: string): Promise<void>;
}
