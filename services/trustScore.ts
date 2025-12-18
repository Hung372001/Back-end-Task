import { eq, sql } from 'drizzle-orm';
import { addHours } from 'date-fns';
import db from "../db";
import {customer_trust_logs, usersCustomer} from "../db/schema";
import {TRUST_CONFIG} from "../constants/trust-score.config";

export class TrustScoreService {

    /**
     * Hàm update điểm chung cho mọi hành động
     * @param customerId ID khách hàng
     * @param scoreDelta Điểm thay đổi (ví dụ: +0.02 hoặc -0.15)
     * @param actionType Loại hành động (enum string)
     * @param jobId ID Job liên quan (optional)
     * @param description Ghi chú
     */
    async updateTrustScore(
        customerId: number,
        scoreDelta: number,
        actionType: string,
        jobId?: number,
        description?: string
    ) {
        return await db.transaction(async (tx) => {
            // 1. Lấy thông tin user hiện tại
            const [user] = await tx
                .select()
                .from(usersCustomer)
                .where(eq(usersCustomer.id, customerId));

            if (!user) throw new Error('Customer not found');

            const currentScore = parseFloat(user.trustScore);

            // 2. Tính điểm mới (Formula: Old + Delta)
            let rawNewScore = currentScore + scoreDelta;

            // 3. Kẹp biên (Clamp): Không < 0 và Không > 5
            if (rawNewScore > TRUST_CONFIG.MAX_SCORE) rawNewScore = TRUST_CONFIG.MAX_SCORE;
            if (rawNewScore < TRUST_CONFIG.MIN_SCORE) rawNewScore = TRUST_CONFIG.MIN_SCORE;

            // Làm tròn 2 chữ số thập phân để lưu DB cho đẹp
            const finalNewScore = Math.round(rawNewScore * 100) / 100;

            // Nếu điểm không đổi (ví dụ đã 5.0 mà cộng thêm), vẫn ghi log nhưng không update DB thừa
            // Tuy nhiên quy tắc: "Điểm chỉ tăng khi hành vi tốt" -> logic trên đã cover.

            // 4. Kiểm tra quy tắc KHÓA (Lock Rule)
            let lockUntil: Date | null = user.trustLockedUntil; // Giữ nguyên nếu đang khóa

            // Nếu rớt xuống dưới 2.0 -> Khóa 48h
            if (finalNewScore < TRUST_CONFIG.LOCK_THRESHOLD) {
                lockUntil = addHours(new Date(), TRUST_CONFIG.LOCK_DURATION_HOURS);
            }
                // Nếu đang bị khóa mà cày điểm lên >= 2.0 (Logic này hiếm vì bị khóa sao nhận job?
            // Nhưng có thể do Admin cộng điểm bù), thì mở khóa.
            else if (lockUntil && finalNewScore >= TRUST_CONFIG.LOCK_THRESHOLD) {
                lockUntil = null;
            }

            // 5. Update User
            await tx.update(usersCustomer)
                .set({
                    trustScore: finalNewScore.toString(), // Drizzle Decimal là string
                    trustLockedUntil: lockUntil,
                })
                .where(eq(usersCustomer.id, customerId));

            // 6. Ghi Log (Audit)
            await tx.insert(customer_trust_logs).values({
                customerId,
                jobId,
                actionType,
                changeAmount: scoreDelta.toString(),
                oldScore: currentScore.toString(),
                newScore: finalNewScore.toString(),
                description: description || '',
            });

            return { oldScore: currentScore, newScore: finalNewScore, isLocked: !!lockUntil };
        });
    }

    /**
     * Middleware Helper: Check xem user có bị khóa không
     */
    async checkIsLocked(customerId: number): Promise<boolean> {
        const [user] = await db
            .select({ trustLockedUntil: usersCustomer.trustLockedUntil })
            .from(usersCustomer)
            .where(eq(usersCustomer.id, customerId));

        if (!user || !user.trustLockedUntil) return false;

        // So sánh thời gian hiện tại với thời gian mở khóa
        return new Date() < new Date(user.trustLockedUntil);
    }
}