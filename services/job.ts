
import { addMinutes } from 'date-fns';
import {CreateJobDto, GetJobsQueryDto} from "../utils/validations";
import {SystemSettingsService} from "./systemSetting";
import db from "../db";
import {jobs, usersCustomer} from "../db/schema";
import {and, eq, like, or} from "drizzle-orm/sql/expressions/conditions";
import {asc, desc, sql} from "drizzle-orm";

const settingsService = new SystemSettingsService();

export class JobService {

    /**
     * Pricing Engine: Tính giá dựa trên System Settings
     * [cite: 301, 386]
     */
    async calculatePrice(dto: CreateJobDto) {
        // 1. Lấy cấu hình giá từ DB/Cache
        const hourlyRate = await settingsService.getNumber('hourly_rate', 80000); // [cite: 131]
        const minHours = await settingsService.getNumber('min_hours', 2); // [cite: 133]
        const basePrice = await settingsService.getNumber('base_price', 100000); // [cite: 132]

        // 2. Logic tính toán [cite: 302, 303]
        const hoursUsed = Math.max(dto.estimatedHours, minHours);
        let price = hourlyRate * hoursUsed * dto.workerQuantity;

        // 3. Apply Base Price
        if (price < basePrice) {
            price = basePrice;
        }

        return price;
    }

    /**
     * Tạo Job Mới
     * [cite: 287]
     */
    async createJob(customerId: number, dto: CreateJobDto) {
        // 1. Tính giá ước tính
        const estimatedPrice = await this.calculatePrice(dto);

        // 2. Tính thời gian hết hạn (Auto Expire)
        // Nếu là JobNow (không có lịch hẹn), lấy setting timeout
        let autoExpireAt = null;
        if (!dto.scheduledStartTime) {
            // Ví dụ: JobNow hết hạn sau 15 phút nếu ko ai nhận
            const expireMinutes = await settingsService.getNumber('job_searching_timeout_minutes', 15);
            autoExpireAt = addMinutes(new Date(), expireMinutes);
        }

        // 3. Insert DB
        const [newJob] = await db.insert(jobs).values({
            customerId:customerId,
            jobType: dto.jobType,
            descriptionText: dto.descriptionText,
            descriptionVoiceUrl: dto.descriptionVoiceUrl,
            workerQuantity: dto.workerQuantity,
            bookingLat: dto.bookingLat.toString(), // Drizzle decimal map sang string
            bookingLong: dto.bookingLong.toString(),
            bookingAddressText: dto.bookingAddressText,
            scheduledStartTime: dto.scheduledStartTime ? new Date(dto.scheduledStartTime) : null,
            estimatedHours: dto.estimatedHours,
            priceEstimated: estimatedPrice.toString(), // [cite: 81]
            finalPrice: estimatedPrice.toString(), // Tạm thời giá chốt = giá ước tính
            status: 'searching', // [cite: 84]
            paymentMethod: dto.paymentMethod,
            paymentStatus: 'unpaid', // [cite: 88]
            autoExpireAt: autoExpireAt,
            createdAt: new Date(),


            updatedAt: new Date(),
        }).returning();

        // 4. Trigger Matching Service (Bắn thông báo tìm thợ) [cite: 307]
        // await matchingService.dispatch(newJob.id);

        return newJob;
    }

    async findAll(query: GetJobsQueryDto) {
        const { page, limit, status, jobType, search, sortBy } = query;
        const offset = (page - 1) * limit;

        // 1. Xây dựng điều kiện lọc (Dynamic Where)
        const conditions = [];

        if (status) {
            conditions.push(eq(jobs.status, status)); // [cite: 84]
        }

        if (jobType) {
            conditions.push(eq(jobs.jobType, jobType)); // [cite: 68]
        }

        if (search) {
            // Tìm trong mô tả hoặc địa chỉ [cite: 70, 76]
            conditions.push(
                or(
                    like(jobs.descriptionText, `%${search}%`),
                    like(jobs.bookingAddressText, `%${search}%`)
                )
            );
        }

        // Gom tất cả điều kiện bằng AND
        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        // 2. Xử lý sắp xếp
        let orderByClause = desc(jobs.createdAt); // Mặc định mới nhất [cite: 92]
        if (sortBy === 'oldest') orderByClause = asc(jobs.createdAt);
        if (sortBy === 'price_high') orderByClause = desc(jobs.priceEstimated); // [cite: 81]
        if (sortBy === 'price_low') orderByClause = asc(jobs.priceEstimated);

        // 3. Query Database (Có Join để lấy tên khách hàng)
        const dataQuery = db
            .select({
                id: jobs.id,
                jobType: jobs.jobType,
                status: jobs.status,
                priceEstimated: jobs.priceEstimated,
                bookingAddress: jobs.bookingAddressText,
                createdAt: jobs.createdAt,
                scheduledStartTime: jobs.scheduledStartTime,
                customerName:usersCustomer.fullName, // Lấy tên khách [cite: 9]
                customerPhone: usersCustomer.phoneNumber, // Lấy sđt khách [cite: 8]
            })
            .from(jobs)
            .leftJoin(usersCustomer, eq(jobs.customerId, usersCustomer.id)) // [cite: 67]
            .where(whereClause)
            .limit(limit)
            .offset(offset)
            .orderBy(orderByClause);

        // 4. Query đếm tổng số (Total Count) để phân trang
        const countQuery = db
            .select({ count: sql<number>`count(*)` })
            .from(jobs)
            .where(whereClause);

        // Chạy song song 2 query cho nhanh
        const [data, countResult] = await Promise.all([dataQuery, countQuery]);

        const totalItems = Number(countResult[0]?.count || 0);
        const totalPages = Math.ceil(totalItems / limit);

        return {
            data,
            pagination: {
                page,
                limit,
                totalItems,
                totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        };
    }
    async findById(id:number){
        const dataQuery = await db
            .select({
                id: jobs.id,
                jobType: jobs.jobType,
                status: jobs.status,
                priceEstimated: jobs.priceEstimated,
                bookingAddress: jobs.bookingAddressText,
                createdAt: jobs.createdAt,
                workerQuantity: jobs.workerQuantity,
                scheduledStartTime: jobs.scheduledStartTime,
                customerName:usersCustomer.fullName, // Lấy tên khách [cite: 9]
                customerPhone: usersCustomer.phoneNumber, // Lấy sđt khách [cite: 8]
            })
            .from(jobs)
            .leftJoin(usersCustomer, eq(jobs.customerId, usersCustomer.id)) // [cite: 67]
            .where( eq(jobs.id, id) )
            .limit(1)

        return dataQuery[0] || null;
    }
}