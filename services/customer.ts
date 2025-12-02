import { Request, Response } from 'express';
import loogger from "../utils/loogger";
import { sendSMS} from "../utils/sms";
import twilio from "twilio";

import db from "../db";
import {usersCustomer} from "../db/schema";
import {eq} from "drizzle-orm/sql/expressions/conditions";
import redis from "../db/redis";
import {generateJwtToken} from "../auth/Jwt";
import logger from "../utils/loogger";


export const sendOtp = async (req:Request, res:Response) => {
    try {
        const { phone } = req.body;
        const normalizedPhone = phone.replace(/^\+84/, '0');
        const lastSent = await redis.get(`otp:cooldown:${phone}`);
        if (lastSent) {
            return res.status(429).json({ error: 'Vui lòng đợi 60 giây trước khi gửi lại' });
        }
        console.log('Sending OTP to phone:', phone);
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        await redis.multi()
            .set(`otp:${normalizedPhone}`, otp, 'EX', 300)     // 5 phút
            .set(`otp:cooldown:${normalizedPhone}`, '1', 'EX', 60) // chống spam
            .exec();
        await sendSMS( phone,`Mã OTP của bạn là: ${otp} (có hiệu lực 5 phút)`);
        res.json({ message: 'Đã gửi OTP thành công', phone: normalizedPhone });
    } catch (error) {
        logger.error('SMS error:', error);
        res.status(500).json({ error: 'Không thể gửi SMS lúc này' });
    }
}


export const verifyOtp = async (req:Request, res:Response) => {
    try {
        const { phone, otp } = req.body;
        const normalizedPhone = phone.replace(/^\+84/, '0');
        const storedOtp = await redis.get(`otp:${normalizedPhone}`);

        if (!storedOtp || storedOtp !== otp) {
            return res.status(400).json({ error: 'Mã OTP không đúng hoặc đã hết hạn' });
        }

        // Xóa OTP sau khi dùng thành công
        await redis.del(`otp:${normalizedPhone}`);

        let customer = await db.select().from(usersCustomer).where(eq(usersCustomer.phoneNumber, normalizedPhone)).limit(1).then(res => res[0]);

        if(!customer){
            customer = await db.insert(usersCustomer).values({
                phoneNumber: normalizedPhone,
                fullName: `Khách hàng ${normalizedPhone.slice(-4)}`,
            }).returning().then(res => res[0]);
        }

        const payload = {
            id: customer.id.toString(),
        }

        const token = generateJwtToken(payload)

        res.json({
            message: 'Xác thực OTP thành công',
            accessToken: token,
            customer: {
                id: customer.id,
                phoneNumber: customer.phoneNumber,
                fullName: customer.fullName,
            }
        });

    }catch (error) {
        loogger.error('Error in verifyOtp', {error});
        res.status(500).json({ error: 'Lỗi máy chủ nội bộ' });
    }


}