export interface IAuthLogin {
    email: string;
    password: string;
}

export interface IAuthLoginRes {
    JWT: string;
    accessToken?: string;
    status?: string;
    message?: string;
}

export interface IRefreshTokenRes {
    accessToken: string;
}

export interface IJWT {
    id: string;
    name: string;
    role: string;
    iat: number;
    exp: number;
}

export interface IAuthRegister extends IAuthLogin {
    name: string;
}

export interface ISuperAdminSetup {
    name: string;
    email: string;
    setupKey: string;
    password: string;
}


