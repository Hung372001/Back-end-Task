import { eq, and, sql } from 'drizzle-orm';
import {SystemSettingsService} from "./systemSetting";
import db from "../db";
import {jobAssignments, jobs} from "../db/schema";
import {getDistanceInMeters} from "../utils/geo";
import {uploadToCloudinary} from "../utils/cloudinary";


const settingsService = new SystemSettingsService();

export class WorkerActionService {

    /**
     * 1. THỢ BÁO ĐÃ ĐẾN NƠI (Check-in)
     * - Check GPS ±150m
     * - Upload ảnh check-in
     */
    async workerArrive(workerId: number, jobId: number, lat: number, long: number, photoBuffer?: Buffer) {
        return await db.transaction(async (tx) => {
            // Lấy thông tin Job và Assignment
            const jobData = await tx
                .select({
                    jobLat: jobs.bookingLat,
                    jobLong: jobs.bookingLong,
                    assignStatus: jobAssignments.status,
                    assignId: jobAssignments.id
                })
                .from(jobs)
                .innerJoin(jobAssignments, eq(jobs.id, jobAssignments.jobId))
                .where(and(eq(jobs.id, jobId), eq(jobAssignments.workerId, workerId)));

            if (!jobData[0]) throw new Error('Không tìm thấy công việc.');
            const { jobLat, jobLong, assignStatus, assignId } = jobData[0];

            if (assignStatus !== 'accepted') throw new Error('Trạng thái không hợp lệ để báo đến nơi.');

            // 1. Kiểm tra khoảng cách (GPS Check)
            const distance = getDistanceInMeters(Number(jobLat), Number(jobLong), lat, long);

            // Lấy cấu hình bán kính cho phép (Mặc định 150m)
            const allowedRadius = await settingsService.getNumber('gps_check_radius_meters', 150);

            if (distance > allowedRadius) {
                throw new Error(`Bạn đang ở quá xa vị trí làm việc (${Math.round(distance)}m). Cần lại gần dưới ${allowedRadius}m.`);
            }

            // 2. Upload ảnh Check-in (Nếu có)
            let checkInUrl = null;
            if (photoBuffer) {
                checkInUrl = await uploadToCloudinary(photoBuffer, `jobs/${jobId}/checkin`);
            }

            // TODO: Nếu cấu hình 'require_checkin_photo' = true mà ko có ảnh thì throw Error

            // 3. Update DB
            await tx.update(jobAssignments)
                .set({
                    status: 'arrived',
                    arrivedAt: new Date(),
                    // checkInPhotoUrl: checkInUrl, // (Cần thêm cột này vào schema nếu chưa có)
                    updatedAt: new Date()
                })
                .where(eq(jobAssignments.id, assignId));

            return { success: true, distance };
        });
    }

    /**
     * 2. BẮT ĐẦU LÀM VIỆC (Start)
     * - Chuyển status thợ -> in_progress
     * - Chuyển status job -> in_progress (nếu chưa chuyển)
     */
    async workerStart(workerId: number, jobId: number) {
        return await db.transaction(async (tx) => {
            // Update thợ
            await tx.update(jobAssignments)
                .set({ status: 'in_progress', startedAt: new Date() })
                .where(and(eq(jobAssignments.jobId, jobId), eq(jobAssignments.workerId, workerId)));

            // Update Job tổng (Nếu nó chưa là in_progress)
            await tx.update(jobs)
                .set({ status: 'in_progress', updatedAt: new Date() })
                .where(and(eq(jobs.id, jobId), sql`${jobs.status} != 'in_progress'`));

            return { success: true };
        });
    }

    /**
     * 3. HOÀN THÀNH CÔNG VIỆC (Complete)
     * - Upload ảnh Check-out
     * - Update thợ -> done
     * - Kiểm tra nếu TẤT CẢ thợ xong -> Job Completed
     */
    async workerComplete(workerId: number, jobId: number, photoBuffer?: Buffer) {
        return await db.transaction(async (tx) => {
            // 1. Upload ảnh Check-out
            let checkOutUrl = null;
            if (photoBuffer) {
                checkOutUrl = await uploadToCloudinary(photoBuffer, `jobs/${jobId}/checkout`);
            }

            // 2. Update status thợ -> done
            await tx.update(jobAssignments)
                .set({
                    status: 'done',
                    finishedAt: new Date(),
                    // checkOutPhotoUrl: checkOutUrl, // (Cần thêm cột này vào schema)
                    updatedAt: new Date()
                })
                .where(and(eq(jobAssignments.jobId, jobId), eq(jobAssignments.workerId, workerId)));

            // 3. Logic quan trọng: Kiểm tra xem tất cả thợ đã xong chưa?
            // Đếm tổng số thợ trong job
            const [totalWorker] = await tx
                .select({ count: sql<number>`count(*)` })
                .from(jobAssignments)
                .where(eq(jobAssignments.jobId, jobId));

            // Đếm số thợ đã xong (status = done)
            const [doneWorker] = await tx
                .select({ count: sql<number>`count(*)` })
                .from(jobAssignments)
                .where(and(eq(jobAssignments.jobId, jobId), eq(jobAssignments.status, 'done')));

            const isAllDone = Number(doneWorker.count) === Number(totalWorker.count);

            // 4. Nếu tất cả đã xong -> Chốt Job
            if (isAllDone) {
                // Tính toán giờ làm thực tế (Ví dụ lấy giờ xong - giờ bắt đầu của thợ đầu tiên hoặc trung bình)
                // Ở đây đơn giản update status trước
                await tx.update(jobs)
                    .set({
                        status: 'completed',
                        // actualHours: ... (logic tính giờ),
                        updatedAt: new Date()
                    })
                    .where(eq(jobs.id, jobId));
            }

            return { success: true, isJobCompleted: isAllDone };
        });
    }
}