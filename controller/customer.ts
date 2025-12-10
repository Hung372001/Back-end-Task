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
import axios from "axios";
import {createUserWithZalo, findOrCreateZaloUser, findUserByZaloId, refreshAccessToken} from "../services/customer";


export  const loginZalo = async (req:Request, res:Response) => {
    try {

        const {code } = req.body;

        if(!code){
            return res.status(400).json({message: 'Code is required'});
        }

        const zaloAppSecret = process.env.ZALO_APP_SECRET;
        const redirectUri = process.env.ZALO_REDIRECT_URI;


        const params = new URLSearchParams();
        params.append('app_id', process.env.ZALO_APP_ID!);
        params.append('grant_type', 'authorization_code');
        params.append('code', code);


        const tokenResponse = await axios.post(`https://oauth.zaloapp.com/v4/access_token`,params, {

            headers: {
                "Content-Type":"application/x-www-form-urlencoded",
                "secret_key":zaloAppSecret
            }
        });



        const { access_token, refresh_token, expires_in } = tokenResponse.data;

        const userInfoResponse = await axios.get('https://graph.zalo.me/v2.0/me', {
            headers: {
                access_token,
            }
        });


        const userInfo = userInfoResponse.data ;


        const zaloUser = {
            zaloId: userInfo.id,
            fullName: userInfo.name,

        };


        const customer = await findOrCreateZaloUser(zaloUser);
        console.log(customer)

        const accessToken = generateJwtToken(zaloUser.zaloId)

        res.status(200).json({message: 'Đăng Nhập Thành Công', accessToken, data: userInfo});

    }catch (error) {
        logger.error(`Error in customer login', ${error}`);
        res.status(500).json({message: 'Internal server error'});
    }

}

export const refreshZaloToken = async (req:Request, res:Response) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                message: 'Refresh token is required'
            });
        }

        const newTokenData = await refreshAccessToken(refreshToken)

        res.json({
            success: true,
            accessToken: newTokenData.access_token,
            refreshToken: newTokenData.refresh_token,
            expiresIn: newTokenData.expires_in
        });

    } catch (error :any) {
        res.status(500).json({
            success: false,
            message: 'Refresh token failed',
            error: error.message
        });
    }
}

export const UpdateCustomerProfile = async (req:Request, res:Response) => {
    try {
        const  zaloId  = req.params.id;

        const {  fullName, phoneNumber, defaultLat,defaultLong } = req.body;


        const existingUser = await findUserByZaloId(zaloId);

        if (!existingUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        const updatedUser = await db
            .update(usersCustomer)
            .set({
                fullName: fullName || existingUser.fullName,
                phoneNumber: phoneNumber || existingUser.phoneNumber,
                defaultLat: defaultLat || existingUser.defaultLat,
                defaultLong: defaultLong || existingUser.defaultLong,
            })
            .where(eq(usersCustomer.zaloId, zaloId))
            .returning();

        res.status(200).json({ message: 'Profile updated successfully', data: updatedUser[0] });

    } catch (error) {
        logger.error(`Error updating customer profile: ${error}`);
        res.status(500).json({ message: 'Internal server error' });
    }
}