import {
  pgTable, serial, integer, text, numeric,
} from 'drizzle-orm/pg-core'
import { tenants } from './core'
import { contracts } from './sales'

export const projects = pgTable('projects', {
  id:              serial('id').primaryKey(),
  tenantId:        integer('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  contractId:      integer('contract_id').references(() => contracts.id, { onDelete: 'set null' }),
  name:            text('name').notNull(),
  status:          text('status').default('planned'),
  progress:        integer('progress').default(0),
  createdByUserId: integer('created_by_user_id'),
})

export const tasks = pgTable('tasks', {
  id:          serial('id').primaryKey(),
  tenantId:    integer('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  projectId:   integer('project_id').references(() => projects.id, { onDelete: 'cascade' }),
  title:       text('title').notNull(),
  estHours:    numeric('est_hours', { precision: 8, scale: 2 }),
  actHours:    numeric('act_hours', { precision: 8, scale: 2 }),
  hourlyCost:  numeric('hourly_cost', { precision: 8, scale: 2 }),
  status:      text('status').default('todo'),
  assignedTo:  integer('assigned_to'),
})
