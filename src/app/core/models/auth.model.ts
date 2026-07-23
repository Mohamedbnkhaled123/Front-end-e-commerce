export interface IAuthLogin {
    email: string;
    password: string;
}

export interface IAuthLoginRes {
    JWT: string;
    status?: string;
    message?: string;
}

export interface IJWT {
    id: string;
    name: string;
    role: string;
    iat: number;
    exp: number;
}
