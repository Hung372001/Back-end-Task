import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import admin from "./router/admin";

const  app = express();
app.use(cors())
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/auth', admin);
export default app;