import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import Redis from 'ioredis';
import { verifyJwtToken } from '../auth/Jwt'; // Hàm verify token hiện có của bạn
import logger from '../utils/loogger';
import {WorkerLocation} from "../types/WorkerLocation";

// Khởi tạo Redis client riêng cho Socket (để pub/sub hoặc lưu cache vị trí)
const redisCache = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

export const initSocket = (httpServer: HttpServer) => {
    const io = new Server(httpServer, {
        cors: {
            origin: "*", // Cấu hình lại domain production sau này
            methods: ["GET", "POST"]
        },
        pingTimeout: 60000, // 60s không thấy ping thì disconnect
    });

    // --- MIDDLEWARE: Xác thực JWT ---
    io.use((socket, next) => {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization;

        if (!token) {
            return next(new Error('Authentication error: Token missing'));
        }

        try {
            // Loại bỏ 'Bearer ' nếu có
            const cleanToken = token.replace('Bearer ', '');
            const user = verifyJwtToken(cleanToken);

            // Lưu thông tin user vào session của socket để dùng sau
            socket.data.user = user;
            next();
        } catch (err) {
            logger.error(`Socket Auth Failed: ${err}`);
            next(new Error('Authentication error: Invalid Token'));
        }
    });

    io.on('connection', (socket: Socket) => {
        const userId = socket.data.user.id;
        logger.info(`User connected: ${userId} (Socket ID: ${socket.id})`);

        /**
         * SỰ KIỆN 1: Tham gia vào phòng của Job (Join Room)
         * Dùng cho cả Khách (để xem) và Thợ (để phát)
         */
        socket.on('join_job_room', async (jobId: string) => {
            const roomName = `job_${jobId}`;
            await socket.join(roomName);

            // Gửi ngay vị trí cuối cùng được lưu trong Redis (nếu có)
            // Giúp khách vừa vào app là thấy thợ đang ở đâu luôn, không cần chờ thợ di chuyển tiếp
            const lastLocation = await redisCache.get(`loc:job:${jobId}`);
            if (lastLocation) {
                socket.emit('worker_location_update', JSON.parse(lastLocation));
            }

            logger.info(`User ${userId} joined room ${roomName}`);
        });

        /**
         * SỰ KIỆN 2: Rời phòng (Leave Room)
         * Khi khách thoát màn hình theo dõi hoặc job hoàn thành
         */
        socket.on('leave_job_room', (jobId: string) => {
            const roomName = `job_${jobId}`;
            socket.leave(roomName);
        });

        /**
         * SỰ KIỆN 3: Thợ gửi vị trí (Send Location)
         * Thợ gửi tọa độ liên tục (ví dụ 5s/lần)
         */
        socket.on('send_location', async (payload: WorkerLocation) => {
            const roomName = `job_${payload.jobId}`;

            // 1. Lưu vị trí mới nhất vào Redis (Tự hết hạn sau 5 phút để dọn rác)
            // Key: loc:job:{jobId}
            await redisCache.set(
                `loc:job:${payload.jobId}`,
                JSON.stringify(payload),
                'EX',
                300 // 5 phút expire
            );

            // 2. Phát lại (Broadcast) cho tất cả người trong phòng (trừ người gửi)
            socket.to(roomName).emit('worker_location_update', payload);

            // Lưu ý: KHÔNG insert vào Database SQL ở đây để tránh quá tải.
        });

        socket.on('disconnect', () => {
            logger.info(`User disconnected: ${userId}`);
        });
    });

    return io;
};