import {Router} from "express";
import {loginAdminSchema, registerCustomerSchema, validate} from "../utils/validations";
import {requestLogger} from "../auth/middleware/requestLogger";
import {login} from "../services/admin";
import {sendOtp, verifyOtp} from "../services/customer";


const router =  Router();

router.post('/send-otp',validate(registerCustomerSchema), requestLogger,sendOtp);
router.post('/verify-otp',validate(registerCustomerSchema), requestLogger,verifyOtp);

export default router;