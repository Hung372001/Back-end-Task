export const DEFAULT_SYSTEM_SETTINGS = [
    // --- B) JOB & WORKFLOW SETTING ---
    { group: 'JOB_WORKFLOW', key: 'online_payment_timeout_minutes', value: '15', type: 'number', description: 'Thời gian tối đa thanh toán ONLINE' },
    { group: 'JOB_WORKFLOW', key: 'auto_cancel_unpaid_job', value: 'true', type: 'boolean', description: 'Tự hủy job nếu quá hạn chưa thanh toán' },

    // JobNow
    { group: 'JOB_WORKFLOW', key: 'jobnow_enabled', value: 'true', type: 'boolean', description: 'Bật/tắt chế độ nhận job ngay' },
    { group: 'JOB_WORKFLOW', key: 'jobnow_lock_seconds', value: '45', type: 'number', description: 'Thời gian giữ chỗ tạm cho thợ' },
    { group: 'JOB_WORKFLOW', key: 'jobnow_confirm_required', value: 'true', type: 'boolean', description: 'Bắt thợ xác nhận lại để tránh giữ job ảo' },
    { group: 'JOB_WORKFLOW', key: 'jobnow_fallback_to_bidding', value: 'true', type: 'boolean', description: 'Không ai nhận thì chuyển sang đấu giá' },

    // Bidding
    { group: 'JOB_WORKFLOW', key: 'bidding_enabled', value: 'true', type: 'boolean', description: 'Bật/tắt chế độ đấu giá' },
    { group: 'JOB_WORKFLOW', key: 'bidding_duration_seconds', value: '300', type: 'number', description: 'Thời gian cho thợ gửi giá thầu' },
    { group: 'JOB_WORKFLOW', key: 'bid_min_price', value: '50000', type: 'number', description: 'Giá thầu thấp nhất' },
    { group: 'JOB_WORKFLOW', key: 'bid_max_price', value: '5000000', type: 'number', description: 'Giá thầu cao nhất' },
    { group: 'JOB_WORKFLOW', key: 'bid_step_amount', value: '10000', type: 'number', description: 'Bước nhảy giá thầu' },

    // --- C) MATCHING & GEO ---
    { group: 'MATCHING', key: 'default_search_radius_km', value: '5', type: 'number', description: 'Bán kính tìm thợ mặc định' },
    { group: 'MATCHING', key: 'max_search_radius_km', value: '20', type: 'number', description: 'Bán kính tìm thợ tối đa' },
    { group: 'MATCHING', key: 'radius_expand_interval_minutes', value: '2', type: 'number', description: 'Bao lâu thì mở rộng bán kính' },
    { group: 'MATCHING', key: 'worker_must_kyc_to_receive_job', value: 'true', type: 'boolean', description: 'Chỉ thợ đã KYC mới nhận job' },
    { group: 'MATCHING', key: 'worker_must_online', value: 'true', type: 'boolean', description: 'Chỉ thợ đang bật nhận việc mới được match' },

    // --- D) WALLET & FINANCE ---
    { group: 'WALLET', key: 'deposit_min_balance_for_cash_job', value: '200000', type: 'number', description: 'Số dư tối thiểu để nhận job CASH' },
    { group: 'WALLET', key: 'deposit_negative_auto_lock_cash_job', value: 'true', type: 'boolean', description: 'Ví âm tự khóa nhận job CASH' },
    { group: 'WALLET', key: 'allow_receive_online_job_when_cash_locked', value: 'true', type: 'boolean', description: 'Bị khóa CASH vẫn cho nhận job ONLINE' },

    // Earning & Payout
    { group: 'WALLET', key: 'earning_hold_days_after_completed', value: '3', type: 'number', description: 'Số ngày giữ tiền sau khi job hoàn thành' },
    { group: 'WALLET', key: 'weekly_payout_day', value: '2', type: 'number', description: 'Thứ rút tiền miễn phí (2=Thứ Hai)' },
    { group: 'WALLET', key: 'minimum_payout_amount', value: '50000', type: 'number', description: 'Số tiền tối thiểu được rút' },
    { group: 'WALLET', key: 'instant_withdraw_enabled', value: 'true', type: 'boolean', description: 'Bật rút tiền nhanh' },
    { group: 'WALLET', key: 'instant_withdraw_fee_amount', value: '5000', type: 'number', description: 'Phí rút nhanh' },

    // --- E) PRICING & FEE ---
    { group: 'PRICING', key: 'platform_fee_percent_default', value: '15', type: 'number', description: '% phí nền tảng mặc định' },
    { group: 'PRICING', key: 'cancel_fee_searching_percent', value: '0', type: 'number', description: 'Phí hủy khi đang SEARCHING' },
    { group: 'PRICING', key: 'cancel_fee_locked_worker_percent', value: '10', type: 'number', description: 'Phần tiền trả thợ khi hủy LOCKED' },

    // --- F) TRUST SCORE & RISK ---
    { group: 'TRUST', key: 'trust_warning_threshold', value: '60', type: 'number', description: 'Ngưỡng cảnh báo uy tín' },
    { group: 'TRUST', key: 'trust_block_cash_job_threshold', value: '50', type: 'number', description: 'Dưới ngưỡng cấm nhận CASH' },
    { group: 'TRUST', key: 'trust_penalty_worker_no_show', value: '30', type: 'number', description: 'Điểm phạt thợ không đến làm' },

    // --- G) ANTI-FRAUD ---
    { group: 'ANTI_FRAUD', key: 'job_create_rate_limit_seconds', value: '60', type: 'number', description: 'Chống spam tạo job (giây)' },
    { group: 'ANTI_FRAUD', key: 'gps_check_radius_meters', value: '150', type: 'number', description: 'Bán kính GPS cho phép check-in' },
    { group: 'ANTI_FRAUD', key: 'require_checkin_photo', value: 'true', type: 'boolean', description: 'Bắt chụp ảnh khi đến nơi' },

    // --- H) NOTIFICATION ---
    { group: 'NOTIFICATION', key: 'quiet_hours_start', value: '22:00', type: 'string', description: 'Giờ bắt đầu yên lặng' },
    { group: 'NOTIFICATION', key: 'quiet_hours_end', value: '06:00', type: 'string', description: 'Giờ kết thúc yên lặng' },

    // --- I) SOS & CHARITY ---
    { group: 'SOS', key: 'sos_enabled', value: 'true', type: 'boolean', description: 'Bật dịch vụ SOS' },
    { group: 'SOS', key: 'charity_budget_cap', value: '10000000', type: 'number', description: 'Ngân sách charity tối đa' },

    // --- J) ADMIN ---
    { group: 'ADMIN', key: 'audit_log_retention_days', value: '90', type: 'number', description: 'Số ngày lưu log audit' },
];