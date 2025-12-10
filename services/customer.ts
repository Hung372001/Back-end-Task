import db from "../db";
import {usersCustomer} from "../db/schema";
import {eq} from "drizzle-orm/sql/expressions/conditions";
import axios from "axios";


export const  findUserByZaloId = async (zaloId: string) =>{
    const result = await db
        .select()
        .from(usersCustomer)
        .where(eq(usersCustomer.zaloId, zaloId));

    return result[0] || null;
}

export const createUserWithZalo = async (Customer:{
    zaloId: string,
    fullName: string,
}) =>{
    console.log('Creating user with Zalo:', Customer);
    const result = await db
        .insert(usersCustomer)
        .values({
            zaloId: Customer.zaloId,
            fullName: Customer.fullName,
        })
        .returning();

    return result[0];
}

export const findOrCreateZaloUser = async (zaloUser: {
    zaloId: string;
    fullName: string;
}) => {
    // Tìm user hiện có
    const existingUser = await findUserByZaloId(zaloUser.zaloId);

    if (existingUser) {
        // Update thông tin nếu cần
        return existingUser;
    }

    return await createUserWithZalo(zaloUser);
    // Tạo user mới
}

export const  refreshAccessToken = async (refreshToken:string) =>{
    try {
        const response = await axios.get('https://oauth.zaloapp.com/v3/access_token', {
            params: {
                app_id: process.env.ZALO_APP_ID,
                app_secret:  process.env.ZALO_APP_SECRET,
                refresh_token: refreshToken,
                grant_type: 'refresh_token'
            }
        });

        return response.data;
    } catch (error:any) {
        console.error('Error refreshing token:', error.response?.data || error.message);
        throw new Error('Failed to refresh token');
    }
}