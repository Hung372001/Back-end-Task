import {Request} from "express";

export type TypeAdmin = {
    id: number;
    email: string;
    passwordHash: string;
    role: string,
    createdAt: Date;
}
export interface RequestWithToken extends Request {
    adminId?:  number;
}
