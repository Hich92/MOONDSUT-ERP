import { redirect } from 'next/navigation'
import { getToken }  from '@/lib/auth'
import Link          from 'next/link'
import type { Metadata } from 'next'
import {
  Zap, ArrowRight, FileText, Target, FolderKanban,
  Users, CheckSquare, Receipt, Shield, BarChart3,
  Building2, Clock, Sparkles, Lock, Check, ChevronRight,
  Globe, Map, BookOpen,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'MoonDust ERP — Logiciel ERP/CRM pour PME · Gratuit en phase Alpha',
  description: 'MoonDust ERP est un logiciel ERP/CRM conçu pour les PME françaises. Gérez vos contrats, contacts, projets, tâches et factures. Accès BASIC gratuit. Rollout officiel septembre 2026.',
}

export default function LandingPage() {
  const token = getToken()
  if (token) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-slate-950 text-white antialiased">

      {/* ══ HEADER ══════════════════════════════════════════════════ */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0 group-hover:bg-primary/80 transition-colors">
              <Zap className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-white font-semibold text-base tracking-tight">MoonDust</span>
            <span className="text-slate-500 text-sm hidden sm:inline">ERP</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm text-slate-400">
            <a href="#modules"     className="hover:text-white transition-colors">Modules</a>
            <a href="#tarifs"      className="hover:text-white transition-colors">Tarifs</a>
            <a href="#roadmap"     className="hover:text-white transition-colors">Roadmap</a>
            <a href="#faq"         className="hover:text-white transition-colors">FAQ</a>
          </nav>

          <div className="flex items-center gap-2">
            <Link href="/login"  className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors">
              Se connecter
            </Link>
            <Link href="/signup" className="px-4 py-2 text-sm font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
              Commencer gratuitement
            </Link>
          </div>
        </div>
      </header>

      {/* ══ HERO ════════════════════════════════════════════════════ */}
      <section className="relative pt-32 pb-24 px-5 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-20 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative">
          {/* Alpha badge */}
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold px-4 py-1.5 rounded-full mb-5">
            <Sparkles className="w-3 h-3" />
            Phase Alpha · Accès gratuit · Rollout officiel septembre 2026
          </div>

          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight leading-tight mb-6">
            L'ERP qui s'adapte{' '}
            <span className="text-primary">aux PME</span>
          </h1>

          <p className="text-slate-400 text-lg sm:text-xl leading-relaxed max-w-2xl mx-auto mb-4">
            Gérez vos contrats, opportunités, projets et factures depuis une plateforme unifiée.
            Conçu pour les équipes de 1 à 50 personnes, sans complexité inutile.
          </p>
          <p className="text-slate-500 text-sm mb-10">
            Nous sommes en phase alpha et le rollout officiel est prévu pour septembre 2026.{' '}
            <span className="text-amber-400 font-medium">Accès BASIC 100% gratuit pendant toute la phase de test.</span>
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/signup"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 text-sm font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
            >
              Commencer gratuitement <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 text-sm font-medium rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 hover:text-white transition-all"
            >
              J'ai déjà un compte
            </Link>
          </div>
        </div>

        {/* Dashboard preview */}
        <div className="max-w-5xl mx-auto mt-16 relative">
          <div className="rounded-2xl border border-white/10 bg-slate-900 overflow-hidden shadow-2xl shadow-black/50">
            <div className="flex items-center gap-1.5 px-4 py-3 bg-slate-800 border-b border-white/5">
              <div className="w-3 h-3 rounded-full bg-red-500/60" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
              <div className="w-3 h-3 rounded-full bg-green-500/60" />
              <div className="flex-1 mx-4 h-5 rounded bg-slate-700 flex items-center px-3">
                <span className="text-slate-500 text-[10px]">portal.moondust.cloud/dashboard</span>
              </div>
            </div>
            <div className="p-5 grid grid-cols-4 gap-3">
              {[
                { label: 'Contrats',     value: '24', color: 'text-blue-400',    bg: 'bg-blue-500/20' },
                { label: 'Opportunités', value: '47', color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
                { label: 'Projets',      value: '12', color: 'text-violet-400',  bg: 'bg-violet-500/20' },
                { label: 'Tâches',       value: '38', color: 'text-amber-400',   bg: 'bg-amber-500/20' },
              ].map(card => (
                <div key={card.label} className="rounded-lg bg-slate-800 border border-white/5 p-3">
                  <p className="text-slate-500 text-[10px] uppercase tracking-wider mb-1">{card.label}</p>
                  <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
                  <div className={`mt-2 h-1 rounded-full ${card.bg}`} style={{ width: '60%' }} />
                </div>
              ))}
            </div>
            <div className="px-5 pb-5">
              <div className="rounded-lg bg-slate-800 border border-white/5 overflow-hidden">
                <div className="px-4 py-2 border-b border-white/5 flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-slate-700" />
                  <div className="w-24 h-2 rounded bg-slate-700" />
                  <div className="ml-auto w-16 h-2 rounded bg-primary/30" />
                </div>
                {[1,2,3,4].map(i => (
                  <div key={i} className="px-4 py-2.5 border-b border-white/5 flex items-center gap-3">
                    <div className="w-3 h-3 rounded border border-slate-600" />
                    <div className="w-32 h-2 rounded bg-slate-700" />
                    <div className="w-20 h-2 rounded bg-slate-700" />
                    <div className="w-16 h-2 rounded bg-emerald-500/30 ml-auto" />
                    <div className="w-5 h-5 rounded bg-slate-700" />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-3/4 h-16 bg-primary/10 blur-2xl pointer-events-none" />
        </div>
      </section>

      {/* ══ MODULES ════════════════════════════════════════════════ */}
      <section id="modules" className="bg-slate-900 py-20 px-5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-primary text-sm font-semibold uppercase tracking-wider mb-3">Modules métier</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">Tout ce dont votre PME a besoin</h2>
            <p className="text-slate-400 mt-4 max-w-xl mx-auto">
              Six modules interconnectés qui couvrent l'ensemble du cycle commercial, de la prospection à la facturation.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {MODULES.map(m => (
              <div key={m.label}
                className="group relative rounded-2xl border border-white/5 bg-slate-800/60 p-6 hover:bg-slate-800 hover:border-white/10 transition-all duration-200">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-5 ${m.iconBg}`}>
                  <m.icon className={`w-5 h-5 ${m.iconColor}`} />
                </div>
                <h3 className="text-white font-semibold text-base mb-2">{m.label}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{m.desc}</p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {m.tags.map(t => (
                    <span key={t} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/5 text-slate-400 border border-white/5">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ POURQUOI PME ══════════════════════════════════════════ */}
      <section className="py-20 px-5 bg-slate-950">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-primary text-sm font-semibold uppercase tracking-wider mb-3">Pensé pour les PME</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">Pourquoi MoonDust ERP ?</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              { icon: Building2, title: 'Conçu pour 1 à 50 personnes', desc: 'Pas de licence par siège cachée, pas de modules inutiles. Un ERP à taille humaine qui grandit avec vous.' },
              { icon: Zap,       title: 'Opérationnel en minutes', desc: 'Inscrivez-vous, connectez-vous, commencez. Aucune installation, aucun paramétrage complexe requis.' },
              { icon: Shield,    title: 'Données hébergées en Europe', desc: 'Votre infrastructure reste sous votre contrôle. Architecture API-first, conforme RGPD.' },
            ].map(f => (
              <div key={f.title} className="text-center">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <f.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-white font-semibold mb-2">{f.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ TARIFS ════════════════════════════════════════════════ */}
      <section id="tarifs" className="py-20 px-5 bg-slate-900 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold px-4 py-1.5 rounded-full mb-5">
              <Sparkles className="w-3 h-3" />
              Phase Alpha — tous les accès sont gratuits jusqu'en septembre 2026
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">Plans tarifaires</h2>
            <p className="text-slate-400 mt-3 max-w-xl mx-auto">
              Commencez gratuitement avec le plan BASIC. Les plans payants arrivent en septembre 2026.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {/* BASIC */}
            <div className="rounded-2xl border border-white/10 bg-slate-800/60 p-7 flex flex-col">
              <div className="mb-5">
                <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-semibold px-2.5 py-1 rounded-full mb-3">
                  <Check className="w-3 h-3" /> Disponible maintenant
                </div>
                <h3 className="text-xl font-bold text-white">BASIC</h3>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-white">Gratuit</span>
                </div>
                <p className="text-slate-400 text-sm mt-1">Pour toujours sur le plan de base</p>
              </div>
              <ul className="space-y-2.5 flex-1 mb-6">
                {BASIC_FEATURES.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-slate-300">
                    <Check className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors"
              >
                Commencer gratuitement <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* PRO */}
            <div className="rounded-2xl border border-primary/30 bg-slate-800/80 p-7 flex flex-col relative overflow-hidden">
              <div className="absolute top-0 right-0 left-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent" />
              <div className="mb-5">
                <div className="inline-flex items-center gap-1.5 bg-slate-700 border border-white/10 text-slate-400 text-[10px] font-semibold px-2.5 py-1 rounded-full mb-3">
                  <Clock className="w-3 h-3" /> Septembre 2026
                </div>
                <h3 className="text-xl font-bold text-white">PRO</h3>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-white">À venir</span>
                </div>
                <p className="text-slate-400 text-sm mt-1">Pour les équipes en croissance</p>
              </div>
              <ul className="space-y-2.5 flex-1 mb-6">
                {PRO_FEATURES.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-slate-400">
                    <ChevronRight className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <button disabled className="w-full inline-flex items-center justify-center px-5 py-3 rounded-xl bg-slate-700 text-slate-400 font-semibold text-sm cursor-not-allowed">
                Bientôt disponible
              </button>
            </div>

            {/* FULL */}
            <div className="rounded-2xl border border-white/5 bg-slate-800/40 p-7 flex flex-col">
              <div className="mb-5">
                <div className="inline-flex items-center gap-1.5 bg-slate-700 border border-white/10 text-slate-400 text-[10px] font-semibold px-2.5 py-1 rounded-full mb-3">
                  <Clock className="w-3 h-3" /> Septembre 2026
                </div>
                <h3 className="text-xl font-bold text-white">FULL</h3>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-white">À venir</span>
                </div>
                <p className="text-slate-400 text-sm mt-1">Pour les entreprises exigeantes</p>
              </div>
              <ul className="space-y-2.5 flex-1 mb-6">
                {FULL_FEATURES.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-slate-400">
                    <ChevronRight className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <button disabled className="w-full inline-flex items-center justify-center px-5 py-3 rounded-xl bg-slate-700 text-slate-400 font-semibold text-sm cursor-not-allowed">
                Bientôt disponible
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ══ ROADMAP ═══════════════════════════════════════════════ */}
      <section id="roadmap" className="py-20 px-5 bg-slate-950 border-t border-white/5">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-primary text-sm font-semibold uppercase tracking-wider mb-3">Roadmap</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">Ce qui arrive bientôt</h2>
          </div>
          <div className="space-y-4">
            {ROADMAP.map((item, i) => (
              <div key={i} className={`flex gap-4 p-5 rounded-2xl border ${item.active ? 'bg-primary/5 border-primary/20' : 'bg-slate-900 border-white/5'}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${item.active ? 'bg-primary/15' : 'bg-slate-800'}`}>
                  <item.icon className={`w-5 h-5 ${item.active ? 'text-primary' : 'text-slate-500'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-white font-semibold text-sm">{item.title}</h3>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${item.active ? 'bg-emerald-500/15 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>
                      {item.when}
                    </span>
                  </div>
                  <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FAQ ═══════════════════════════════════════════════════ */}
      <section id="faq" className="py-20 px-5 bg-slate-900 border-t border-white/5">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-white">Questions fréquentes</h2>
          </div>
          <div className="space-y-4">
            {FAQ.map((item, i) => (
              <div key={i} className="rounded-2xl border border-white/8 bg-slate-800/50 p-6">
                <h3 className="text-white font-semibold mb-2">{item.q}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CTA FINAL ════════════════════════════════════════════ */}
      <section className="py-20 px-5 bg-slate-950 border-t border-white/5">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Zap className="w-7 h-7 text-primary" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">Prêt à démarrer ?</h2>
          <p className="text-slate-400 mb-8">
            Rejoignez les premiers utilisateurs de MoonDust ERP. Accès BASIC gratuit, sans carte bancaire.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/signup" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 text-sm font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all">
              Créer un compte gratuit <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/login" className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 text-sm font-medium rounded-xl border border-white/10 text-slate-300 hover:text-white hover:bg-white/5 transition-all">
              Se connecter
            </Link>
          </div>
        </div>
      </section>

      {/* ══ FOOTER ═══════════════════════════════════════════════ */}
      <footer className="bg-slate-950 border-t border-white/5 py-10 px-5">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
                  <Zap className="w-3.5 h-3.5 text-primary-foreground" />
                </div>
                <span className="text-slate-300 font-semibold text-sm">MoonDust ERP</span>
              </div>
              <p className="text-slate-500 text-xs leading-relaxed">
                Logiciel ERP/CRM pour PME françaises. Phase alpha — rollout officiel septembre 2026.
              </p>
            </div>
            <div>
              <p className="text-slate-400 font-semibold text-xs uppercase tracking-wider mb-3">Produit</p>
              <div className="space-y-2">
                <a href="#modules"  className="block text-slate-500 text-xs hover:text-slate-300 transition-colors">Modules</a>
                <a href="#tarifs"   className="block text-slate-500 text-xs hover:text-slate-300 transition-colors">Tarifs</a>
                <a href="#roadmap"  className="block text-slate-500 text-xs hover:text-slate-300 transition-colors">Roadmap</a>
              </div>
            </div>
            <div>
              <p className="text-slate-400 font-semibold text-xs uppercase tracking-wider mb-3">Compte</p>
              <div className="space-y-2">
                <Link href="/login"  className="block text-slate-500 text-xs hover:text-slate-300 transition-colors">Se connecter</Link>
                <Link href="/signup" className="block text-slate-500 text-xs hover:text-slate-300 transition-colors">S'inscrire</Link>
                <Link href="/forgot-password" className="block text-slate-500 text-xs hover:text-slate-300 transition-colors">Mot de passe oublié</Link>
              </div>
            </div>
            <div>
              <p className="text-slate-400 font-semibold text-xs uppercase tracking-wider mb-3">Légal</p>
              <div className="space-y-2">
                <Link href="/terms"   className="block text-slate-500 text-xs hover:text-slate-300 transition-colors">CGU / CGV</Link>
                <Link href="/privacy" className="block text-slate-500 text-xs hover:text-slate-300 transition-colors">Politique de confidentialité</Link>
                <Link href="/sitemap" className="block text-slate-500 text-xs hover:text-slate-300 transition-colors">Plan du site</Link>
              </div>
            </div>
          </div>
          <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-slate-600 text-xs">
              © {new Date().getFullYear()} Haloweenlife co. — Tous droits réservés
            </p>
            <div className="flex items-center gap-1 text-xs text-slate-600">
              <Lock className="w-3 h-3" />
              <span>Données hébergées en Europe</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

// ── Data ────────────────────────────────────────────────────────

const MODULES = [
  { label: 'Contrats',     icon: FileText,      iconColor: 'text-blue-400',    iconBg: 'bg-blue-500/10',    desc: "Suivez le cycle de vie complet de vos contrats. Alertes d'échéance, renouvellements et suivi de valeur.",      tags: ['Cycle de vie', 'Alertes', 'Valeur'] },
  { label: 'Opportunités', icon: Target,        iconColor: 'text-emerald-400', iconBg: 'bg-emerald-500/10', desc: "Pipeline CRM complet. De la qualification au closing, visualisez votre entonnoir commercial.",               tags: ['Pipeline', 'Probabilité', 'Closing'] },
  { label: 'Projets',      icon: FolderKanban,  iconColor: 'text-violet-400',  iconBg: 'bg-violet-500/10',  desc: "Pilotez vos projets avec jalons, budgets et suivi d'avancement en temps réel.",                            tags: ['Jalons', 'Budget', 'Avancement'] },
  { label: 'Contacts',     icon: Users,         iconColor: 'text-orange-400',  iconBg: 'bg-orange-500/10',  desc: "Annuaire centralisé de vos clients, partenaires et fournisseurs avec historique complet.",                  tags: ['Clients', 'Partenaires', 'Historique'] },
  { label: 'Tâches',       icon: CheckSquare,   iconColor: 'text-cyan-400',    iconBg: 'bg-cyan-500/10',    desc: "Assignez, priorisez et suivez l'avancement de toutes vos tâches opérationnelles.",                        tags: ['Assignation', 'Priorité', 'Suivi'] },
  { label: 'Factures',     icon: Receipt,       iconColor: 'text-rose-400',    iconBg: 'bg-rose-500/10',    desc: "Émettez et suivez vos factures. Tableau de bord des paiements reçus et en attente.",                      tags: ['Émission', 'Paiement', 'Suivi'] },
]

const BASIC_FEATURES = [
  'Contacts & partenaires illimités',
  "CRM — pipeline d'opportunités",
  'Gestion de contrats',
  'Projets & tâches',
  'Factures clients',
  'Contrats & factures fournisseurs',
  'Wiki interne',
  'Tableaux de bord temps réel',
  'Accès web (tous appareils)',
]

const PRO_FEATURES = [
  'Tout le plan BASIC',
  'Sauvegarde quotidienne automatique',
  'Charte graphique personnalisée',
  'Module produits & services',
  'Génération de devis et factures PDF',
  "Interaction clients depuis l'interface",
  'Support prioritaire',
]

const FULL_FEATURES = [
  'Tout le plan PRO',
  'Multi-utilisateurs + rôles avancés',
  'Dashboard personnalisable',
  'Intégrations tierces (API)',
  'Rapport & export avancés',
  'SLA garanti',
  "Accompagnement à l'onboarding",
]

const ROADMAP = [
  { icon: Zap,       title: 'Phase Alpha — en cours',                 when: 'Maintenant', active: true,  desc: "Accès libre à l'ensemble des modules BASIC. Retours utilisateurs bienvenus." },
  { icon: BarChart3, title: 'Module Dashboard avancé',                when: 'T3 2026',    active: false, desc: 'Widgets personnalisables, graphiques avancés, alertes configurables.' },
  { icon: FileText,  title: 'Génération de devis & factures PDF',     when: 'T3 2026',    active: false, desc: "Création de documents professionnels directement depuis l'interface." },
  { icon: Building2, title: 'Charte graphique par entreprise',        when: 'Sept. 2026', active: false, desc: "Logo, couleurs et personnalisation complète de l'interface selon votre identité." },
  { icon: Shield,    title: 'Sauvegarde quotidienne (plans payants)', when: 'Sept. 2026', active: false, desc: 'Sauvegardes automatiques et restauration ponctuelle pour les plans PRO et FULL.' },
  { icon: Globe,     title: 'Rollout officiel — Plans PRO & FULL',    when: 'Sept. 2026', active: false, desc: 'Lancement des abonnements payants, paiement en ligne, et intégrations avancées.' },
]

const FAQ = [
  { q: 'Le plan BASIC est-il vraiment gratuit pour toujours ?', a: "Oui. Le plan BASIC restera gratuit après le lancement officiel. Il couvre l'ensemble des fonctionnalités actuellement disponibles. Les plans payants (PRO et FULL) apporteront des fonctionnalités supplémentaires." },
  { q: 'Puis-je utiliser MoonDust ERP dès maintenant ?', a: "Absolument. Créez votre compte en quelques secondes et accédez immédiatement à tous les modules. Nous sommes en phase alpha, donc certaines fonctionnalités sont encore en cours de développement." },
  { q: 'Quand seront disponibles les plans PRO et FULL ?', a: "Le rollout officiel est prévu pour septembre 2026. Vous serez notifié(e) par e-mail en priorité si vous avez déjà un compte." },
  { q: 'Mes données sont-elles sécurisées ?', a: "Oui. L'architecture est API-first avec authentification par token. Les données sont hébergées sur des serveurs en Europe. Les plans payants incluront des sauvegardes quotidiennes." },
  { q: 'MoonDust ERP est-il adapté à mon secteur ?', a: "MoonDust ERP est généraliste et convient à tout secteur d'activité employant de 1 à 50 personnes : commerce, conseil, services, BTP, agences, etc." },
]
