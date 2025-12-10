import {Router} from "express";
import {loginAdminSchema, registerCustomerSchema, validate} from "../utils/validations";
import {requestLogger} from "../auth/middleware/requestLogger";
import {login} from "../controller/admin";
import {loginZalo, refreshZaloToken, UpdateCustomerProfile} from "../controller/customer";


const router =  Router();

router.post('/login-zalo',validate(registerCustomerSchema), requestLogger,loginZalo);
router.post('/refresh-token',validate(registerCustomerSchema), requestLogger,refreshZaloToken);
router.patch('update/:id', requestLogger,UpdateCustomerProfile);

export default router;