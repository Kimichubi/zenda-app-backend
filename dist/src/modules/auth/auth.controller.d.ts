import { Request } from "express";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { SignupDto } from "./dto/signup.dto";
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
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
    refresh(req: Request & {
        user: {
            sub: string;
            email: string;
        };
    }): {
        accessToken: string;
    };
}
