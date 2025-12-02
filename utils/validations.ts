
import { z } from 'zod';

// ======================== COMMON ========================
const phoneRegex = /^0[3|5|7|8|9]\d{8}$/;
const latRegex = /^-?([1-8]?[0-9]\.{1}\d{1,7}|90\.0{1,7})$/;
const longRegex = /^-?([1-9]?[0-9]\.{1}\d{1,7}|1[0-7][0-9]\.{1}\d{1,7}|180\.0{1,7})$/;

// ======================== AUTH ========================
export const loginPhoneSchema = z.object({
    phone_number: z.string(),
});

export const verifyOtpSchema = z.object({
    phone_number: z.string().regex(phoneRegex),
    otp: z.string().length(6, 'OTP phải 6 số'),
});

// ======================== WORKER ========================
export const workerRegisterSchema = z.object({
    phone_number: z.string().regex(phoneRegex, 'SĐT không hợp lệ'),
    full_name: z.string().min(2, 'Họ tên ít nhất 2 ký tự').max(100),
    gender: z.enum(['male', 'female', 'other']),
    yob: z.number().int().min(1950).max(new Date().getFullYear() - 16),
    height_cm: z.number().int().min(100).max(250),
    weight_kg: z.number().int().min(30).max(200),

    // OCR sẽ điền tự động, nhưng vẫn validate khi thợ sửa tay
    cccd_number: z.string().regex(/^\d{9,12}$/, 'CCCD sai định dạng'),
    cccd_name: z.string().min(2).max(150),
    cccd_dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'DOB phải YYYY-MM-DD'),
    cccd_address: z.string().min(5).max(255),
    cccd_issued_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),

    // URL ảnh (sau khi upload xong)
    cccd_front_url: z.string().url(),
    cccd_back_url: z.string().url(),
    avatar_face_url: z.string().url(),
    avatar_full_body_url: z.string().url().optional(),
});

export const workerUpdateLocationSchema = z.object({
    current_lat: z.number().min(-90).max(90),
    current_long: z.number().min(-180).max(180),
    is_online: z.boolean(),
});

export const workerSettingsSchema = z.object({
    preferred_job_types: z.array(z.enum(['boc_vac', 'don_dep', 'chuyen_nha', 'viec_vat'])).min(1),
    max_distance_km: z.number().min(1).max(50),
    work_time_start: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Giờ không hợp lệ'),
    work_time_end: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    auto_accept: z.boolean().optional(),
    notify_new_job: z.boolean().optional(),
    notify_chat: z.boolean().optional(),
    notify_system: z.boolean().optional(),
});

// ======================== CUSTOMER ========================
export const createJobSchema = z.object({
    job_type: z.enum(['boc_vac', 'don_dep', 'chuyen_nha', 'viec_vat']),
    worker_quantity: z.number().int().min(1).max(20),
    estimated_hours: z.number().min(0.5).max(24),

    booking_lat: z.number().min(-90).max(90),
    booking_long: z.number().min(-180).max(180),
    booking_address_text: z.string().min(10).max(255),

    description_text: z.string().max(255).optional(),
    description_voice_url: z.string().url().optional(),

    scheduled_start_time: z.string().datetime().optional().nullable(), // null = làm ngay
});

export const customerAddressSchema = z.object({
    label: z.string().max(50),
    lat: z.number().min(-90).max(90),
    long: z.number().min(-180).max(180),
    address_text: z.string().min(10).max(255),
});

// ======================== JOB ASSIGNMENT ========================
export const acceptJobSchema = z.object({
    job_id: z.number().int().positive(),
});

export const updateAssignmentStatusSchema = z.object({
    assignment_id: z.number().int().positive(),
    status: z.enum(['arrived', 'in_progress', 'done', 'cancelled']),
    // Tọa độ khi đến nơi (optional)
    arrived_lat: z.number().min(-90).max(90).optional(),
    arrived_long: z.number().min(-180).max(180).optional(),
});

// ======================== ADMIN ========================
export const adminVerifyWorkerSchema = z.object({
    worker_id: z.number().int().positive(),
    action: z.enum(['approved', 'rejected']),
    reason: z.string().max(500).optional(),
});

export const systemSettingsSchema = z.object({
    hourly_rate: z.number().positive(),
    min_hours: z.number().positive(),
    base_price: z.number().min(0).optional(),
    search_radius_km: z.number().min(1).max(100),
});

export const loginAdminSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
});

export const registerCustomerSchema = z.object({
    phone: z.string(),
})

export const verifyCustomerOtpSchema = z.object({
    phone: z.string(),
    otp: z.string().length(6, 'OTP phải 6 số'),
})
// ======================== REUSABLE MIDDLEWARE ========================
import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

export const validate = (schema: ZodSchema) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            await schema.parseAsync(req.body);
            next();
        } catch (error: any) {
            return res.status(400).json({
                success: false,
                message: 'Dữ liệu không hợp lệ',
                errors: error.errors?.map((e: any) => ({
                    field: e.path.join('.'),
                    message: e.message,
                })) || [],
            });
        }
    };
};