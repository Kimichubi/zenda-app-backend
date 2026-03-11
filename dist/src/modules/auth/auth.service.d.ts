import { JwtService } from "@nestjs/jwt";
import { LoginDto } from "./dto/login.dto";
import { SignupDto } from "./dto/signup.dto";
import { UsersRepository } from "../users/users.repository";
export declare class AuthService {
    private readonly usersRepository;
    private readonly jwtService;
    constructor(usersRepository: UsersRepository, jwtService: JwtService);
    signup(dto: SignupDto): Promise<{
        user: {
            id: string;
            name: string;
            email: string;
        };
        accessToken: string;
        refreshToken: string;
    }>;
    login(dto: LoginDto): Promise<{
        user: {
            id: string;
            name: string;
            email: string;
        };
        accessToken: string;
        refreshToken: string;
    }>;
    refreshToken(userId: string, email: string): {
        accessToken: string;
    };
    private buildAuthResponse;
}
