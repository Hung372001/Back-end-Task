export const TRUST_CONFIG = {
    MIN_SCORE: 0.0,
    MAX_SCORE: 5.0,
    LOCK_THRESHOLD: 2.0, // Dưới mức này thì khóa
    LOCK_DURATION_HOURS: 48,

    // --- ĐIỂM THƯỞNG ---
    REWARD: {
        JOB_COMPLETED: 0.02,
        RATING_5_STAR: 0.05,
        RATING_4_STAR: 0.02,
        RATING_3_STAR: 0.00, // Không cộng không trừ
    },

    // --- ĐIỂM PHẠT (ĐÁNH GIÁ THẤP) ---
    PENALTY_RATING: {
        RATING_2_STAR: -0.05,
        RATING_1_STAR: -0.10,
    },

    // --- ĐIỂM PHẠT (HỦY JOB) ---
    PENALTY_CANCEL: {
        PENDING: -0.02,   // Status: searching
        BIDDING: -0.03,   // (Nếu có tính năng đấu giá)
        ASSIGNED: -0.07,  // Status: locked (đã có thợ)
        WORKING: -0.15,   // Status: in_progress
    },

    // --- VI PHẠM NẶNG ---
    VIOLATION: {
        NO_SHOW: -0.20,       // Khách không có mặt/không liên lạc được
        BOM_HANG: -0.30,      // Bom hàng
        DISPUTE_LOST: -0.25,  // Thua tranh chấp
    }
};