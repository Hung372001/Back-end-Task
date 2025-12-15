import {Router} from "express";
import {SystemSettingsController} from "../controller/settings";
import {requestLogger} from "../auth/middleware/requestLogger";
import {extractTokenMiddleware} from "../auth/middleware/extractTokenMiddleware";
import {JobController} from "../controller/job";

const router = Router();
const controller = new JobController();

// Nhóm API Settings
router.post('/',requestLogger,extractTokenMiddleware,requestLogger, controller.create);
router.get('/',requestLogger,extractTokenMiddleware,requestLogger, controller.findAll);
router.get('/:id',requestLogger,extractTokenMiddleware,requestLogger, controller.findById);
export default router;