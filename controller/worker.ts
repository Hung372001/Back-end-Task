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
export const registerWorker = async (req: RequestWithToken, res: Response) => {
    try {
        const workerId = 1;

        if (!workerId) {
            return res.status(401).json({success: false, message: 'Unauthorized: Missing worker ID'});
        }

        const {fullName, phoneNumber, cccdNumber, gender, yob} = req.body;

        // Lấy file từ Multer
        const files = req.files as { [fieldname: string]: Express.Multer.File[] };

        // Helper upload file lên máy chủ
        const uploadFileLocal = async (field: string): Promise<string | null> => {
            if (!files[field] || !files[field][0]) {
                return null;
            }

            const file = files[field][0];

            // Tạo tên file duy nhất
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const extension = path.extname(file.originalname);
            const filename = `${field}-${uniqueSuffix}${extension}`;

            // Tạo đường dẫn thư mục (theo ngày tháng)
            const date = new Date();
            const year = date.getFullYear();
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const day = date.getDate().toString().padStart(2, '0');
            const uploadDir = path.join(__dirname, '../../public/uploads/workers/cccd', year.toString(), month, day);

            // Đảm bảo thư mục tồn tại
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            // Đường dẫn đầy đủ của file
            const filePath = path.join(uploadDir, filename);

            // Ghi file
            fs.writeFileSync(filePath, file.buffer);

            // Trả về đường dẫn tương đối để lưu vào DB
            return `/uploads/workers/cccd/${year}/${month}/${day}/${filename}`;
        };

        // Upload song song
        const [cccdFrontUrl, cccdBackUrl, avatarFaceUrl] = await Promise.all([
            uploadFileLocal('cccdFront'),
            uploadFileLocal('cccdBack'),
            uploadFileLocal('avatarFace')
        ]);

        // Insert vào DB
        const updateWorker = await db.update(usersWorker).set({
            fullName: fullName,
            phoneNumber: phoneNumber,

            // Thông tin CCCD
            cccdNumber: cccdNumber,
            cccdFrontUrl: cccdFrontUrl || '',
            cccdBackUrl: cccdBackUrl || '',
            avatarFaceUrl: avatarFaceUrl || '',

            status: 'active',
            verifyStatus: 'approved'
        }).where(eq(usersWorker.id, workerId)).returning();

        res.status(201).json({
            success: true,
            message: 'Update Success.',
            data: updateWorker
        });

    } catch (error: any) {
        console.error('Register Worker Error:', error);

        // Xử lý lỗi file system
        if (error.code === 'ENOENT' || error.code === 'EACCES') {
            return res.status(500).json({
                success: false,
                message: 'Lỗi hệ thống lưu trữ file',
                error: error.message
            });
        }

        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống',
            error: error.message
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




