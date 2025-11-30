CREATE TABLE "admins" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "admins_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"name" varchar(100),
	"email" varchar(150) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"role" varchar(20) DEFAULT 'moderator',
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "admins_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "customer_addresses" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "customer_addresses_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"customer_id" bigint NOT NULL,
	"label" varchar(50),
	"lat" numeric(10, 7),
	"long" numeric(10, 7),
	"address_text" varchar(255),
	"is_default" smallint DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_settings" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "customer_settings_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"customer_id" bigint NOT NULL,
	"language" varchar(10) DEFAULT 'vi',
	"default_payment_method" varchar(20) DEFAULT 'cash',
	"notify_job_status" smallint DEFAULT 1,
	"notify_chat" smallint DEFAULT 1,
	"notify_promo" smallint DEFAULT 1,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_assignments" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "job_assignments_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"job_id" bigint NOT NULL,
	"worker_id" bigint NOT NULL,
	"status" varchar(20) DEFAULT 'requested',
	"accepted_at" timestamp,
	"arrived_at" timestamp,
	"started_at" timestamp,
	"finished_at" timestamp,
	"earning_amount" numeric(12, 2),
	"is_leader" smallint DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_assignment" UNIQUE("job_id","worker_id")
);
--> statement-breakpoint
CREATE TABLE "jobs" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "jobs_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"customer_id" bigint NOT NULL,
	"job_type" varchar(20) NOT NULL,
	"description_text" varchar(255),
	"description_voice_url" varchar(255),
	"worker_quantity" integer DEFAULT 1,
	"booking_lat" numeric(10, 7),
	"booking_long" numeric(10, 7),
	"booking_address_text" varchar(255),
	"scheduled_start_time" timestamp,
	"estimated_hours" integer,
	"actual_hours" numeric(5, 2),
	"price_estimated" numeric(12, 2),
	"final_price" numeric(12, 2),
	"status" varchar(20) DEFAULT 'searching',
	"payment_method" varchar(20) DEFAULT 'cash',
	"payment_status" varchar(20) DEFAULT 'unpaid',
	"cancel_reason" varchar(255),
	"auto_expire_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "system_settings" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "system_settings_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"key" varchar(100) NOT NULL,
	"value" varchar(255),
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "system_settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "users_customer" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "users_customer_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"zalo_id" varchar(100),
	"phone_number" varchar(20),
	"full_name" varchar(100),
	"default_lat" numeric(10, 7),
	"default_long" numeric(10, 7),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users_worker" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "users_worker_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"zalo_id" varchar(100),
	"phone_number" varchar(20),
	"full_name" varchar(100),
	"gender" varchar(20),
	"yob" integer,
	"height_cm" integer,
	"weight_kg" integer,
	"cccd_number" varchar(50),
	"cccd_name" varchar(150),
	"cccd_dob" date,
	"cccd_address" varchar(255),
	"cccd_issued_date" date,
	"cccd_front_url" varchar(255),
	"cccd_back_url" varchar(255),
	"avatar_face_url" varchar(255),
	"avatar_full_body_url" varchar(255),
	"current_lat" numeric(10, 7),
	"current_long" numeric(10, 7),
	"is_online" smallint DEFAULT 0,
	"status" varchar(20) DEFAULT 'pending',
	"verify_status" varchar(20) DEFAULT 'pending',
	"verify_note" text,
	"rating_avg" numeric(2, 1) DEFAULT '0.0',
	"rating_count" integer DEFAULT 0,
	"last_online_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "worker_settings" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "worker_settings_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"worker_id" bigint NOT NULL,
	"preferred_job_types" jsonb,
	"max_distance_km" numeric(4, 1),
	"work_time_start" time,
	"work_time_end" time,
	"auto_accept" smallint DEFAULT 0,
	"notify_new_job" smallint DEFAULT 1,
	"notify_chat" smallint DEFAULT 1,
	"notify_system" smallint DEFAULT 1,
	"language" varchar(10) DEFAULT 'vi',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "worker_verification_logs" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "worker_verification_logs_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"worker_id" bigint NOT NULL,
	"admin_id" bigint NOT NULL,
	"action" varchar(20) NOT NULL,
	"reason" text,
	"data_snapshot" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "customer_addresses" ADD CONSTRAINT "customer_addresses_customer_id_users_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users_customer"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_settings" ADD CONSTRAINT "customer_settings_customer_id_users_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users_customer"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_assignments" ADD CONSTRAINT "job_assignments_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_assignments" ADD CONSTRAINT "job_assignments_worker_id_users_worker_id_fk" FOREIGN KEY ("worker_id") REFERENCES "public"."users_worker"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_customer_id_users_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users_customer"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worker_settings" ADD CONSTRAINT "worker_settings_worker_id_users_worker_id_fk" FOREIGN KEY ("worker_id") REFERENCES "public"."users_worker"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worker_verification_logs" ADD CONSTRAINT "worker_verification_logs_worker_id_users_worker_id_fk" FOREIGN KEY ("worker_id") REFERENCES "public"."users_worker"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worker_verification_logs" ADD CONSTRAINT "worker_verification_logs_admin_id_admins_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_job_id" ON "job_assignments" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "idx_worker_id" ON "job_assignments" USING btree ("worker_id");--> statement-breakpoint
CREATE INDEX "idx_phone" ON "users_customer" USING btree ("phone_number");--> statement-breakpoint
CREATE INDEX "idx_zalo" ON "users_customer" USING btree ("zalo_id");--> statement-breakpoint
CREATE INDEX "idx_worker_scan" ON "users_worker" USING btree ("status","is_online");--> statement-breakpoint
CREATE INDEX "idx_worker_location" ON "users_worker" USING btree ("current_lat","current_long");