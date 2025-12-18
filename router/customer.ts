
import { Router } from "express";
import { loginAdminSchema, registerCustomerSchema, validate } from "../utils/validations";
import { requestLogger } from "../auth/middleware/requestLogger";
import { loginZalo, refreshZaloToken, UpdateCustomerProfile } from "../controller/customer";
import {extractTokenMiddleware} from "../auth/middleware/extractTokenMiddleware";
import {JobController} from "../controller/job";
import {AddressController} from "../controller/AddressController";

const routerCustomer = Router();
const controller = new AddressController();

/**
 * @swagger
 * tags:
 *   name: Customer
 *   description: API dành cho khách hàng (App)
 */

/**
 * @swagger
 * /customer/login-zalo:
 *   post:
 *     summary: Đăng nhập qua Zalo
 *     tags: [Customer]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               accessToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Đăng nhập thành công
 */
routerCustomer.post('/login-zalo', validate(registerCustomerSchema), requestLogger, loginZalo);

/**
 * @swagger
 * /customer/refresh-token:
 *   post:
 *     summary: Làm mới token
 *     tags: [Customer]
 *     responses:
 *       200:
 *         description: Token mới
 */
routerCustomer.post('/refresh-token', validate(registerCustomerSchema), requestLogger, refreshZaloToken);

/**
 * @swagger
 * /customer/update/{id}:
 *   patch:
 *     summary: Cập nhật thông tin khách hàng
 *     tags: [Customer]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
routerCustomer.patch('/update/:id', requestLogger, UpdateCustomerProfile);

/**
 * @swagger
 * /customer/addresses:
 *   post:
 *     summary: Tạo địa chỉ mới cho khách hàng
 *     tags: [Customer]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - label
 *               - addressText
 *               - lat
 *               - long
 *             properties:
 *               label:
 *                 type: string
 *                 description: 'Nhãn địa chỉ (ví dụ: "Nhà", "Công ty")'
 *               addressText:
 *                 type: string
 *                 description: 'Địa chỉ chi tiết'
 *               lat:
 *                 type: number
 *                 format: float
 *                 description: 'Vĩ độ'
 *               long:
 *                 type: number
 *                 format: float
 *                 description: 'Kinh độ'
 *               isDefault:
 *                 type: boolean
 *                 description: 'Đặt làm địa chỉ mặc định'
 *                 default: false
 *     responses:
 *       200:
 *         description: 'Tạo địa chỉ thành công'
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/CustomerAddress'
 *       401:
 *         description: 'Unauthorized - Thiếu thông tin xác thực'
 *       400:
 *         description: 'Bad Request - Dữ liệu không hợp lệ'
 */
routerCustomer.post('/addresses', requestLogger, extractTokenMiddleware, controller.create);

/**
 * @swagger
 * /customer/addresses:
 *   get:
 *     summary: Lấy danh sách địa chỉ của khách hàng
 *     tags: [Customer]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 'Danh sách địa chỉ'
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CustomerAddress'
 *       401:
 *         description: 'Unauthorized - Thiếu thông tin xác thực'
 */
routerCustomer.get('/addresses', requestLogger, extractTokenMiddleware, controller.list);

/**
 * @swagger
 * /customer/addresses/{id}:
 *   delete:
 *     summary: Xóa địa chỉ của khách hàng
 *     tags: [Customer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 'ID của địa chỉ cần xóa'
 *     responses:
 *       200:
 *         description: 'Xóa địa chỉ thành công'
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         description: 'Unauthorized - Thiếu thông tin xác thực'
 *       404:
 *         description: 'Địa chỉ không tồn tại hoặc không thuộc về khách hàng'
 */
routerCustomer.delete('/addresses/:id', requestLogger, extractTokenMiddleware, controller.delete);

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   schemas:
 *     CustomerAddress:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: 'ID của địa chỉ'
 *         customerId:
 *           type: integer
 *           description: 'ID của khách hàng'
 *         label:
 *           type: string
 *           description: 'Nhãn địa chỉ'
 *         addressText:
 *           type: string
 *           description: 'Địa chỉ chi tiết'
 *         lat:
 *           type: string
 *           description: 'Vĩ độ'
 *         long:
 *           type: string
 *           description: 'Kinh độ'
 *         isDefault:
 *           type: boolean
 *           description: 'Có phải địa chỉ mặc định không'
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

export default routerCustomer;
