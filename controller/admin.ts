import {Request, Response} from 'express';
import logger from "../utils/loogger";
import db from "../db";
import {admins, usersCustomer} from "../db/schema";
import {eq, like, or} from "drizzle-orm/sql/expressions/conditions";
import bcrypt from "bcrypt";
import {generateJwtToken} from "../auth/Jwt";
import {RequestWithToken} from "../types/admin";
import {asc, count, desc} from "drizzle-orm";
import { get } from 'http';
import { findUserById } from '../services/customer';

export const login = async (req: Request, res: Response) => {
    const log = logger.child('login admin');
    try {
        const {email, password} = req.body;
        let [checkEmail] = await db.select().from(admins).where(eq(admins.email, email)).limit(1);

        if (checkEmail == null) {
            return res.status(401).json({message: 'Invalid email or password'});
        }

        const checkPassword: Boolean = await bcrypt.compare(password, checkEmail.passwordHash);

        if (!checkPassword) {
            return res.status(401).json({message: 'Invalid email or password'});
        }
        const payload = {
            id: checkEmail.id.toString(), email: checkEmail.email
        }

        const accessToken = generateJwtToken(payload);

        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 8 * 60 * 60 * 1000 // 8 hours
        });

        res.status(200).json({accessToken});
    } catch (error) {
        logger.error(`Error in admin login', ${error}`);
        res.status(500).json({message: 'Internal server error'});
    }
}

export const getProfile = async (req: RequestWithToken, res: Response) => {
    const log = logger.child('get admin profile');
    try {

        const adminId = req.adminId;
        let [admin] = await db.select().from(admins).where(eq(admins.id, Number(adminId))).limit(1);

        if (admin == null) {
            return res.status(404).json({message: 'Admin not found'});
        }

        res.status(200).json({
            id: admin.id, email: admin.email, name: admin.name, createdAt: admin.createdAt,
        });
    } catch (error) {
        logger.error(`Error in get admin profile ${error}`);
        res.status(500).json({message: 'Internal server error'});
    }
}

/// get customers with pagination, sorting, searching
export const getCustomers = async (req: RequestWithToken, res: Response) => {
    try {
        const {page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', search=''} = req.query;
        const pageNumber = Number(page);
        const limitNumber = Number(limit);
        const offset = (pageNumber - 1) * limitNumber;

        let query:any = db.select().from(usersCustomer);

        if (search) {
            query = query.where(
                or(
                    like(usersCustomer.fullName, `%${search}%`),
                    like(usersCustomer.phoneNumber, `%${search}%`)
                )
            );
        }

        const sortColumn = sortBy === 'fullName' ? usersCustomer.fullName :
            sortBy === 'email' ? usersCustomer.phoneNumber :
                usersCustomer.createdAt;

        query = query.orderBy(
            sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn)
        );

        const countQuery = db.select({ count: count() }).from(usersCustomer);
        const totalResult = await countQuery;
        const total = totalResult[0]?.count || 0;

        const data = await query.limit(limitNumber).offset(offset);

        res.status(200).json({
            data,
            pagination: {
                total,
                page: pageNumber,
                limit: limitNumber,
                totalPages: Math.ceil(total / limitNumber),
            },
        });

    } catch (err) {
        logger.error(`Error in get customers ${err}`);
        res.status(500).json({message: 'Internal server error'});
    }
}

export const getCustomerById = async (req: RequestWithToken, res: Response) => {
    try {

        const customerId = Number(req.params.id);
        const data = await findUserById(customerId);

        if (!data) {
             res.status(404).json({message: 'Customer not found'});
        }

        res.status(200).json({data});

    }catch (err) {
        logger.error(`Error in get customer by id ${err}`);
        res.status(500).json({message: 'Internal server error'});
    }
}

export const bannerCustomer = async (req: RequestWithToken, res: Response) => {
    try {
        const customerId = Number(req.params.id);

        const data = await findUserById(customerId);

        if (!data) {
            return res.status(404).json({message: 'Customer not found'});
        }

        const [bannerReason] = await db.update (usersCustomer)
            .set({ status: 0 })
            .where(eq(usersCustomer.id, customerId))
            .returning();

        // Implement banner logic here

        res.status(200).json({message: `Customer with ID ${customerId} has been banned.`,});
    } catch (err) {
        logger.error(`Error in banner customer ${err}`);
        res.status(500).json({message: 'Internal server error'});
    }
};    