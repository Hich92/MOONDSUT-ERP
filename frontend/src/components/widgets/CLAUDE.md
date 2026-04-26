# components/widgets/ — Widgets autonomes

Composants Client Component sans lien direct avec Saltcorn. Chacun gère son propre état.

## XkcdWidget

Affiche un comic XKCD avec navigation.

```tsx
import { XkcdWidget } from '@/components/widgets/XkcdWidget'

// initial = données SSR (fetch serveur, fast first paint)
// latest  = numéro du dernier comic (pour désactiver "Suivant")
<XkcdWidget initial={xkcdData} latest={xkcdData.num} />
```

**Route API associée :** `/api/xkcd?num=N` ou `/api/xkcd?random=1`

**Interactions :**
- Clic sur l'image → affiche le texte secret (alt de Randall Munroe) en overlay
- Bouton précédent / suivant → charge le comic adjacent
- Bouton aléatoire → fetch `/api/xkcd?random=1`

**Image Next.js :** Le domaine `imgs.xkcd.com` est autorisé dans `next.config.js`.
