CREATE TABLE "customer_trust_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer NOT NULL,
	"job_id" integer,
	"action_type" varchar(50) NOT NULL,
	"change_amount" numeric(3, 2) NOT NULL,
	"old_score" numeric(3, 2) NOT NULL,
	"new_score" numeric(3, 2) NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "job_assignments" ALTER COLUMN "status" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "jobs" ALTER COLUMN "status" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users_customer" ADD COLUMN "trust_score" numeric(3, 2) DEFAULT '5.00' NOT NULL;--> statement-breakpoint
ALTER TABLE "users_customer" ADD COLUMN "trust_locked_until" timestamp;--> statement-breakpoint
ALTER TABLE "customer_trust_logs" ADD CONSTRAINT "customer_trust_logs_customer_id_users_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users_customer"("id") ON DELETE no action ON UPDATE no action;