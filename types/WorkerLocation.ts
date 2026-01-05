// Interface cho dữ liệu vị trí
export interface WorkerLocation {
    jobId: number;
    workerId: number;
    lat: number;
    long: number;
    heading: number; // Hướng di chuyển (0-360 độ) để xoay icon xe máy trên bản đồ
    speed?: number;  // Tốc độ (km/h)
    timestamp: number;
}