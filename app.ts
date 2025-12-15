import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import routerAdmin from "./router/admin";
import customer from "./router/customer";
import routerSetting from "./router/setting";
import routerJob from "./router/job";

const  app = express();
app.use(cors())
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/auth', routerAdmin);
app.use('/api/customer', customer);
app.use('/api/admin', routerSetting);
app.use('/api/jobs', routerJob);

export default app;