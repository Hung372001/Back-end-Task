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

/**
 * @swagger
 * /:id/rate:
 *   post:
 *     summary: Đánh giá công việc
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
 *               rating:
 *                 type: string
 *               comment:
 *                 type: string
 *     responses:
 *       200:
 *         description: Tạo thành công
 */
router.post('/:id/rate', extractTokenMiddleware, controller.rate);



/**
 * @swagger
 * /jobs/{id}/cancel:
 *   post:
 *     summary: Customer hủy công việc
 *     tags: [Jobs]
 *     description: |
 *       API cho phép customer hủy công việc đã tạo.
 *       **Lưu ý:** Chỉ customer tạo job mới được hủy, và job phải ở trạng thái cho phép hủy.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID của job cần hủy
 *         schema:
 *           type: integer
 *           example: 123
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Lý do hủy việc
 *                 example: "Thay đổi kế hoạch"
 *                 minLength: 1
 *                 maxLength: 500
 *     responses:
 *       200:
 *         description: Hủy thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Đã hủy đơn việc thành công"
 *       400:
 *         description: |
 *           - ID Job không hợp lệ
 *           - Validate body thất bại
 *           - Không thể hủy (logic nghiệp vụ)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Không thể hủy đơn việc đang thực hiện"
 *       401:
 *         description: Không có quyền (thiếu customer ID hoặc token không hợp lệ)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Unauthorized: Missing customer ID"
 *       404:
 *         description: Không tìm thấy job
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Không tìm thấy job"
 *       500:
 *         description: Lỗi server
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Lỗi hệ thống khi hủy job"
 */



/**
 * @swagger
 * /jobs/{id}/rate:
 *   post:
 *     summary: Customer đánh giá công việc đã hoàn thành
 *     tags: [Jobs]
 *     description: |
 *       API cho phép customer đánh giá worker sau khi công việc hoàn thành.
 *       **Lưu ý:** Chỉ customer tạo job mới được đánh giá, và job phải ở trạng thái đã hoàn thành.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID của job cần đánh giá
 *         schema:
 *           type: integer
 *           example: 123
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rating
 *             properties:
 *               rating:
 *                 type: number
 *                 description: Điểm đánh giá từ 1-5
 *                 example: 5
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *                 description: Bình luận đánh giá (tùy chọn)
 *                 example: "Rất hài lòng với chất lượng công việc"
 *                 maxLength: 1000
 *     responses:
 *       200:
 *         description: Đánh giá thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Cảm ơn bạn đã đánh giá công việc!"
 *       400:
 *         description: |
 *           - ID Job không hợp lệ
 *           - Validate body thất bại
 *           - Không thể đánh giá (chưa hoàn thành, v.v.)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Không thể đánh giá công việc chưa hoàn thành"
 *       401:
 *         description: Không có quyền (thiếu customer ID hoặc token không hợp lệ)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Unauthorized: Missing customer ID"
 *       404:
 *         description: Không tìm thấy job
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Không tìm thấy job"
 *       500:
 *         description: Lỗi server
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Lỗi hệ thống khi đánh giá job"
 */
router.post('/:id/cancel',extractTokenMiddleware ,controller.cancel);


/**
 * @swagger
 * /jobs/{id}/accept:
 *   post:
 *     summary: Worker nhận một công việc
 *     tags: [Jobs]
 *     description: |
 *       API cho phép worker nhận một công việc đang chờ.
 *       **Lưu ý:** Worker chỉ có thể nhận việc khi còn slot và chưa nhận việc này trước đó.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID của job cần nhận
 *         schema:
 *           type: integer
 *           example: 123
 *     responses:
 *       200:
 *         description: Nhận việc thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Đã nhận việc thành công"
 *       400:
 *         description: |
 *           - ID Job không hợp lệ
 *           - Thiếu worker ID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "ID Job không hợp lệ"
 *       401:
 *         description: Không có quyền truy cập (thiếu/không hợp lệ token)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Unauthorized: Missing worker ID"
 *       409:
 *         description: Xung đột nghiệp vụ (đã nhận, đã đủ người, v.v.)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Công việc đã đủ người nhận"
 *       500:
 *         description: Lỗi server
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Lỗi hệ thống khi nhận việc"
 */
router.post('/:id/accept', extractTokenMiddleware,controller.accept);

export default router;