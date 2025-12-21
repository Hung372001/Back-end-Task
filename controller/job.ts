import { Request, Response } from 'express';
import {JobService} from "../services/job";
import {
    CancelJobSchema,
    CreateJobSchema,
    GetJobsQuerySchema,
    GetWorkerJobsQuerySchema,
    RateJobSchema
} from "../utils/validations";
import {RequestWithToken} from "../types/admin";
import {getMyJobs} from "../services/worker";

const jobService = new JobService();

export class JobController {

    // POST /api/jobs/create
    async create(req: RequestWithToken, res: Response) {
        try {
            // 1. Lấy User ID từ Token (Giả sử middleware auth đã gán vào req.user)
            // const customerId = req.user.id;
            const customerId = req.adminId; // Mock ID cho dev
            if (!customerId) {
                return res.status(401).json({ success: false, message: 'Unauthorized: Missing customer ID' });
            }

            // 2. Validate Body
            const validation = CreateJobSchema.safeParse(req.body);
            if (!validation.success) {
                return res.status(400).json({
                    success: false,
                    errors: validation.error.format()
                });
            }

            // 3. Gọi Service
            const newJob = await jobService.createJob(customerId, validation.data);

            // 4. Trả về kết quả
            return res.status(201).json({
                success: true,
                message: 'Đã tạo đơn việc thành công',
                data: {
                    jobId: newJob.id,
                    status: newJob.status,
                    price: newJob.priceEstimated,
                    expireAt: newJob.autoExpireAt
                }
            });

        } catch (error) {
            console.error(error);
            return res.status(500).json({
                success: false,
                message: 'Lỗi hệ thống khi tạo job'
            });
        }
    }

    async findAll(req: RequestWithToken, res: Response) {
        try {
            // 1. Validate Query Params bằng Zod
            const validation = GetJobsQuerySchema.safeParse(req.query);

            if (!validation.success) {
                return res.status(400).json({
                    success: false,
                    message: 'Tham số không hợp lệ',
                    errors: validation.error.format()
                });
            }

            // 2. Gọi Service
            const result = await jobService.findAll(validation.data);

            // 3. Trả về
            return res.json({
                success: true,
                message: 'Lấy danh sách job thành công',
                data: result.data,
                pagination: result.pagination
            });

        } catch (error) {
            console.error(error);
            return res.status(500).json({
                success: false,
                message: 'Lỗi hệ thống'
            });
        }
    }

    async findById(req: Request, res: Response) {
        try {
            const jobId = parseInt(req.params.id);
            if (isNaN(jobId)) {
                return res.status(400).json({ success: false, message: 'Job ID không hợp lệ' });
            }

            const job = await jobService.findById(jobId);
            if (!job) {
                return res.status(404).json({ success: false, message: 'Không tìm thấy job' });
            }

            return res.json({ success: true, data: job });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ success: false, message: 'Lỗi hệ thống' });
        }
    }

    async cancel(req: RequestWithToken, res: Response) {
        try {
            const jobId = parseInt(req.params.id);
            const customerId = req.adminId;

            console.log('Cancel Job Request:', {  customerId });
            if(!customerId) {
                return res.status(401).json({ success: false, message: 'Unauthorized: Missing customer ID' });
            }
            // 1. Validate Body
            const validation = CancelJobSchema.safeParse(req.body);
            if (!validation.success) {
                return res.status(400).json({ success: false, errors: validation.error.format() });
            }

            if (isNaN(jobId)) {
                return res.status(400).json({ success: false, message: 'ID Job không hợp lệ' });
            }

            // 2. Gọi Service
            await jobService.cancelJob(jobId, customerId, validation.data.reason);

            // 3. Trả về
            return res.json({
                success: true,
                message: 'Đã hủy đơn việc thành công'
            });

        } catch (error: any) {
            console.error(error);
            // Xử lý lỗi logic (ví dụ: đang làm không được hủy)
            if (error.message.includes('Không thể hủy') || error.message.includes('Không tìm thấy')) {
                return res.status(400).json({ success: false, message: error.message });
            }
            return res.status(500).json({ success: false, message: 'Lỗi hệ thống khi hủy job' });
        }
    }

    async rate(req: RequestWithToken, res: Response) {
        try {
            const jobId = parseInt(req.params.id);
            const customerId = req.adminId;

            if(!customerId) {
                return res.status(401).json({ success: false, message: 'Unauthorized: Missing customer ID' });
            }

            // 1. Validate Body
            const validation = RateJobSchema.safeParse(req.body);
            if (!validation.success) {
                return res.status(400).json({ success: false, errors: validation.error.format() });
            }

            if (isNaN(jobId)) {
                return res.status(400).json({ success: false, message: 'ID Job không hợp lệ' });
            }

            // 2. Gọi Service
            await jobService.rateWorker(jobId, customerId, validation.data.rating, validation.data.comment);

            // 3. Trả về
            return res.json({
                success: true,
                message: 'Cảm ơn bạn đã đánh giá công việc!'
            });

        } catch (error: any) {
            console.error(error);
            // Xử lý lỗi logic (ví dụ: chưa hoàn thành không được đánh giá)
            if (error.message.includes('Không thể đánh giá') || error.message.includes('Không tìm thấy')) {
                return res.status(400).json({ success: false, message: error.message });
            }
            return res.status(500).json({ success: false, message: 'Lỗi hệ thống khi đánh giá job' });
        }
    }
    // POST /api/jobs/estimate-price (API phụ để FE hiển thị giá trước khi bấm đặt)
    async estimatePrice(req: Request, res: Response) {
        try {
            const validation = CreateJobSchema.safeParse(req.body);
            if (!validation.success) return res.status(400).json({ success: false });

            const price = await jobService.calculatePrice(validation.data);

            return res.json({ success: true, price });
        } catch (e) {
            return res.status(500).json({ success: false });
        }
    }

    async getMyJobs(req: Request, res: Response) {
        try {
            // TODO: Lấy ID từ Token (req.user.id)
            const workerId = 10;

            // Validate Query
            const validation = GetWorkerJobsQuerySchema.safeParse(req.query);
            if (!validation.success) {
                return res.status(400).json({ success: false, errors: validation.error.format() });
            }

            const result = await getMyJobs(workerId, validation.data);

            res.json({
                success: true,
                message: 'Lấy danh sách việc thành công',
                data: result.data,
                pagination: result.pagination
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: 'Lỗi hệ thống' });
        }
    }

    async accept(req: RequestWithToken, res: Response) {
        try {
            const jobId = parseInt(req.params.id);

            // TODO: Lấy workerId từ JWT Token (req.user.id)
            const workerId = req.adminId;

            if(!workerId){
                return res.status(401).json({success: false, message: 'Unauthorized: Missing worker ID'});
            }


            if (isNaN(jobId)) {
                return res.status(400).json({success: false, message: 'ID Job không hợp lệ'});
            }

            // Gọi service (đã bao gồm transaction bên trong)
            const result = await jobService.acceptJob(jobId, workerId);

            return res.json({
                success: true,
                message: result.message
            });

        } catch (error: any) {
            console.error('Accept Job Error:', error);

            // Xử lý các lỗi nghiệp vụ cụ thể để trả về message thân thiện
            if (error.message.includes('đã đủ người') || error.message.includes('đã nhận')) {
                return res.status(409).json({success: false, message: error.message}); // 409 Conflict
            }

            return res.status(500).json({
                success: false,
                message: 'Lỗi hệ thống khi nhận việc.'
            });
        }
    }
}