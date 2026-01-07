import {Request, Response} from "express";
import axios from "axios";
import {generateJwtToken} from "../auth/Jwt";
import logger from "../utils/loogger";
import {findOrCreateZaloUser, getMyJobs} from "../services/worker";
import {uploadToCloudinary} from "../utils/cloudinary";
import db from "../db";
import {usersWorker} from "../db/schema";
import {RequestWithToken} from "../types/admin";
import {eq} from "drizzle-orm/sql/expressions/conditions";
import {GetWorkerJobsQuerySchema} from "../utils/validations";
import fs from "fs";
import path from "path";

export const loginZalo = async (req: Request, res: Response) => {
    try {

        const {access_token} = req.body;

        if (!access_token) {
            return res.status(400).json({message: 'Code is required'});
        }

        const zaloAppSecret = process.env.ZALO_APP_SECRET;
        const redirectUri = process.env.ZALO_REDIRECT_URI;


        const userInfoResponse = await axios.get('https://graph.zalo.me/v2.0/me', {
            headers: {
                access_token,
            }
        });


        const userInfo = userInfoResponse.data;


        const zaloUser = {
            zaloId: userInfo.id, fullName: userInfo.name,

        };


        const customer = await findOrCreateZaloUser(zaloUser);

        const customerPayload = {
            id: customer.id.toString()
        };


        const accessToken = generateJwtToken(customerPayload)

        res.status(200).json({message: 'Đăng Nhập Thành Công', accessToken, data: userInfo});

    } catch (error) {
        logger.error(`Error in worker login', ${error}`);
        res.status(500).json({message: 'Internal server error'});
    }

}

const deleteUploadedFiles = async (files: { [fieldname: string]: Express.Multer.File[] }) => {
    const fileArray = Object.values(files).flat();
    for (const file of fileArray) {
        try {
            if (file.path && fs.existsSync(file.path)) {
                await fs.promises.unlink(file.path);
            }
        } catch (err) {
            console.error(`Failed to delete file ${file.path}:`, err);
        }
    }
};

