# components/modules/ — Composants de module

Ces composants sont les briques réutilisables qui construisent chaque module métier.

## PageDetail

Client Component pour afficher et éditer un enregistrement.

```tsx
<PageDetail
  title={String(record.name)}
  iconNode={<FolderKanban className="w-4 h-4 text-violet-600" />}
  backHref="/dashboard/projects"
  record={record}               // Record brut depuis Saltcorn
  relatedTable="projects"       // Nom de la table Saltcorn
  fields={[...]}                // Définition des champs (voir FieldDef)
  statusBar={<StatusBar ... />} // Optionnel
  tabs={<RelatedList ... />}    // Optionnel — liste liée
/>
```

### FieldDef — champs disponibles

```ts
{
  key: 'contract_id',           // Clé dans le record Saltcorn
  label: 'Contrat',
  editType: 'select',           // text | email | tel | number | date | select | textarea | checkbox | readonly
  editOptions: [...],           // Requis si editType === 'select'
  renderAs: 'contractStatus',   // Renderer visuel (badges colorés)
  resolvedLabel: contractName,  // Pour les FK : label résolu server-side
  goToPath: '/dashboard/contracts', // Pour les FK : lien vers la fiche liée
  span: true,                   // Pleine largeur
}
```

### Renderers disponibles (`renderAs`)

`stage` · `contractStatus` · `projectStatus` · `taskStatus` · `contactType` · `amount` · `percent` · `bool` · `date`

Pour ajouter un renderer : l'ajouter dans `RENDERERS` dans `PageDetail.tsx` ET dans `renderers.tsx`.

### Sauvegarde

`PageDetail` appelle `PATCH /api/entity/[table]` pour les updates. Cette route utilise le token admin.
Ne pas appeler Saltcorn directement depuis `PageDetail` — tout passe par cette API route.

## FormPage

Client Component pour créer un enregistrement. Appelle `POST /api/records/[table]`.

```tsx
<FormPage
  title="Nouveau projet"
  iconNode={<FolderKanban className="w-4 h-4" />}
  fields={fields}         // FieldConfig[]
  apiTable="projects"     // Nom exact de la table Saltcorn
  backHref="/dashboard/projects"
/>
```

Après création réussie, redirige automatiquement vers `backHref`.
Le champ `defaultValue` dans `FieldConfig` permet de pré-remplir depuis `searchParams` (ex: `project_id` pour une nouvelle tâche).

## RelatedList

Affiche une liste d'enregistrements liés dans l'onglet d'un `PageDetail`.

```tsx
<RelatedList
  title="Tâches"
  items={tasks}                    // Tableau brut Saltcorn
  columns={[...]}                  // Colonnes à afficher
  detailBasePath="/dashboard/tasks"
  newHref={`/dashboard/tasks/new?project_id=${id}`}
  emptyMessage="Aucune tâche"
/>
```

## ActivitiesPanel

Affiché automatiquement par `PageDetail`. Gère Notes, Actions et Historique.
Appelle `/api/activities?table=X&id=Y` (user token) et `/api/history/[table]/[id]`.

Ne pas intégrer `ActivitiesPanel` manuellement — `PageDetail` l'inclut toujours.

## StatusBar

Barre de progression visuelle pour les entités avec statut séquentiel (projets, contrats, opportunités).

```tsx
const STAGES: Stage[] = [
  { key: 'planned', label: 'Planifié' },
  { key: 'in_progress', label: 'En cours' },
  ...
]
<StatusBar stages={STAGES} current={String(record.status ?? 'planned')} />
```

La valeur `current` doit correspondre exactement à une `key` des stages, sinon le premier stage est affiché.
