import { Router } from 'express';
import {SystemSettingsController} from "../controller/settings";
import {requestLogger} from "../auth/middleware/requestLogger";
import {extractTokenMiddleware} from "../auth/middleware/extractTokenMiddleware";
// import { authMiddleware, adminRoleMiddleware } from ...

const router = Router();
const controller = new SystemSettingsController();

// Nhóm API Settings
router.get('/settings',requestLogger,extractTokenMiddleware, controller.getAll);
router.get('/settings/group/:group',requestLogger,extractTokenMiddleware, controller.getByGroup);
router.put('/settings',requestLogger,extractTokenMiddleware, controller.update);
router.post('/settings/seed', controller.seed); // Chỉ chạy khi init project

export default router;