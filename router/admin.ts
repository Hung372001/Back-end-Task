import {Router} from "express";
import {getProfile, login} from "../services/admin";
import {loginAdminSchema, validate} from "../utils/validations";
import {requestLogger} from "../auth/middleware/requestLogger";
import {extractTokenMiddleware} from "../auth/middleware/extractTokenMiddleware";

const router =  Router();

router.post('/login',validate(loginAdminSchema), requestLogger,login);
router.get('/profile',validate(loginAdminSchema), requestLogger,extractTokenMiddleware,getProfile);

export default router;

