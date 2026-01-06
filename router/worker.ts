import { Router } from 'express';
import {getJobs, getWorkerProfile, registerWorker} from "../controller/worker";
import {upload} from "../auth/middleware/upload";
import {} from "../controller/worker";
import {extractTokenMiddleware} from "../auth/middleware/extractTokenMiddleware";
import {requestLogger} from "../auth/middleware/requestLogger";
import {registerCustomerSchema, validate} from "../utils/validations";
import {loginZalo} from "../controller/customer";
import routerCustomer from "./customer";
import {WorkerActionController} from "../controller/worker-actions";


const router = Router();
const actionController = new WorkerActionController();

// Config upload 1 ảnh
const uploadPhoto = upload.fields([{ name: 'photo', maxCount: 1 }]);
// Định nghĩa các field file được phép upload
const workerUploadFields = upload.fields([
    { name: 'cccdFront', maxCount: 1 },  // Ảnh mặt trước
    { name: 'cccdBack', maxCount: 1 },   // Ảnh mặt sau
    { name: 'avatarFace', maxCount: 1 }  // Ảnh chân dung
]);

/**
 * @swagger
 * tags:
 *   name: Worker
 *   description: Worker management endpoints
 */

/**
 * @swagger
 * /worker/login-zalo:
 *   post:
 *     summary: Worker login with Zalo
 *     tags: [Worker]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - access_token
 *             properties:
 *               access_token:
 *                 type: string
 *                 description: Zalo OAuth access token
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 accessToken:
 *                   type: string
 *                 data:
 *                   type: object
 *       400:
 *         description: Access token is required
 *       500:
 *         description: Internal server error
 */
routerCustomer.post('/login-zalo', requestLogger,validate(registerCustomerSchema), requestLogger, loginZalo);

// Route Đăng ký (Có upload ảnh)
/**
 * @swagger
 * /worker/register:
 *   patch:
 *     summary: Register worker profile with documents
 *     tags: [Worker]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - fullName
 *               - phoneNumber
 *               - cccdNumber
 *               - gender
 *               - yob
 *             properties:
 *               fullName:
 *                 type: string
 *                 description: Full name of worker
 *               phoneNumber:
 *                 type: string
 *                 description: Phone number
 *               cccdNumber:
 *                 type: string
 *                 description: CCCD/ID card number
 *               gender:
 *                 type: string
 *                 enum: [male, female, other]
 *                 description: Gender
 *               yob:
 *                 type: integer
 *                 description: Year of birth
 *               cccdFront:
 *                 type: string
 *                 format: binary
 *                 description: Front side of CCCD image
 *               cccdBack:
 *                 type: string
 *                 format: binary
 *                 description: Back side of CCCD image
 *               avatarFace:
 *                 type: string
 *                 format: binary
 *                 description: Portrait photo
 *     responses:
 *       201:
 *         description: Worker registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *       401:
 *         description: Unauthorized - Missing worker ID
 *       500:
 *         description: Internal server error
 */
router.patch('/register', requestLogger,extractTokenMiddleware,workerUploadFields, registerWorker);

/**
 * @swagger
 * /worker/profile:
 *   get:
 *     summary: Get worker profile
 *     tags: [Worker]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Worker profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       401:
 *         description: Unauthorized - Missing worker ID
 *       404:
 *         description: Worker not found
 *       500:
 *         description: Internal server error
 */
router.get('/profile',requestLogger,extractTokenMiddleware, getWorkerProfile);

/**
 * @swagger
 * /worker/my-jobs:
 *   get:
 *     summary: Get worker's jobs with pagination and filtering
 *     tags: [Worker]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, active, completed, cancelled]
 *         description: Filter by job status
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, updatedAt, startDate]
 *           default: createdAt
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Jobs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       400:
 *         description: Invalid query parameters
 *       401:
 *         description: Unauthorized - Missing worker ID
 *       500:
 *         description: Internal server error
 */
router.get('/my-jobs',requestLogger,extractTokenMiddleware, getJobs);



/**
 * @swagger
 * /api/worker/jobs/{id}/arrive:
 *   post:
 *     summary: Thợ báo đã đến nơi (Check-in GPS & Ảnh)
 *     tags: [Worker Actions]
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - lat
 *               - long
 *             properties:
 *               lat:
 *                 type: number
 *                 example: 10.7769
 *               long:
 *                 type: number
 *                 example: 106.7009
 *               photo:
 *                 type: string
 *                 format: binary
 *                 description: Ảnh check-in tại địa điểm
 *     responses:
 *       200:
 *         description: Check-in thành công
 *       400:
 *         description: Sai vị trí quá 150m hoặc lỗi khác
 */
router.post('/jobs/:id/arrive', uploadPhoto, actionController.arrive);

/**
 * @swagger
 * /api/worker/jobs/{id}/start:
 *   post:
 *     summary: Thợ bấm bắt đầu làm việc
 *     tags: [Worker Actions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Trạng thái chuyển sang In Progress
 */
router.post('/jobs/:id/start', actionController.start);

/**
 * @swagger
 * /api/worker/jobs/{id}/complete:
 *   post:
 *     summary: Thợ báo hoàn thành (Check-out & Ảnh)
 *     tags: [Worker Actions]
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               photo:
 *                 type: string
 *                 format: binary
 *                 description: Ảnh kết quả công việc
 *     responses:
 *       200:
 *         description: Hoàn thành. Nếu tất cả thợ xong, Job sẽ Completed.
 */
router.post('/jobs/:id/complete', uploadPhoto, actionController.complete);

export default router;