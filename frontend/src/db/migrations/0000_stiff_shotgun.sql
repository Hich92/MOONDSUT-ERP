CREATE TYPE "public"."access_level" AS ENUM('none', 'read', 'edit');--> statement-breakpoint
CREATE TYPE "public"."tenant_plan" AS ENUM('trial', 'starter', 'pro', 'enterprise');--> statement-breakpoint
CREATE TYPE "public"."tenant_status" AS ENUM('active', 'suspended', 'cancelled');--> statement-breakpoint
CREATE TABLE "erp_group_permissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"group_id" integer NOT NULL,
	"resource" text NOT NULL,
	"access_level" "access_level" DEFAULT 'none' NOT NULL,
	"own_only" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "erp_groups" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "erp_tenants" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"plan" "tenant_plan" DEFAULT 'trial' NOT NULL,
	"status" "tenant_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "erp_tenants_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "erp_user_groups" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"group_id" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "erp_group_permissions" ADD CONSTRAINT "erp_group_permissions_group_id_erp_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."erp_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp_groups" ADD CONSTRAINT "erp_groups_tenant_id_erp_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."erp_tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp_user_groups" ADD CONSTRAINT "erp_user_groups_tenant_id_erp_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."erp_tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp_user_groups" ADD CONSTRAINT "erp_user_groups_group_id_erp_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."erp_groups"("id") ON DELETE cascade ON UPDATE no action;