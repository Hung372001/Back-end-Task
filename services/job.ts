import { Request, Response } from 'express';
import db from "../db";
import {customerAddresses} from "../db/schema";
import {and, eq} from "drizzle-orm";

interface CreateJobRequest {
    jobType: string;
    descriptionText?: string;
    descriptionVoiceUrl?: string;
    workerQuantity: number;
    estimatedHours: number;
    bookingLat?: number;
    bookingLong?: number;
    bookingAddressText?: string;
    scheduledStartTime?: string;
    paymentMethod?: 'cash' | 'transfer' | 'other';
    addressId?: number; // ID địa chỉ đã lưu
}

const createJob = async (req: Request, res: Response) =>{
    try {
        const customerId = (req as any).user?.id; // Lấy từ middleware auth

        if (!customerId) {
            return res.status(401).json({
                success: false,
                message: 'Không tìm thấy thông tin người dùng'
            });
        }

        const {
            jobType,
            descriptionText,
            descriptionVoiceUrl,
            workerQuantity,
            estimatedHours,
            bookingLat,
            bookingLong,
            bookingAddressText,
            scheduledStartTime,
            paymentMethod,
            addressId
        }: CreateJobRequest = req.body;

        // Validate required fields
        if (!jobType || !workerQuantity || !estimatedHours) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu thông tin bắt buộc: jobType, workerQuantity, estimatedHours'
            });
        }

        let finalBookingLat = bookingLat;
        let finalBookingLong = bookingLong;
        let finalBookingAddressText = bookingAddressText;


        if (addressId) {
            const address = await db.select().from(customerAddresses).where(
                and(eq(customerAddresses.id,addressId),eq(customerAddresses.customerId,customerId))
            ).limit(1).then(res => res[0]);

            if (address) {
                finalBookingLat = Number(address.lat);
                finalBookingLong = Number(address.long);
                finalBookingAddressText  = address.addressText ? address.addressText : finalBookingAddressText;
            }
        }

        // Tính giá ước tính
        const priceEstimated = await PricingService.calculatePrice(
            workerQuantity,
            estimatedHours
        );

        // Tính thời gian tự động hết hạn (ví dụ: 30 phút sau)
        const autoExpireAt = new Date();
        autoExpireAt.setMinutes(autoExpireAt.getMinutes() + 30);

        // Tạo job mới
        const [newJob] = await db.insert(jobs).values({
            customerId,
            jobType,
            descriptionText: descriptionText || '',
            descriptionVoiceUrl: descriptionVoiceUrl || '',
            workerQuantity,
            estimatedHours,
            bookingLat: finalBookingLat ? finalBookingLat.toString() : null,
            bookingLong: finalBookingLong ? finalBookingLong.toString() : null,
            bookingAddressText: finalBookingAddressText || '',
            scheduledStartTime: scheduledStartTime ? new Date(scheduledStartTime) : null,
            priceEstimated: priceEstimated.toString(),
            finalPrice: '0',
            paymentMethod,
            autoExpireAt,
            status: 'searching',
            paymentStatus: 'unpaid',
            createdAt: new Date(),
            updatedAt: new Date()
        }).$returningId();

        // TODO: Gọi hàm matching để tìm thợ phù hợp
        // await this.matchWorkersForJob(newJob.id);

        return res.status(201).json({
            success: true,
            message: 'Tạo job thành công',
            data: {
                jobId: newJob.id,
                priceEstimated,
                status: 'searching',
                autoExpireAt
            }
        });

    } catch (error) {
        console.error('Error creating job:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi server khi tạo job',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}
