import { Request, Response, NextFunction } from 'express';
import {verifyJwtToken} from "../Jwt";
import {RequestWithToken} from "../../types/admin";
import {Parser} from "date-fns/parse/_lib/Parser";


export const extractTokenMiddleware = (req: RequestWithToken, res: Response, next: NextFunction) => {
    // 1. Get the header
    const authHeader = req.headers.authorization;

    // 2. Check if it exists and starts with "Bearer "
    if (authHeader && authHeader.startsWith('Bearer ')) {

        // 3. Extract the token (Split by space and take the second part)
        const token = authHeader.split(' ')[1];
        const verifiedToken = verifyJwtToken(token);
        console.log(`Verified Token: `, verifiedToken);
        if (!verifiedToken) {
            return res.status(401).json({ message: 'Invalid or expired token' });
        }

        req.adminId =  parseInt(verifiedToken.id);

        next();
    } else {
        // 4. Handle missing or wrong format
        res.status(401).json({ message: 'Authorization header missing or malformed' });
        // Do NOT call next() here, or the request will continue processing
    }
};