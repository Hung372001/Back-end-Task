// src/middleware/requestLogger.ts
import morgan from 'morgan';
import logger from "../../utils/loogger";


const stream = {
    write: (message: string) => {
        const regex = /\s(\d{3})\s/;
        const match = message.match(regex);
        const status = match ? parseInt(match[1]) : 0;

        if (status >= 500) {
            logger.error('HTTP Error', { request: message.trim() });
        } else if (status >= 400) {
            logger.warn('HTTP Client Error', { request: message.trim() });
        } else {
            logger.info('HTTP Request', { request: message.trim() });
        }
    },
};

export const requestLogger = morgan('combined', { stream });