
import { addMinutes } from 'date-fns';
import {CreateJobDto, GetJobsQueryDto} from "../utils/validations";
import {SystemSettingsService} from "./systemSetting";
import db from "../db";
import {jobAssignments, jobs, usersCustomer, usersWorker} from "../db/schema";
import {and, eq, like, or} from "drizzle-orm/sql/expressions/conditions";
import {asc, desc, sql} from "drizzle-orm";
import {TRUST_CONFIG} from "../constants/trust-score.config";
import {TrustScoreService} from "./trustScore";

const settingsService = new SystemSettingsService();
const trustService = new TrustScoreService();
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

    async cancelJob(jobId: number, customerId: number, reason: string) {
        return await db.transaction(async (tx) => {
            // 1. Tìm Job và lock dòng này để tránh race condition
            // (Trong Drizzle chưa có native "FOR UPDATE" dễ dàng, ta check logic trước)
            const [job] = await tx
                .select()
                .from(jobs)
                .where(and(eq(jobs.id, jobId), eq(jobs.customerId, customerId))); // Check đúng chủ job

            if (!job) {
                throw new Error('Không tìm thấy đơn việc hoặc bạn không có quyền hủy.');
            }

            // 2. Validate Trạng thái [Cite Source: 319]
            // Không cho hủy nếu đã hoàn thành hoặc đang làm
            const invalidStatuses = ['in_progress', 'completed', 'cancelled'];
            if (invalidStatuses.includes(job.status)) {
                throw new Error(`Không thể hủy job khi đang ở trạng thái: ${job.status}`);
            }

            // 3. Logic tính phí phạt (TODO: Tích hợp Wallet Service sau này)
            // Nếu job.status === 'locked' (đã có thợ), có thể trừ tiền cọc hoặc điểm uy tín
            // if (job.status === 'locked') { ... deductFee() ... }
            let penalty = 0;
            let actionType = 'CANCEL_UNKNOWN';
            switch (job.status) {
                case 'searching': // Tương ứng Pending
                    penalty = TRUST_CONFIG.PENALTY_CANCEL.PENDING; // -0.02
                    actionType = 'CANCEL_PENDING';
                    break;

                case 'locked': // Tương ứng Assigned (Đã có thợ nhận)
                    penalty = TRUST_CONFIG.PENALTY_CANCEL.ASSIGNED; // -0.07
                    actionType = 'CANCEL_ASSIGNED';
                    break;

                case 'in_progress': // Tương ứng Working
                    penalty = TRUST_CONFIG.PENALTY_CANCEL.WORKING; // -0.15
                    actionType = 'CANCEL_WORKING';
                    break;
            }
            // 4. Update bảng Jobs
            await tx.update(jobs)
                .set({
                    status: 'cancelled',
                    cancelReason: reason,
                    updatedAt: new Date(),
                })
                .where(eq(jobs.id, jobId));

            // 5. Giải phóng thợ (Update bảng Assignments)
            // Chuyển trạng thái của tất cả thợ trong job này sang 'cancelled'

            await tx.update(jobs).set({ status: 'cancelled', cancelReason: reason }).where(eq(jobs.id, jobId));
            await tx.update(jobAssignments).set({ status: 'cancelled' }).where(eq(jobAssignments.jobId, jobId));

            // 4. TRỪ ĐIỂM UY TÍN (Nếu có phạt)
            if (penalty !== 0) {
                // Lưu ý: penalty đang là số âm, ta cộng trực tiếp
                await trustService.updateTrustScore(
                    customerId,
                    penalty,
                    actionType,
                    jobId,
                    `Hủy job ở trạng thái ${job.status}`
                );
            }


            return true;
        });
    }

