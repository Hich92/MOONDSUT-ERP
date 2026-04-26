import {
  Zap, Building2, Mail, Shield, TrendingUp,
  Users, FileText, FolderKanban, CheckSquare, Receipt,
  Globe, Lock,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'

const FEATURES = [
  { icon: Building2,    label: 'CRM',           desc: 'Sociétés, contacts, opportunités et pipeline commercial en temps réel.' },
  { icon: FolderKanban, label: 'Projets',        desc: "Suivi de l'avancement, jalons et budgets alloués par projet." },
  { icon: CheckSquare,  label: 'Tâches',         desc: 'Gestion des tâches internes et actions liées aux projets.' },
  { icon: FileText,     label: 'Contrats',       desc: 'Cycle de vie complet des contrats clients et fournisseurs.' },
  { icon: Receipt,      label: 'Facturation',    desc: 'Émission de factures, suivi des paiements et relances.' },
  { icon: Users,        label: 'Collaboration',  desc: 'Wiki interne, activités, notes et historique partagé.' },
]

const REASONS = [
  {
    icon: Lock,
    title: 'Solution propriétaire & souveraine',
    body: 'Logiciel propriétaire hébergé sur votre infrastructure. Vos données ne quittent jamais vos serveurs — sans dépendance à des services cloud tiers.',
  },
  {
    icon: TrendingUp,
    title: 'Modulaire & scalable',
    body: "Activez uniquement les modules dont vous avez besoin. La plateforme s'adapte à votre croissance sans contrainte technique.",
  },
  {
    icon: Globe,
    title: 'Multi-langues',
    body: 'Interface disponible en français et en anglais, conçue pour les équipes internationales.',
  },
  {
    icon: Shield,
    title: 'Support & maintenance',
    body: 'Maintenu et mis à jour par Haloweenlife co. — contrat de support disponible pour les déploiements en production.',
  },
]

export default function InformationsPage() {
  return (
    <div className="flex flex-col min-h-full">

      {/* Header */}
      <header className="px-6 py-5 border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <h1 className="page-heading">À propos de MoonDust ERP</h1>
        <p className="page-subheading">Plateforme de gestion d'entreprise — éditeur Haloweenlife co.</p>
      </header>

      <div className="flex-1 p-6 space-y-10 max-w-4xl">

        {/* Hero */}
        <section className="rounded-2xl border bg-gradient-to-br from-primary/5 to-primary/10 p-8 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shadow">
              <Zap className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <span className="text-2xl font-bold text-foreground">MoonDust ERP</span>
              <Badge variant="secondary" className="ml-3 text-xs">v1.0</Badge>
            </div>
          </div>
          <p className="text-base text-muted-foreground leading-relaxed">
            MoonDust ERP est une plateforme de gestion d'entreprise complète, conçue pour centraliser
            vos processus métier dans une interface moderne et intuitive. Elle couvre le CRM, la gestion
            de projets, la facturation, le juridique et la collaboration interne — sans dépendance à des
            services cloud tiers.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Développée et maintenue exclusivement par <strong className="text-foreground">Haloweenlife co.</strong>,
            cette solution est réservée aux organisations clientes disposant d'une licence valide.
            Toute reproduction, redistribution ou modification sans autorisation expresse est interdite.
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="text-xs">Logiciel propriétaire</Badge>
            <Badge variant="outline" className="text-xs">© 2025 Haloweenlife co.</Badge>
            <Badge variant="outline" className="text-xs">Tous droits réservés</Badge>
          </div>
        </section>

        {/* Fonctionnalités */}
        <section>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">Fonctionnalités</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {FEATURES.map(f => {
              const Icon = f.icon
              return (
                <div key={f.label} className="flex items-start gap-4 rounded-xl border bg-card p-5 shadow-sm">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground mb-0.5">{f.label}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Pourquoi adopter */}
        <section>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">Pourquoi l'adopter ?</p>
          <div className="flex flex-col gap-3">
            {REASONS.map(r => {
              const Icon = r.icon
              return (
                <div key={r.title} className="flex items-start gap-4 rounded-xl border bg-card p-5 shadow-sm">
                  <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground mb-0.5">{r.title}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{r.body}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* CTA Contact */}
        <section className="rounded-2xl border-2 border-primary/20 bg-primary/5 p-8">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
              <Mail className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-foreground mb-2">Support & assistance</h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                Pour toute question technique, demande de fonctionnalité ou renouvellement de licence,
                contactez directement l'équipe Haloweenlife co. Notre équipe est disponible pour vous
                accompagner dans votre déploiement et l'évolution de la plateforme.
              </p>
              <a
                href="mailto:contact@haloweenlife.co"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Mail className="w-4 h-4" />
                Contacter Haloweenlife co.
              </a>
            </div>
          </div>
        </section>

        {/* Footer info */}
        <section className="border-t pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">MoonDust ERP</span>
            <span className="text-xs text-muted-foreground">— par Haloweenlife co.</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <Badge variant="outline" className="text-[10px]">Propriétaire</Badge>
          </div>
        </section>

      </div>
    </div>
  )
}
