// scripts/seedAdmin.ts
import 'dotenv/config';
import bcrypt from 'bcrypt';
import {admins} from "../db/schema";
import db from "../db";
import {eq} from "drizzle-orm/sql/expressions/conditions";


const SUPER_ADMIN_EMAIL = 'admin@gmail.com';
const SUPER_ADMIN_PASSWORD = '12345678'; // đổi sau khi login lần đầu

async function seedAdmin() {
    try {
        // Kiểm tra đã có admin chưa
        const existing = await db
            .select()
            .from(admins)
            .where(eq(admins.email, SUPER_ADMIN_EMAIL))
            .limit(1);

        if (existing.length > 0) {
            console.log('Super Admin đã tồn tại rồi!');
            console.log(`Email: ${SUPER_ADMIN_EMAIL}`);
            process.exit(0);
        }

        // Tạo mới
        const passwordHash = await bcrypt.hash(SUPER_ADMIN_PASSWORD, 12);

        await db.insert(admins).values({
            name: 'Super Admin',
            email: SUPER_ADMIN_EMAIL,
            passwordHash,
            role: 'super_admin', // hoặc enum nếu bạn dùng
            createdAt: new Date(),
        });

        console.log('Tạo Super Admin thành công!');
        console.log(`Email   : ${SUPER_ADMIN_EMAIL}`);
        console.log(`Mật khẩu: ${SUPER_ADMIN_PASSWORD}`);
        console.log('');
        console.log('Đăng nhập ngay tại: POST /api/auth/admin/login');
        console.log('Nhớ đổi mật khẩu ngay lần đầu nhé!');

        process.exit(0);
    } catch (error: any) {
        console.error('Seed admin thất bại:', error.message);
        process.exit(1);
    }
}

seedAdmin();