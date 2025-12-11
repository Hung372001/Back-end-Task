import {Router} from "express";
import {loginAdminSchema, registerCustomerSchema, validate} from "../utils/validations";
import {requestLogger} from "../auth/middleware/requestLogger";
import {login} from "../controller/admin";
import {loginZalo, refreshZaloToken, UpdateCustomerProfile} from "../controller/customer";


const routerCustomer =  Router();

routerCustomer.post('/login-zalo',validate(registerCustomerSchema), requestLogger,loginZalo);
routerCustomer.post('/refresh-token',validate(registerCustomerSchema), requestLogger,refreshZaloToken);
routerCustomer.patch('update/:id', requestLogger,UpdateCustomerProfile);

export default routerCustomer;