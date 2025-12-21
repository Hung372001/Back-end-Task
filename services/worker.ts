import db from "../db";
import {and, eq} from "drizzle-orm/sql/expressions/conditions";
import axios from "axios";
import {jobAssignments, jobs, usersCustomer, usersWorker} from "../db/schema";
import {GetWorkerJobsQueryDto} from "../utils/validations";
import {desc, inArray, sql} from "drizzle-orm";


export const  findUserByZaloId = async (zaloId: string) =>{
    const result = await db
        .select()
        .from(usersWorker)
        .where(eq(usersWorker.zaloId, zaloId));

    return result[0] || null;
}

export const findUserById = async (id: number) =>{
    const result =  await db
        .select()
        .from(usersWorker)
        .where(eq(usersWorker.id, id));

    return result[0] || null;
}

export const createUserWithZalo = async (Customer:{
    zaloId: string,
    fullName: string,
}) =>{
    console.log('Creating user with Zalo:', Customer);
    const result = await db
        .insert(usersWorker)
        .values({
            zaloId: Customer.zaloId,
            fullName: Customer.fullName,
            status:'pending'
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

export const getMyJobs = async (workerId: number, query: GetWorkerJobsQueryDto) => {
    const { page, limit, filter } = query;
    const offset = (page - 1) * limit;

    // 1. Xây dựng điều kiện lọc
    const conditions = [eq(jobAssignments.workerId, workerId)];

    if (filter === 'active') {
        // Tab "Đang làm": accepted, arrived, in_progress
        conditions.push(inArray(jobAssignments.status, ['accepted', 'arrived', 'in_progress']));
    } else if (filter === 'history') {
        // Tab "Lịch sử": done, completed, cancelled
        conditions.push(inArray(jobAssignments.status, ['done', 'cancelled']));
    }

    const whereClause = and(...conditions);

    // 2. Query Data
    const dataQuery = db
        .select({
            // Thông tin Job Assignment (Quan trọng nhất: status của thợ)
            assignmentId: jobAssignments.id,
            myStatus: jobAssignments.status, // Trạng thái của thợ: accepted, arrived...
            isLeader: jobAssignments.isLeader,
            earningAmount: jobAssignments.earningAmount,
            acceptedAt: jobAssignments.acceptedAt,

            // Thông tin Job gốc
            jobId: jobs.id,
            jobType: jobs.jobType,
            jobStatus: jobs.status, // Trạng thái chung: locked, in_progress...
            description: jobs.descriptionText,
            bookingAddress: jobs.bookingAddressText,
            bookingLat: jobs.bookingLat,
            bookingLong: jobs.bookingLong,
            scheduledStartTime: jobs.scheduledStartTime,
            priceEstimated: jobs.priceEstimated,
            finalPrice: jobs.finalPrice,

            // Thông tin Khách hàng
            customerName: usersCustomer.fullName,
            customerPhone: usersCustomer.phoneNumber, // Cần xử lý ẩn hiện ở tầng logic sau
        })
        .from(jobAssignments)
        .innerJoin(jobs, eq(jobAssignments.jobId, jobs.id)) // Chỉ lấy job thợ đã nhận
        .leftJoin(usersCustomer, eq(jobs.customerId, usersCustomer.id))
        .where(whereClause)
        .limit(limit)
        .offset(offset)
        .orderBy(desc(jobAssignments.createdAt)); // Job mới nhận lên đầu

    // 3. Query Count (để phân trang)
    const countQuery = db
        .select({ count: sql<number>`count(*)` })
        .from(jobAssignments)
        .where(whereClause);

    const [data, countResult] = await Promise.all([dataQuery, countQuery]);
    const totalItems = Number(countResult[0]?.count || 0);

    // 4. Xử lý Logic ẩn số điện thoại khách [cite: 316]
    // Chỉ hiện SĐT khách khi thợ đã nhận việc và chưa xong hẳn
    const processedData = data.map(item => {
        const canViewPhone = ['accepted', 'arrived', 'in_progress'].includes(item.myStatus);
        return {
            ...item,
            customerPhone: canViewPhone ? item.customerPhone : '*********'
        };
    });

    return {
        data: processedData,
        pagination: {
            page,
            limit,
            totalItems,
            totalPages: Math.ceil(totalItems / limit)
        }
    };
}
