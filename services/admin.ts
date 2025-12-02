import { Request, Response } from 'express';
import logger from "../utils/loogger";
import db from "../db";
import {admins} from "../db/schema";
import {eq} from "drizzle-orm/sql/expressions/conditions";
import bcrypt from "bcrypt";
import {generateJwtToken, verifyJwtToken} from "../auth/Jwt";
import {RequestWithToken} from "../types/admin";

export const login = async (req:Request, res:Response) => {
    const log = logger.child('login admin');
    try{
        const {email, password} = req.body;
        let [checkEmail] = await db.select().from(admins).where(eq(admins.email, email)).limit(1);

        if (checkEmail == null){
            return res.status(401).json({message: 'Invalid email or password'});
        }

        const checkPassword:Boolean = await bcrypt.compare(password, checkEmail.passwordHash);

        if(!checkPassword){
            return  res.status(401).json({message: 'Invalid email or password'});
        }
        const payload  = {
            id: checkEmail.id.toString(),
            email: checkEmail.email
        }

        const accessToken = generateJwtToken(payload);

        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 8 * 60 * 60 * 1000 // 8 hours
        });

        res.status(200).json({ accessToken});
    }catch (error) {
        logger.error(`Error in admin login', ${error}`);
        res.status(500).json({message: 'Internal server error'});
    }
}

export const getProfile = async (req:RequestWithToken, res:Response) => {
    const log = logger.child('get admin profile');
    try{

        const adminId =req.adminId;
        let [admin] = await db.select().from(admins).where(eq(admins.id, Number(adminId))).limit(1);

        if (admin == null){
            return res.status(404).json({message: 'Admin not found'});
        }

        res.status(200).json({
            id: admin.id,
            email: admin.email,
            name: admin.name,
            createdAt: admin.createdAt,
        });
    }catch (error) {
        logger.error(`Error in get admin profile ${error}`);
        res.status(500).json({message: 'Internal server error'});
    }
}