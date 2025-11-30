import {
    pgTable, bigint, varchar, text, decimal, timestamp,
    date, jsonb, unique, index,
    time, integer, smallint, serial
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// 1. users_customer
export const usersCustomer = pgTable('users_customer', {
    id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
    zaloId: varchar('zalo_id', { length: 100 }),
    phoneNumber: varchar('phone_number', { length: 20 }),
    fullName: varchar('full_name', { length: 100 }),
    defaultLat: decimal('default_lat', { precision: 10, scale: 7 }),
    defaultLong: decimal('default_long', { precision: 10, scale: 7 }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
    phoneIdx: index('idx_phone').on(table.phoneNumber),
    zaloIdx: index('idx_zalo').on(table.zaloId),
}));

// 2. users_worker
export const usersWorker = pgTable('users_worker', {
    id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
    zaloId: varchar('zalo_id', { length: 100 }),
    phoneNumber: varchar('phone_number', { length: 20 }),
    fullName: varchar('full_name', { length: 100 }),
    gender: varchar('gender', { length: 20 }).$type<'male' | 'female' | 'other'>(),
    yob: integer('yob'),
    heightCm: integer('height_cm'),
    weightKg: integer('weight_kg'),

    // CCCD
    cccdNumber: varchar('cccd_number', { length: 50 }),
    cccdName: varchar('cccd_name', { length: 150 }),
    cccdDob: date('cccd_dob'),
    cccdAddress: varchar('cccd_address', { length: 255 }),
    cccdIssuedDate: date('cccd_issued_date'),
    cccdFrontUrl: varchar('cccd_front_url', { length: 255 }),
    cccdBackUrl: varchar('cccd_back_url', { length: 255 }),

    // Avatar
    avatarFaceUrl: varchar('avatar_face_url', { length: 255 }),
    avatarFullBodyUrl: varchar('avatar_full_body_url', { length: 255 }),

    // Location
    currentLat: decimal('current_lat', { precision: 10, scale: 7 }),
    currentLong: decimal('current_long', { precision: 10, scale: 7 }),
    isOnline: smallint('is_online').default(0),

    status: varchar('status', { length: 20 }).$type<'pending' | 'active' | 'banned'>().default('pending'),
    verifyStatus: varchar('verify_status', { length: 20 }).$type<'pending' | 'approved' | 'rejected'>().default('pending'),
    verifyNote: text('verify_note'),

    ratingAvg: decimal('rating_avg', { precision: 2, scale: 1 }).default('0.0'),
    ratingCount: integer('rating_count').default(0),

    lastOnlineAt: timestamp('last_online_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
    scanIdx: index('idx_worker_scan').on(table.status, table.isOnline),
    locationIdx: index('idx_worker_location').on(table.currentLat, table.currentLong),
}));

// 3. admins
export const admins = pgTable('admins', {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    name: varchar('name', { length: 100 }),
    email: varchar('email', { length: 150 }).notNull().unique(),
    passwordHash: varchar('password_hash', { length: 255 }).notNull(),
    role: varchar('role', { length: 20 }).$type<'super_admin' | 'moderator'>().default('moderator'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 4. system_settings
export const systemSettings = pgTable('system_settings', {
    id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
    key: varchar('key', { length: 100 }).notNull().unique(),
    value: varchar('value', { length: 255 }),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 5. jobs
export const jobs = pgTable('jobs', {
    id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
    customerId: bigint('customer_id', { mode: 'number' }).notNull().references(() => usersCustomer.id, { onDelete: 'cascade' }),

    jobType: varchar('job_type', { length: 20 }).$type<'boc_vac' | 'don_dep' | 'chuyen_nha' | 'viec_vat'>().notNull(),

    descriptionText: varchar('description_text', { length: 255 }),
    descriptionVoiceUrl: varchar('description_voice_url', { length: 255 }),

    workerQuantity: integer('worker_quantity').default(1),
    bookingLat: decimal('booking_lat', { precision: 10, scale: 7 }),
    bookingLong: decimal('booking_long', { precision: 10, scale: 7 }),
    bookingAddressText: varchar('booking_address_text', { length: 255 }),

    scheduledStartTime: timestamp('scheduled_start_time'),
    estimatedHours: integer('estimated_hours'),
    actualHours: decimal('actual_hours', { precision: 5, scale: 2 }),
    priceEstimated: decimal('price_estimated', { precision: 12, scale: 2 }),
    finalPrice: decimal('final_price', { precision: 12, scale: 2 }),

    status: varchar('status', { length: 20 }).$type<'searching' | 'locked' | 'in_progress' | 'completed' | 'cancelled'>().default('searching'),

    paymentMethod: varchar('payment_method', { length: 20 }).$type<'cash' | 'transfer' | 'other'>().default('cash'),
    paymentStatus: varchar('payment_status', { length: 20 }).$type<'unpaid' | 'paid' | 'refund'>().default('unpaid'),
    cancelReason: varchar('cancel_reason', { length: 255 }),
    autoExpireAt: timestamp('auto_expire_at'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 6. job_assignments
export const jobAssignments = pgTable('job_assignments', {
    id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
    jobId: bigint('job_id', { mode: 'number' }).notNull().references(() => jobs.id, { onDelete: 'cascade' }),
    workerId: bigint('worker_id', { mode: 'number' }).notNull().references(() => usersWorker.id, { onDelete: 'cascade' }),

    status: varchar('status', { length: 20 }).$type<'requested' | 'accepted' | 'arrived' | 'in_progress' | 'done' | 'cancelled'>().default('requested'),

    acceptedAt: timestamp('accepted_at'),
    arrivedAt: timestamp('arrived_at'),
    startedAt: timestamp('started_at'),
    finishedAt: timestamp('finished_at'),

    earningAmount: decimal('earning_amount', { precision: 12, scale: 2 }),
    isLeader: smallint('is_leader').default(0),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
    uniqueAssignment: unique('unique_assignment').on(table.jobId, table.workerId),
    jobIdx: index('idx_job_id').on(table.jobId),
    workerIdx: index('idx_worker_id').on(table.workerId),
}));

// 7–10. Các bảng còn lại (tương tự, mình viết gọn cho nhanh)
export const workerVerificationLogs = pgTable('worker_verification_logs', {
    id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
    workerId: bigint('worker_id', { mode: 'number' }).notNull().references(() => usersWorker.id, { onDelete: 'cascade' }),
    adminId: bigint('admin_id', { mode: 'number' }).notNull().references(() => admins.id),
    action: varchar('action', { length: 20 }).$type<'approved' | 'rejected'>().notNull(),
    reason: text('reason'),
    dataSnapshot: jsonb('data_snapshot'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const workerSettings = pgTable('worker_settings', {
    id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
    workerId: bigint('worker_id', { mode: 'number' }).notNull().references(() => usersWorker.id, { onDelete: 'cascade' }),
    preferredJobTypes: jsonb('preferred_job_types'),
    maxDistanceKm: decimal('max_distance_km', { precision: 4, scale: 1 }),
    workTimeStart: time('work_time_start'),
    workTimeEnd: time('work_time_end'),
    autoAccept: smallint('auto_accept').default(0),
    notifyNewJob: smallint('notify_new_job').default(1),
    notifyChat: smallint('notify_chat').default(1),
    notifySystem: smallint('notify_system').default(1),
    language: varchar('language', { length: 10 }).default('vi'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const customerSettings = pgTable('customer_settings', {
    id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
    customerId: bigint('customer_id', { mode: 'number' }).notNull().references(() => usersCustomer.id, { onDelete: 'cascade' }),
    language: varchar('language', { length: 10 }).default('vi'),
    defaultPaymentMethod: varchar('default_payment_method', { length: 20 }).$type<'cash' | 'transfer' | 'other'>().default('cash'),
    notifyJobStatus: smallint('notify_job_status').default(1),
    notifyChat: smallint('notify_chat').default(1),
    notifyPromo: smallint('notify_promo').default(1),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const customerAddresses = pgTable('customer_addresses', {
    id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
    customerId: bigint('customer_id', { mode: 'number' }).notNull().references(() => usersCustomer.id, { onDelete: 'cascade' }),
    label: varchar('label', { length: 50 }),
    lat: decimal('lat', { precision: 10, scale: 7 }),
    long: decimal('long', { precision: 10, scale: 7 }),
    addressText: varchar('address_text', { length: 255 }),
    isDefault: smallint('is_default').default(0),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});