import * as jwt from 'jsonwebtoken';
import logger from "../utils/loogger";

interface UserPayload {
    id: string;
}

const secretKey:string = process.env.JWT_SECRET_KEY || 'your-very-secure-secret-key';

export const generateJwtToken = (user: UserPayload): string =>{

    try {
        const header = {
            alg: 'HS256',
            typ: 'JWT',
        };

        const issuedAt = Math.floor(Date.now() / 1000);
        const payload = {
            sub: user.id,
            iat: issuedAt,
        };

        return jwt.sign(payload, secretKey, {header: header, expiresIn: "7d"});
    }catch (error) {
        logger.error('Error generating JWT token', {error});
        throw error;
    }
}


export  const verifyJwtToken = (token: string): UserPayload | null => {

    try {
        const decoded = jwt.verify(token, secretKey) as jwt.JwtPayload;
        return {
            id: decoded.sub as string,
        };
    } catch (error) {
        logger.error('JWT verification failed', {error});
        return null;
    }
}