export const registerWorker = async (req: RequestWithToken, res: Response) => {
    // Ép kiểu req.files để TS hiểu
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;

    try {
        // 1. Lấy ID từ Token (Middleware verifyToken phải gán req.adminId hoặc req.user.id)
        // Lưu ý: req.adminId của bạn đang dùng cho worker, hãy đảm bảo logic này đúng với luồng auth
        const workerId = req.adminId || 1;

        if (!workerId) {
            if (files) await deleteUploadedFiles(files); // Xóa file rác
            return res.status(401).json({
                success: false,
                message: 'Unauthorized: Missing worker ID'
            });
        }

        // 2. Validation input
        const { fullName, phoneNumber, cccdNumber, gender, yob } = req.body;
        const requiredFields = ['fullName', 'phoneNumber', 'cccdNumber', 'gender', 'yob'];
        const missingFields = requiredFields.filter(field => !req.body[field]);

        if (missingFields.length > 0) {
            if (files) await deleteUploadedFiles(files); // Xóa file rác
            return res.status(400).json({
                success: false,
                message: `Missing required fields: ${missingFields.join(', ')}`
            });
        }

        // 3. Validate files
        if (!files || !files.cccdFront || !files.cccdBack || !files.avatarFace) {
            if (files) await deleteUploadedFiles(files); // Xóa file rác (nếu upload thiếu)
            return res.status(400).json({
                success: false,
                message: 'Missing required files (cccdFront, cccdBack, avatarFace)'
            });
        }

        // 4. Kiểm tra worker trong DB
        const existingWorker = await db.select().from(usersWorker).where(eq(usersWorker.id, workerId)).limit(1);

        if (existingWorker.length === 0) {
            if (files) await deleteUploadedFiles(files);
            return res.status(404).json({ success: false, message: 'Worker not found' });
        }

        if (existingWorker[0].verifyStatus === 'approved') {
            if (files) await deleteUploadedFiles(files);
            return res.status(400).json({ success: false, message: 'Worker already registered and verified' });
        }

        // 5. Xử lý đường dẫn file (Path Processing)
        // Multer đã lưu file rồi, ta chỉ cần lấy path và convert sang URL public
        const getPublicUrl = (file: Express.Multer.File) => {
            // file.path ví dụ: /var/www/project/public/uploads/2024/01/07/filename.jpg
            // Cần cắt bỏ phần root để lấy: /uploads/2024/01/07/filename.jpg

            // Cách an toàn: Tìm từ khóa 'public' hoặc 'uploads' trong path
            const relativePath = file.path.split('public')[1];
            // Đảm bảo dấu gạch chéo đúng chuẩn URL (đổi \ thành / trên Windows)
            return relativePath ? relativePath.replace(/\\/g, '/') : `/uploads/${path.basename(file.path)}`;
        };

        const cccdFrontUrl = getPublicUrl(files.cccdFront[0]);
        const cccdBackUrl = getPublicUrl(files.cccdBack[0]);
        const avatarFaceUrl = getPublicUrl(files.avatarFace[0]);

        // 6. Update Database
        try {
            await db.update(usersWorker).set({
                fullName: fullName.trim(),
                phoneNumber: phoneNumber.trim(),
                cccdNumber: cccdNumber.trim(),
                gender: gender,
                yob: parseInt(yob),
                cccdFrontUrl: cccdFrontUrl,
                cccdBackUrl: cccdBackUrl,
                avatarFaceUrl: avatarFaceUrl,
                status: 'active',
                verifyStatus: 'pending',
                updatedAt: new Date(),
            })
                .where(eq(usersWorker.id, workerId));

            res.status(200).json({
                success: true,
                message: 'Registration submitted successfully.',
            });

        } catch (dbError: any) {
            console.error('Database error:', dbError);
            // Quan trọng: DB lỗi thì phải xóa file đã upload để tránh rác ổ cứng
            await deleteUploadedFiles(files);

            // Check lỗi unique constraint
            if (dbError.message?.includes('unique constraint') || dbError.code === '23505') {
                return res.status(400).json({
                    success: false,
                    message: 'Phone number or CCCD number already exists'
                });
            }
            throw dbError;
        }

    } catch (error: any) {
        console.error('Register Worker Error:', error);
        // Fallback xóa file nếu lỗi ở catch ngoài cùng (dù ít khi xảy ra nếu đã handle ở trên)
        if (files) await deleteUploadedFiles(files);

        res.status(500).json({
            success: false,
            message: 'System error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// export const registerWorker = async (req: RequestWithToken, res: Response) => {
//     try {
//
//         const workerId = req.adminId;
//
//         if (!workerId) {
//             return res.status(401).json({success: false, message: 'Unauthorized: Missing worker ID'});
//         }
//
//         const {fullName, phoneNumber, cccdNumber, gender, yob} = req.body;
//
//         // Lấy file từ Multer
//         // req.files trả về object dictionary vì dùng upload.fields
//         const files = req.files as { [fieldname: string]: Express.Multer.File[] };
//
//         // Helper upload
//         const uploadFile = async (field: string) => {
//             if (files[field] && files[field][0]) {
//                 return await uploadToCloudinary(files[field][0].buffer, 'miniapp/workers/cccd');
//             }
//             return null;
//         };
//
//         // Upload song song cho nhanh
//         const [cccdFrontUrl, cccdBackUrl, avatarFaceUrl] = await Promise.all([uploadFile('cccdFront'), uploadFile('cccdBack'), uploadFile('avatarFace')]);
//
//
//         // Insert vào DB
//
//         const updateWorker = await db.update(usersWorker).set({
//             fullName: fullName,
//             phoneNumber: phoneNumber,
//
//             // Thông tin CCCD
//             cccdNumber: cccdNumber,
//             cccdFrontUrl: cccdFrontUrl || '',
//             cccdBackUrl: cccdBackUrl || '',
//             avatarFaceUrl: avatarFaceUrl || '',
//
//             status: 'active',
//             verifyStatus: 'approved'
//         }).where(eq(usersWorker.id, workerId)).returning();
//
//
//         res.status(201).json({
//             success: true, message: 'Update Success.', data: updateWorker
//         });
//
//     } catch (error: any) {
//         console.error('Register Worker Error:', error);
//         res.status(500).json({success: false, message: 'Lỗi hệ thống', error: error.message});
//     }
// };


export const getWorkerProfile = async (req: RequestWithToken, res: Response) => {
    try {
        const workerId = req.adminId;

        if (!workerId) {
            return res.status(401).json({success: false, message: 'Unauthorized: Missing worker ID'});
        }

        const worker = await db.select().from(usersWorker).where(eq(usersWorker.id, workerId)).then(result => result[0]);

        if (!worker) return res.status(404).json({message: 'Worker not found'});

        res.json({success: true, data: worker});
    } catch (error) {
        res.status(500).json({message: 'Internal Error'});
    }
}
    export const getJobs = async (req: RequestWithToken, res: Response) => {
        try {
            // TODO: Lấy ID từ Token (req.user.id)
            const workerId = req.adminId;
            if (!workerId) {
                return res.status(401).json({success: false, message: 'Unauthorized: Missing worker ID'});
            }

            // Validate Query
            const validation = GetWorkerJobsQuerySchema.safeParse(req.query);
            if (!validation.success) {
                return res.status(400).json({success: false, errors: validation.error.format()});
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
            res.status(500).json({success: false, message: 'Lỗi hệ thống'});
        }
    }




