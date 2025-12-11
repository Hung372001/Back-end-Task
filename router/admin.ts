import {Router} from "express";
import {getCustomers, getCustomerById,getProfile, bannerCustomer,login} from "../controller/admin";
import {loginAdminSchema, validate} from "../utils/validations";
import {requestLogger} from "../auth/middleware/requestLogger";
import {extractTokenMiddleware} from "../auth/middleware/extractTokenMiddleware";

const router =  Router();

router.post('/login',validate(loginAdminSchema), requestLogger,login);
router.get('/profile', requestLogger,extractTokenMiddleware,getProfile);

router.get('/customers',requestLogger,extractTokenMiddleware, getCustomers);
router.get('/customers/:id',requestLogger,extractTokenMiddleware, getCustomerById);
router.patch('/customers/banned/:id',requestLogger,extractTokenMiddleware, bannerCustomer);
export default router;

