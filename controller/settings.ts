import { Request, Response } from 'express';
import {SystemSettingsService} from "../services/systemSetting";


const service = new SystemSettingsService();

export class SystemSettingsController {

    // GET /api/admin/settings
    async getAll(req: Request, res: Response) {
        try {
            const data = await service.getAllSettings();
            res.json({
                success: true,
                data: data
            });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Lỗi lấy cấu hình' });
        }
    }


    async getByGroup(req: Request, res: Response) {
        try {
            const group = req.params.group;
            const data = await service.getSettingsByGroup(group);
            res.json({
                success: true,
                data: data
            });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Lỗi lấy cấu hình theo nhóm' });
        }
    }

    // PUT /api/admin/settings
    // Body: { settings: [{ key: "jobnow_lock_seconds", value: "60" }, ...] }
    async update(req: Request, res: Response) {
        try {
            const { settings } = req.body;
            if (!Array.isArray(settings)) {
                return res.status(400).json({ success: false, message: 'Dữ liệu không hợp lệ' });
            }

            await service.updateSettings(settings);

            res.json({
                success: true,
                message: 'Cập nhật thành công'
            });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Lỗi cập nhật cấu hình' });
        }
    }


    // POST /api/admin/settings/seed (Chạy 1 lần đầu)
    async seed(req: Request, res: Response) {
        await service.seedDefaults();
        res.json({ success: true, message: 'Đã khởi tạo settings mặc định' });
    }
}