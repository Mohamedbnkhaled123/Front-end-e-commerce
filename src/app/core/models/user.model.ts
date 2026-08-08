export interface IUser {
    _id: string;
    name: string;
    email: string;
    role: string;
    isActive?: boolean;
    canPurchase?: boolean;
    lastActiveAt?: string;
    isOnline?: boolean;
    createdAt?: string;
}

export interface IUserListRes {
    message?: string;
    status?: string;
    data: IUser[];
}
