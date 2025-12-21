ALTER TABLE "system_settings" ALTER COLUMN "id" SET DATA TYPE serial;--> statement-breakpoint
ALTER TABLE "system_settings" ALTER COLUMN "id" DROP IDENTITY;--> statement-breakpoint
ALTER TABLE "system_settings" ALTER COLUMN "value" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "system_settings" ALTER COLUMN "value" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "system_settings" ADD COLUMN "group" varchar(50) NOT NULL;--> statement-breakpoint
ALTER TABLE "system_settings" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "system_settings" ADD COLUMN "type" varchar(20) DEFAULT 'string';