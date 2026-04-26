# components/layout/ — Structure globale

## DashboardShell

Wraps toutes les pages `dashboard/`. Fournit :
- `SidebarProvider` + `AppSidebar` (navigation)
- Header fixe avec `SidebarTrigger` et `TaskBell`
- Contenu scrollable via `SidebarInset`

Ne pas modifier sans comprendre l'impact sur toutes les pages du dashboard.

## AppSidebar — Ajouter un item de navigation

La navigation est déclarée en quatre tableaux dans `AppSidebar.tsx` :

```ts
NAV_MODULES   // Modules métier (CRM, Opérations, Finance)
NAV_KNOWLEDGE // Connaissance (Wiki, À propos)
NAV_LEGAL     // Légal (Référentiel Légal)
NAV_SETTINGS  // Paramètres (Profil, Préférences)
```

Pour ajouter un lien simple :
```ts
{
  labelKey:    'nav.ma_cle',    // Doit exister dans i18n.ts (EN + FR)
  icon:        MonIcon,         // Import depuis 'lucide-react'
  href:        '/dashboard/ma-route',
  collapsible: false,
}
```

Pour ajouter un groupe dépliable :
```ts
{
  labelKey:    'nav.mon_groupe',
  icon:        MonIcon,
  collapsible: true,
  children: [
    { labelKey: 'nav.enfant', icon: AutreIcon, href: '/dashboard/enfant' },
  ],
}
```

**Toujours ajouter la clé i18n** dans `src/lib/i18n.ts` pour les deux langues avant d'ajouter l'item.

## TaskBell

Cloche de notification dans le header — affiche le nombre de tâches ouvertes assignées à l'utilisateur.
Appelle `/api/my-tasks` (user token). Polling toutes les 60s.
Ne pas supprimer — fonctionnalité attendue par les utilisateurs.
