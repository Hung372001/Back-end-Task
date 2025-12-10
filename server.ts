import dotenv from 'dotenv';
import app from "./app";
import fs from "fs";
import path from "path";
import * as https from "node:https";

dotenv.config()
const sslOptions = {
    key: fs.readFileSync(path.join(__dirname, 'server.key')),
    cert: fs.readFileSync(path.join(__dirname, 'server.cert'))
};
const httpsServer = https.createServer(sslOptions, app);
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});