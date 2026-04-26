'use client'
import { useState, useEffect } from 'react'
import {
  Zap, ArrowRight, X, Users, Target, FileText,
  FolderKanban, CheckSquare, Receipt, Sparkles,
} from 'lucide-react'

const STEPS = [
  {
    icon: Sparkles,
    color: 'text-amber-400',
    bg:   'bg-amber-500/10',
    title: 'Bienvenue sur MoonDust ERP !',
    desc:  'Vous faites partie des premiers utilisateurs à découvrir notre plateforme ERP/CRM en phase alpha. Voici un aperçu rapide de ce qui vous attend.',
    cta:   'Commencer la visite',
  },
  {
    icon: Users,
    color: 'text-orange-400',
    bg:   'bg-orange-500/10',
    title: 'Partenaires & Contacts',
    desc:  'Centralisez tous vos clients, prospects, partenaires et fournisseurs dans un annuaire unifié. Enrichissement automatique via SIREN/SIRENE pour les entreprises françaises.',
    cta:   'Suivant',
    href:  '/dashboard/partners',
    hrefLabel: 'Voir les partenaires',
  },
  {
    icon: Target,
    color: 'text-emerald-400',
    bg:   'bg-emerald-500/10',
    title: 'Pipeline CRM',
    desc:  'Suivez vos opportunités commerciales de la qualification au closing. Visualisez votre entonnoir et ne laissez plus passer aucune occasion.',
    cta:   'Suivant',
    href:  '/dashboard/opportunities',
    hrefLabel: 'Voir les opportunités',
  },
  {
    icon: FileText,
    color: 'text-blue-400',
    bg:   'bg-blue-500/10',
    title: 'Contrats & Factures',
    desc:  'Gérez le cycle de vie complet de vos contrats clients et fournisseurs. Suivez vos factures et vos paiements depuis une interface unifiée.',
    cta:   'Suivant',
    href:  '/dashboard/contracts',
    hrefLabel: 'Voir les contrats',
  },
  {
    icon: FolderKanban,
    color: 'text-violet-400',
    bg:   'bg-violet-500/10',
    title: 'Projets & Tâches',
    desc:  "Pilotez vos projets avec jalons et budgets. Assignez des tâches à votre équipe et suivez l'avancement en temps réel.",
    cta:   'Suivant',
    href:  '/dashboard/projects',
    hrefLabel: 'Voir les projets',
  },
  {
    icon: Zap,
    color: 'text-primary',
    bg:   'bg-primary/10',
    title: 'Vous êtes prêt(e) !',
    desc:  'Votre accès BASIC est actif et 100% gratuit pendant toute la phase alpha. Le rollout officiel avec les plans PRO et FULL est prévu pour septembre 2026.',
    cta:   'Accéder au tableau de bord',
    final: true,
  },
]

const STORAGE_KEY = 'md_onboarding_done'

export function OnboardingModal() {
  const [open,  setOpen]  = useState(false)
  const [step,  setStep]  = useState(0)
  const current = STEPS[step]

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!localStorage.getItem(STORAGE_KEY)) {
      const t = setTimeout(() => setOpen(true), 800)
      return () => clearTimeout(t)
    }
  }, [])

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, '1')
    setOpen(false)
  }

  function next() {
    if (step < STEPS.length - 1) setStep(s => s + 1)
    else dismiss()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        onClick={dismiss}
        aria-hidden
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden">
        {/* Progress bar */}
        <div className="h-0.5 bg-slate-800">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>

        {/* Close */}
        <button
          onClick={dismiss}
          className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/10 transition-all"
          aria-label="Fermer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-8">
          <div className={`w-14 h-14 rounded-2xl ${current.bg} flex items-center justify-center mb-6`}>
            <current.icon className={`w-7 h-7 ${current.color}`} />
          </div>

          <h2 className="text-xl font-bold text-white mb-3">{current.title}</h2>
          <p className="text-slate-400 text-sm leading-relaxed mb-6">{current.desc}</p>

          {/* Step dots */}
          <div className="flex items-center gap-1.5 mb-6">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === step ? 'bg-primary w-5' : i < step ? 'bg-primary/40 w-2.5' : 'bg-slate-700 w-2.5'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-3">
            {'href' in current && current.href && (
              <a
                href={current.href}
                onClick={dismiss}
                className="flex-1 inline-flex items-center justify-center px-4 py-2.5 rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 hover:text-white text-sm font-medium transition-all"
              >
                {(current as { hrefLabel?: string }).hrefLabel}
              </a>
            )}
            <button
              onClick={next}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all"
            >
              {current.cta}
              {!('final' in current && current.final) && <ArrowRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
