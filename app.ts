import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import routerAdmin from "./router/admin";
import customer from "./router/customer";
import routerSetting from "./router/setting";
import routerJob from "./router/job";
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import {swaggerSpec} from "./utils/swagger";

const  app = express();
app.use(cors())
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/auth', routerAdmin);
app.use('/api/customer', customer);
app.use('/api/admin', routerSetting);
app.use('/api/jobs', routerJob);


app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));


export default app;