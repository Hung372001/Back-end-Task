import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import fs from 'fs';

// Tạo thư mục logs nếu chưa có
const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

// Helper an toàn 100% (không còn TS2769 nữa) - Lưu ý: Hàm này chưa được sử dụng trong printf
const safeObjectKeys = (obj: unknown): string[] => {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return [];
    return Object.keys(obj);
};

// Custom format đẹp + metadata đầy đủ
const customFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    winston.format.errors({ stack: true }),
    // Vẫn giữ metadata để lấy tất cả các trường không phải mặc định
    winston.format.metadata({
        fillExcept: ['timestamp', 'level', 'message', 'label'],
    }),
    winston.format.printf(({ timestamp, level, message, label, metadata }) => {
        const labelStr = label ? `[${label}] ` : '';

        // FIX: Sử dụng Type Assertion
        const metaObj = metadata as Record<string, unknown>;

        // *** ĐIỀU CHỈNH CHÍNH Ở ĐÂY ***
        // 1. Loại bỏ '\n'
        // 2. Sử dụng JSON.stringify(metaObj) không có tham số (null, 2) để thu gọn
        const metaStr = Object.keys(metaObj).length > 0
            // Thêm khoảng trắng ' ' để phân tách metadata với message chính
            ? ' | ' + JSON.stringify(metaObj)
            : '';

        // Định dạng output cuối cùng trên một dòng
        // Ký tự phân cách: Dùng ' | ' hoặc bất kỳ ký tự nào bạn muốn
        return `${timestamp} | ${level.toUpperCase().padEnd(7)} | ${labelStr}${message}${metaStr}`;
    })
);
// Tạo logger
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: customFormat,
    defaultMeta: { service: 'grab-tho-api', env: process.env.NODE_ENV || 'development' },
    transports: [
        // All logs
        new DailyRotateFile({
            dirname: logDir,
            filename: 'app-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '30d',
        }),
        // Error riêng
        new DailyRotateFile({
            dirname: logDir,
            filename: 'error-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '60d',
            level: 'error',
        }),
        // Console (dev)
        new winston.transports.Console({
            // Kết hợp colorize VÀ customFormat để log ra console có màu sắc
            format: winston.format.combine(
                winston.format.colorize(),
                customFormat
            ),
        }),
    ],
    exceptionHandlers: [
        new DailyRotateFile({
            dirname: logDir,
            filename: 'exceptions-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
        }),
    ],
    rejectionHandlers: [
        new DailyRotateFile({
            dirname: logDir,
            filename: 'rejections-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
        }),
    ],
});

// Export siêu tiện
export const Logger = {
    // Log info chung
    info: (msg: string, meta?: Record<string, unknown>) =>
        logger.info(msg, { ...meta }),

    // Log error, tự động thêm stack trace nếu chưa có
    error: (msg: string, meta?: Record<string, unknown>) =>
        logger.error(msg, { ...meta, stack: meta?.stack ?? new Error().stack }),

    warn: (msg: string, meta?: Record<string, unknown>) =>
        logger.warn(msg, { ...meta }),

    debug: (msg: string, meta?: Record<string, unknown>) =>
        logger.debug(msg, { ...meta }),

    // Dành cho module cụ thể – metadata tự động có label (nhãn module)
    child: (label: string) => ({
        info: (msg: string, meta?: Record<string, unknown>) =>
            logger.info(msg, { label, ...meta }),

        error: (msg: string, meta?: Record<string, unknown>) =>
            logger.error(msg, { label, ...meta, stack: new Error().stack }),

        warn: (msg: string, meta?: Record<string, unknown>) =>
            logger.warn(msg, { label, ...meta }),

        debug: (msg: string, meta?: Record<string, unknown>) =>
            logger.debug(msg, { label, ...meta }),
    }),
};

export default logger;