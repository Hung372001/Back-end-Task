import {Router} from "express";
import {getCustomers, getCustomerById,getProfile, bannerCustomer,login} from "../controller/admin";
import {loginAdminSchema, validate} from "../utils/validations";
import {requestLogger} from "../auth/middleware/requestLogger";
import {extractTokenMiddleware} from "../auth/middleware/extractTokenMiddleware";

const routerAdmin =  Router();

routerAdmin.post('/login',validate(loginAdminSchema), requestLogger,login);
routerAdmin.get('/profile', requestLogger,extractTokenMiddleware,getProfile);

routerAdmin.get('/customers',requestLogger,extractTokenMiddleware, getCustomers);
routerAdmin.get('/customers/:id',requestLogger,extractTokenMiddleware, getCustomerById);
routerAdmin.patch('/customers/banned/:id',requestLogger,extractTokenMiddleware, bannerCustomer);

export default routerAdmin;