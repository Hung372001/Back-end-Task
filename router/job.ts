import { Router } from "express";
import { requestLogger } from "../auth/middleware/requestLogger";
import { extractTokenMiddleware } from "../auth/middleware/extractTokenMiddleware";
import { JobController } from "../controller/job";

const router = Router();
const controller = new JobController();

/**
 * @swagger
 * tags:
 *   name: Jobs
 *   description: Quản lý công việc
 */

/**
 * @swagger
 * /jobs:
 *   post:
 *     summary: Tạo công việc mới
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Tạo thành công
 */
router.post('/', requestLogger, extractTokenMiddleware, controller.create); // Removed duplicate requestLogger

/**
 * @swagger
 * /jobs:
 *   get:
 *     summary: Lấy danh sách công việc
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách jobs
 */
router.get('/', requestLogger, extractTokenMiddleware, controller.findAll); // Removed duplicate requestLogger

/**
 * @swagger
 * /jobs/{id}:
 *   get:
 *     summary: Chi tiết công việc
 *     tags: [Jobs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Chi tiết job
 */
router.get('/:id', requestLogger, extractTokenMiddleware, controller.findById); // Removed duplicate requestLogger

export default router;