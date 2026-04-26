import { Settings } from 'lucide-react'
import type { ModuleConfig } from '@/modules/_template/module.config'

const config: ModuleConfig = {
  id:          'core',
  name:        'Core',
  description: 'Tenants, utilisateurs, groupes et permissions',
  color:       '#6B7280',
  icon:        Settings,
  routes: {
    list: '/dashboard/admin',
  },
  events:    [],
  resources: ['tenants', 'users', 'groups'],
}

export default config
