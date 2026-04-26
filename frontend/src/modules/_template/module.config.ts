// Copier ce fichier dans chaque nouveau module et remplir les champs.
import type { LucideIcon } from 'lucide-react'

export interface ModuleConfig {
  id:          string        // identifiant snake_case unique
  name:        string        // nom affiché
  description: string
  color:       string        // hex — palette définie dans CLAUDE.md
  icon:        LucideIcon
  routes: {
    list?:   string
    detail?: string
    new?:    string
  }
  // Événements Activepieces émis par ce module
  events: string[]
  // Ressources exposées aux permissions (erp_group_permissions.resource)
  resources: string[]
}