// Thêm vào JobService
    async rateWorker(jobId: number, customerId: number, rating: number, comment?: string) {
        return await db.transaction(async (tx) => {
            // 1. Validate: Job phải là của khách này và trạng thái phải là COMPLETED
            const [job] = await tx
                .select()
                .from(jobs)
                .leftJoin(jobAssignments, eq(jobs.id, jobAssignments.jobId))
                .where(and(eq(jobs.id, jobId), eq(jobs.customerId, customerId)));

            if (!job || job.jobs.status !== 'completed') {
                throw new Error('Job chưa hoàn thành hoặc không tồn tại.');
            }

            const workerId = job.job_assignments?.workerId;
            if (!workerId) throw new Error('Không tìm thấy thợ để đánh giá.');

            // 2. Lưu đánh giá (Có thể tạo bảng reviews riêng, ở đây ta update vào assignment cho gọn MVP)
            // Giả sử bảng job_assignments có cột rating, comment (cần thêm vào schema nếu chưa có)
            /* await tx.update(job_assignments).set({ rating, comment })...
            */

            // 3. Tính lại điểm trung bình cho thợ (Rating Avg) [cite: 45]
            // Công thức: NewAvg = ((OldAvg * Count) + NewRate) / (Count + 1)
            const [worker] = await tx.select().from(usersWorker).where(eq(usersWorker.id, workerId));

            const currentAvg = parseFloat(worker.ratingAvg || '5.0');
            const currentCount = worker.ratingCount || 0;

            const newCount = currentCount + 1;
            const newAvg = ((currentAvg * currentCount) + rating) / newCount;

            await tx.update(usersWorker)
                .set({
                    ratingAvg: newAvg.toFixed(1), // Lưu 1 số lẻ (4.5)
                    ratingCount: newCount
                })
                .where(eq(usersWorker.id, workerId));

            // 4. (Optional) Gọi TrustService để cộng điểm thưởng cho thợ
            // if (rating === 5) await trustService.rewardWorker(workerId, ...);

            return true;
        });
    }

    async acceptJob(jobId: number, workerId: number) {
        return await db.transaction(async (tx) => {
            // 1. Lock Job Row: Ngăn các request khác đọc/sửa dòng này cùng lúc
            // Drizzle hỗ trợ .for('update') để tạo câu lệnh SELECT ... FOR UPDATE
            const [job] = await tx
                .select()
                .from(jobs)
                .where(eq(jobs.id, jobId))
                .for('update'); // QUAN TRỌNG: Lock dòng này

            if (!job) {
                throw new Error('Công việc không tồn tại.');
            }

            // 2. Validate trạng thái Job
            if (job.status !== 'searching') {
                throw new Error('Công việc này đã đủ người hoặc đã bị hủy.');
            }

            // 3. Kiểm tra xem thợ này đã nhận job này chưa (Idempotency)
            const existingAssignment = await tx
                .select()
                .from(jobAssignments)
                .where(and(
                    eq(jobAssignments.jobId, jobId),
                    eq(jobAssignments.workerId, workerId)
                ));

            if (existingAssignment.length > 0) {
                throw new Error('Bạn đã nhận công việc này rồi.');
            }

            // 4. Đếm số lượng thợ hiện tại đang tham gia job [cite: 247]
            // Đếm các status hợp lệ: accepted, arrived, in_progress, done
            const assignments = await tx
                .select({count: sql<number>`count(*)`})
                .from(jobAssignments)
                .where(and(
                    eq(jobAssignments.jobId, jobId),
                    sql`${jobAssignments.status} IN ('accepted', 'arrived', 'in_progress', 'done')`
                ));

            const currentWorkerCount = Number(assignments[0]?.count || 0);


            if(!job.workerQuantity){
                throw new Error('Số lượng thợ cho công việc không hợp lệ.');
            }
            // 5. Kiểm tra Slot
            if (currentWorkerCount >= job.workerQuantity) {
                // Nếu đã đủ người (mà status vẫn searching -> do race condition) -> update lại status luôn
                await tx.update(jobs).set({status: 'locked'}).where(eq(jobs.id, jobId));
                throw new Error('Rất tiếc, công việc đã đủ người.');
            }

            // 6. Insert Assignment (Thợ nhận việc) [cite: 249-252]
            await tx.insert(jobAssignments).values({
                jobId: jobId,
                workerId: workerId,
                status: 'accepted',
                acceptedAt: new Date(),
                isLeader: currentWorkerCount === 0 ? 1 : 0, // Người đầu tiên là trưởng nhóm (optional logic)
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            // 7. Check lại lần cuối: Nếu sau khi thêm thợ này mà đủ số lượng -> Lock Job
            if (currentWorkerCount + 1 >= job.workerQuantity) {
                await tx.update(jobs)
                    .set({status: 'locked', updatedAt: new Date()})
                    .where(eq(jobs.id, jobId));
            }

            return {success: true, message: 'Nhận việc thành công!'};
        });
    }
}