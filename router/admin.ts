import {Router} from "express";
import {login} from "../services/admin";
import {loginAdminSchema, validate} from "../utils/validations";
import {requestLogger} from "../auth/middleware/requestLogger";

const router =  Router();

router.post('/login',validate(loginAdminSchema), requestLogger,login);

export default router;

