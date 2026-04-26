CREATE TYPE "public"."activity_status" AS ENUM('open', 'done', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."activity_type" AS ENUM('Note', 'Action');--> statement-breakpoint
CREATE TYPE "public"."opportunity_stage" AS ENUM('lead', 'qualification', 'proposition', 'negotiation', 'won', 'lost');--> statement-breakpoint
CREATE TYPE "public"."partner_type" AS ENUM('contact', 'prospect', 'client', 'ex-client', 'fournisseur', 'partenaire');--> statement-breakpoint
CREATE TABLE "erp_attachments" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer,
	"related_table" text NOT NULL,
	"related_id" integer NOT NULL,
	"filename" text NOT NULL,
	"original_name" text NOT NULL,
	"mimetype" text DEFAULT 'application/octet-stream' NOT NULL,
	"size" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "erp_users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"password_hash" text NOT NULL,
	"role_id" integer DEFAULT 80 NOT NULL,
	"tenant_id" integer,
	"disabled" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "erp_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "activities" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"type" text DEFAULT 'Note' NOT NULL,
	"content" text,
	"status" text DEFAULT 'open',
	"due_date" date,
	"related_table" text,
	"related_id" integer,
	"created_by" integer,
	"assigned_to" integer,
	"created_at" timestamp with time zone DEFAULT now(),
	"resolved_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "opportunities" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"name" text NOT NULL,
	"partner_id" integer,
	"owner_id" integer,
	"stage" text DEFAULT 'lead',
	"probability" integer DEFAULT 0,
	"deal_value" numeric(14, 2),
	"deal_type" text,
	"submission_date" date,
	"closing_date" date,
	"tender_type" text,
	"has_negotiation" boolean DEFAULT false,
	"has_demo" boolean DEFAULT false,
	"has_migration" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "partners" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"is_company" boolean DEFAULT false NOT NULL,
	"name" text NOT NULL,
	"first_name" text,
	"parent_id" integer,
	"type" text DEFAULT 'contact' NOT NULL,
	"email" text,
	"phone" text,
	"mobile" text,
	"website" text,
	"address" text,
	"city" text,
	"zip" text,
	"country" text,
	"siren" text,
	"siret" text,
	"vat" text,
	"legal_form" text,
	"code_naf" text,
	"payment_terms" text DEFAULT '30',
	"notes" text,
	"enseigne" text,
	"code_commune" text,
	"date_creation" date,
	"created_by_user_id" integer,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "contracts" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"opportunity_id" integer,
	"partner_id" integer,
	"title" varchar(255),
	"status" text DEFAULT 'draft',
	"start_date" date,
	"end_date" date,
	"total_value" numeric(14, 2),
	"created_by_user_id" integer
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"contract_id" integer,
	"invoice_number" text,
	"amount_ht" numeric(14, 2),
	"is_paid" boolean DEFAULT false,
	"issue_date" date,
	"created_by_user_id" integer
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"contract_id" integer,
	"name" text NOT NULL,
	"status" text DEFAULT 'planned',
	"progress" integer DEFAULT 0,
	"created_by_user_id" integer
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"project_id" integer,
	"title" text NOT NULL,
	"est_hours" numeric(8, 2),
	"act_hours" numeric(8, 2),
	"hourly_cost" numeric(8, 2),
	"status" text DEFAULT 'todo',
	"assigned_to" integer
);
--> statement-breakpoint
CREATE TABLE "purchase_orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"partner_id" integer,
	"supplier_contract_id" integer,
	"reference" text,
	"status" text DEFAULT 'draft',
	"amount_ht" numeric(12, 2),
	"tva_rate" numeric(5, 2) DEFAULT '20',
	"order_date" date,
	"expected_date" date,
	"received_date" date,
	"description" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"created_by_user_id" integer
);
--> statement-breakpoint
CREATE TABLE "supplier_contracts" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"partner_id" integer,
	"title" text NOT NULL,
	"status" text DEFAULT 'draft',
	"total_value" numeric(12, 2),
	"start_date" date,
	"end_date" date,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"created_by_user_id" integer
);
--> statement-breakpoint
CREATE TABLE "supplier_invoices" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"partner_id" integer,
	"purchase_order_id" integer,
	"supplier_contract_id" integer,
	"invoice_number" text NOT NULL,
	"status" text DEFAULT 'received',
	"amount_ht" numeric(12, 2),
	"tva_rate" numeric(5, 2) DEFAULT '20',
	"invoice_date" date,
	"due_date" date,
	"paid_date" date,
	"payment_ref" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"created_by_user_id" integer
);
--> statement-breakpoint
ALTER TABLE "erp_attachments" ADD CONSTRAINT "erp_attachments_tenant_id_erp_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."erp_tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp_users" ADD CONSTRAINT "erp_users_tenant_id_erp_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."erp_tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_tenant_id_erp_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."erp_tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_tenant_id_erp_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."erp_tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partners" ADD CONSTRAINT "partners_tenant_id_erp_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."erp_tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_tenant_id_erp_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."erp_tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_opportunity_id_opportunities_id_fk" FOREIGN KEY ("opportunity_id") REFERENCES "public"."opportunities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_tenant_id_erp_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."erp_tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_contract_id_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_tenant_id_erp_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."erp_tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_contract_id_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_tenant_id_erp_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."erp_tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_tenant_id_erp_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."erp_tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_supplier_contract_id_supplier_contracts_id_fk" FOREIGN KEY ("supplier_contract_id") REFERENCES "public"."supplier_contracts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_contracts" ADD CONSTRAINT "supplier_contracts_tenant_id_erp_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."erp_tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_contracts" ADD CONSTRAINT "supplier_contracts_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_invoices" ADD CONSTRAINT "supplier_invoices_tenant_id_erp_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."erp_tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_invoices" ADD CONSTRAINT "supplier_invoices_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_invoices" ADD CONSTRAINT "supplier_invoices_purchase_order_id_purchase_orders_id_fk" FOREIGN KEY ("purchase_order_id") REFERENCES "public"."purchase_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_invoices" ADD CONSTRAINT "supplier_invoices_supplier_contract_id_supplier_contracts_id_fk" FOREIGN KEY ("supplier_contract_id") REFERENCES "public"."supplier_contracts"("id") ON DELETE no action ON UPDATE no action;