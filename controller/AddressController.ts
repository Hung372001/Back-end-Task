import { Request, Response } from 'express';

import { eq, and } from 'drizzle-orm';
import db from "../db";
import {customerAddresses} from "../db/schema";
import {RequestWithToken} from "../types/admin";

export class AddressController {

    // GET /api/customer/addresses
    async list(req: Request, res: Response) {
        const customerId = 1; // TODO: Lấy từ req.user.id
        const list = await db
            .select()
            .from(customerAddresses)
            .where(eq(customerAddresses.customerId, customerId));

        res.json({ success: true, data: list });
    }

    // POST /api/customer/addresses
    async create(req: RequestWithToken, res: Response) {
        const customerId = req.adminId;
        if(!customerId){
            return res.status(401).json({ success: false, message: 'Unauthorized: Missing customer ID' });
        }
        const { label, addressText, lat, long, isDefault } = req.body;

        // Nếu set default, phải bỏ default của các địa chỉ cũ
        if (isDefault) {
            await db.update(customerAddresses)
                .set({ isDefault: 0 })
                .where(eq(customerAddresses.customerId, customerId));
        }

        const [newItem] = await db.insert(customerAddresses).values({
            customerId,
            label,        // "Nhà", "Công ty"
            addressText,
            lat: lat.toString(),
            long: long.toString(),
            isDefault: isDefault || 0,
        }).returning();

        res.json({ success: true, data: newItem });
    }

    // DELETE /api/customer/addresses/:id
    async delete(req: Request, res: Response) {
        const id = parseInt(req.params.id);
        const customerId = 1;

        await db.delete(customerAddresses)
            .where(and(
                eq(customerAddresses.id, id),
                eq(customerAddresses.customerId, customerId)
            ));

        res.json({ success: true, message: 'Đã xóa địa chỉ' });
    }
}