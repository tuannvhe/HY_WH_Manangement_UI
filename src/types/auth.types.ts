export interface LoginResponse {
    userId: string;
    fullName: string;
    accessToken: string;
    refreshToken: string;
    factoryCode: string;
    department: string;
}

export interface RefreshTokenRequest {
    token: string;
}