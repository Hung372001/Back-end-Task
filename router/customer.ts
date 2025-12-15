import { Router } from "express";
import { loginAdminSchema, registerCustomerSchema, validate } from "../utils/validations";
import { requestLogger } from "../auth/middleware/requestLogger";
import { loginZalo, refreshZaloToken, UpdateCustomerProfile } from "../controller/customer";

const routerCustomer = Router();

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

export default routerCustomer;