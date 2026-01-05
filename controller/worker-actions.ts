import { Request, Response } from 'express';
import {WorkerActionService} from "../services/worker-actions";
const actionService = new WorkerActionService();

export class WorkerActionController {

    // POST /api/worker/jobs/:id/arrive
    async arrive(req: Request, res: Response) {
        try {
            const jobId = parseInt(req.params.id);
            const workerId = 10; // TODO: req.user.id
            const { lat, long } = req.body;

            // Lấy file ảnh check-in (nếu có)
            const files = req.files as { [fieldname: string]: Express.Multer.File[] };
            const photo = files?.['photo']?.[0]?.buffer;

            if (!lat || !long) return res.status(400).json({ message: 'Thiếu tọa độ GPS' });

            const result = await actionService.workerArrive(workerId, jobId, parseFloat(lat), parseFloat(long), photo);
            res.json({ success: true, message: 'Check-in thành công', data: result });
        } catch (e: any) {
            res.status(400).json({ success: false, message: e.message });
        }
    }

    // POST /api/worker/jobs/:id/start
    async start(req: Request, res: Response) {
        try {
            const jobId = parseInt(req.params.id);
            const workerId = 10;
            await actionService.workerStart(workerId, jobId);
            res.json({ success: true, message: 'Bắt đầu làm việc' });
        } catch (e: any) {
            res.status(400).json({ success: false, message: e.message });
        }
    }

    // POST /api/worker/jobs/:id/complete
    async complete(req: Request, res: Response) {
        try {
            const jobId = parseInt(req.params.id);
            const workerId = 10;

            const files = req.files as { [fieldname: string]: Express.Multer.File[] };
            const photo = files?.['photo']?.[0]?.buffer;

            const result = await actionService.workerComplete(workerId, jobId, photo);

            res.json({
                success: true,
                message: 'Báo cáo hoàn thành công việc',
                jobStatus: result.isJobCompleted ? 'completed' : 'waiting_others'
            });
        } catch (e: any) {
            res.status(400).json({ success: false, message: e.message });
        }
    }
}