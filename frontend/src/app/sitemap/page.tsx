import Link from 'next/link'
import { Zap, ArrowLeft, ExternalLink } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Plan du site',
  description: 'Plan complet du site MoonDust ERP — toutes les pages publiques et modules disponibles.',
}

const SECTIONS = [
  {
    title: 'Pages publiques',
    links: [
      { href: '/',               label: 'Accueil',                        desc: 'Présentation, tarifs, roadmap' },
      { href: '/terms',          label: 'CGU / CGV',                       desc: "Conditions générales d'utilisation et de vente" },
      { href: '/privacy',        label: 'Politique de confidentialité',    desc: 'RGPD et traitement des données' },
      { href: '/sitemap',        label: 'Plan du site',                    desc: 'Cette page' },
    ],
  },
  {
    title: 'Authentification',
    links: [
      { href: '/login',           label: 'Connexion',                      desc: 'Accéder à votre espace' },
      { href: '/signup',          label: 'Inscription',                    desc: 'Créer un compte gratuit' },
      { href: '/forgot-password', label: 'Mot de passe oublié',            desc: 'Recevoir un lien de réinitialisation' },
      { href: '/reset-password',  label: 'Réinitialisation du mot de passe', desc: 'Choisir un nouveau mot de passe' },
    ],
  },
  {
    title: 'Tableau de bord',
    links: [
      { href: '/dashboard',                    label: 'Accueil du tableau de bord',   desc: "KPIs et vue d'ensemble" },
      { href: '/dashboard/profile/preferences', label: 'Mon profil & préférences',    desc: 'Paramètres du compte' },
    ],
  },
  {
    title: 'CRM & Partenaires',
    links: [
      { href: '/dashboard/partners',     label: 'Partenaires',              desc: 'Sociétés et contacts (liste)' },
      { href: '/dashboard/partners/new', label: 'Nouveau partenaire',       desc: 'Créer une société ou un contact' },
      { href: '/dashboard/opportunities',     label: 'Opportunités',         desc: 'Pipeline CRM' },
      { href: '/dashboard/opportunities/new', label: 'Nouvelle opportunité', desc: 'Ajouter une opportunité' },
    ],
  },
  {
    title: 'Opérations',
    links: [
      { href: '/dashboard/contracts',      label: 'Contrats',           desc: 'Contrats clients' },
      { href: '/dashboard/contracts/new',  label: 'Nouveau contrat',    desc: '' },
      { href: '/dashboard/projects',       label: 'Projets',            desc: 'Gestion de projets' },
      { href: '/dashboard/projects/new',   label: 'Nouveau projet',     desc: '' },
      { href: '/dashboard/tasks',          label: 'Tâches',             desc: 'Tâches et to-do' },
      { href: '/dashboard/my-tasks',       label: 'Mes tâches',         desc: 'Tâches assignées à vous' },
    ],
  },
  {
    title: 'Finance',
    links: [
      { href: '/dashboard/invoices',        label: 'Factures clients',         desc: '' },
      { href: '/dashboard/invoices/new',    label: 'Nouvelle facture',         desc: '' },
      { href: '/dashboard/supplier-contracts',     label: 'Contrats fournisseurs', desc: '' },
      { href: '/dashboard/supplier-invoices',      label: 'Factures fournisseurs', desc: '' },
      { href: '/dashboard/purchase-orders',        label: 'Bons de commande',      desc: '' },
    ],
  },
  {
    title: 'Outils internes',
    links: [
      { href: '/dashboard/wiki',              label: 'Wiki',                    desc: 'Base de connaissance interne' },
    ],
  },
]

export default function SitemapPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white antialiased">
      <header className="border-b border-white/5 bg-slate-950">
        <div className="max-w-4xl mx-auto px-5 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center group-hover:bg-primary/80 transition-colors">
              <Zap className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            <span className="text-white font-semibold text-sm">MoonDust ERP</span>
          </Link>
          <Link href="/" className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Retour
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-white mb-2">Plan du site</h1>
          <p className="text-slate-400 text-sm">Toutes les pages de MoonDust ERP classées par section.</p>
        </div>

        <div className="space-y-8">
          {SECTIONS.map(section => (
            <div key={section.title}>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-primary mb-3">{section.title}</h2>
              <div className="rounded-2xl border border-white/5 overflow-hidden">
                {section.links.map((link, i) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center justify-between px-5 py-3.5 hover:bg-white/5 transition-colors ${i > 0 ? 'border-t border-white/5' : ''}`}
                  >
                    <div>
                      <span className="text-sm text-slate-200 font-medium">{link.label}</span>
                      {link.desc && <span className="text-xs text-slate-500 ml-2">— {link.desc}</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-slate-600">{link.href}</span>
                      <ExternalLink className="w-3 h-3 text-slate-600" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>

      <footer className="border-t border-white/5 py-8 px-5 mt-8">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <span>© {new Date().getFullYear()} Haloweenlife co. — MoonDust ERP</span>
          <div className="flex items-center gap-4">
            <Link href="/terms"   className="hover:text-slate-400 transition-colors">CGU / CGV</Link>
            <Link href="/privacy" className="hover:text-slate-400 transition-colors">Confidentialité</Link>
            <Link href="/"        className="hover:text-slate-400 transition-colors">Accueil</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
