import { Request, Response } from 'express';
import {JobService} from "../services/job";
import {CancelJobSchema, CreateJobSchema, GetJobsQuerySchema} from "../utils/validations";
import {RequestWithToken} from "../types/admin";

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


}