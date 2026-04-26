import { Users } from 'lucide-react'
import type { ModuleConfig } from '@/modules/_template/module.config'

const config: ModuleConfig = {
  id:          'crm',
  name:        'CRM',
  description: 'Partenaires, opportunités, activités',
  color:       '#EA580C',
  icon:        Users,
  routes: {
    list:   '/dashboard/partners',
    detail: '/dashboard/partners/[id]',
    new:    '/dashboard/partners/new',
  },
  events: [
    'OPPORTUNITY_WON',
    'OPPORTUNITY_LOST',
    'PARTNER_CREATED',
  ],
  resources: ['partners', 'opportunities', 'activities'],
}

export default config
