import { Router } from "express";
import { getCustomers, getCustomerById, getProfile, bannerCustomer, login } from "../controller/admin";
import { loginAdminSchema, validate } from "../utils/validations";
import { requestLogger } from "../auth/middleware/requestLogger";
import { extractTokenMiddleware } from "../auth/middleware/extractTokenMiddleware";

const routerAdmin = Router();

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Quản lý Admin và Users
 */

/**
 * @swagger
 * /admin/login:
 *   post:
 *     summary: Đăng nhập Admin
 *     tags: [Admin]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Đăng nhập thành công
 */
routerAdmin.post('/login', validate(loginAdminSchema), requestLogger, login);

/**
 * @swagger
 * /admin/profile:
 *   get:
 *     summary: Lấy thông tin Admin hiện tại
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thông tin admin
 */
routerAdmin.get('/profile', requestLogger, extractTokenMiddleware, getProfile);

/**
 * @swagger
 * /admin/customers:
 *   get:
 *     summary: Lấy danh sách khách hàng
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách customers
 */
routerAdmin.get('/customers', requestLogger, extractTokenMiddleware, getCustomers);

/**
 * @swagger
 * /admin/customers/{id}:
 *   get:
 *     summary: Chi tiết khách hàng
 *     tags: [Admin]
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
 *         description: Chi tiết customer
 */
routerAdmin.get('/customers/:id', requestLogger, extractTokenMiddleware, getCustomerById);

/**
 * @swagger
 * /admin/customers/banned/{id}:
 *   patch:
 *     summary: Ban/Unban khách hàng
 *     tags: [Admin]
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
 *         description: Cập nhật trạng thái thành công
 */
routerAdmin.patch('/customers/banned/:id', requestLogger, extractTokenMiddleware, bannerCustomer);

export default routerAdmin;