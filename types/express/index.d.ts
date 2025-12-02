import { Express } from "express-serve-static-core";

declare global {
    namespace Express {
        interface Request {
            adminId?: number; // We use '?' because not every request will have it yet
        }
    }
}