'use client'
import { useState, useEffect, useRef, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Zap, AlertCircle, CheckCircle, Loader2, Building2, CheckCircle2, XCircle, Clock, Sparkles } from 'lucide-react'

type SlugState = 'idle' | 'checking' | 'available' | 'taken' | 'invalid'

function useSlugCheck(slug: string, enabled: boolean) {
  const [state, setState] = useState<SlugState>('idle')
  const [message, setMessage] = useState('')
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!enabled || !slug) { setState('idle'); setMessage(''); return }
    setState('checking')
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(async () => {
      try {
        const res  = await fetch(`/api/tenants/check?slug=${encodeURIComponent(slug)}`)
        const data = await res.json() as { available: boolean; error?: string }
        if (data.error)           { setState('invalid');   setMessage(data.error) }
        else if (data.available)  { setState('available'); setMessage(`${slug}.moondust.cloud est disponible`) }
        else                      { setState('taken');     setMessage('Ce sous-domaine est déjà pris.') }
      } catch {
        setState('invalid'); setMessage('Erreur de vérification.')
      }
    }, 500)
    return () => { if (timer.current) clearTimeout(timer.current) }
  }, [slug, enabled])

  return { state, message }
}

function SlugIcon({ state }: { state: SlugState }) {
  if (state === 'checking')  return <Clock       className="w-4 h-4 text-slate-400 animate-pulse" />
  if (state === 'available') return <CheckCircle2 className="w-4 h-4 text-green-400" />
  if (state === 'taken')     return <XCircle     className="w-4 h-4 text-red-400" />
  if (state === 'invalid')   return <XCircle     className="w-4 h-4 text-amber-400" />
  return null
}

export default function SignupPage() {
  const router = useRouter()

  const [name,     setName]     = useState('')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')

  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [wantWorkspace, setWantWorkspace] = useState(false)
  const [slug,          setSlug]          = useState('')
  // Miroir exact de domain_sanitize Saltcorn : supprime tout sauf lettres/chiffres
  const slugRaw = slug.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 32)

  const { state: slugState, message: slugMsg } = useSlugCheck(slugRaw, wantWorkspace)

  const [error,   setError]   = useState<string | null>(null)
  const [success, setSuccess] = useState<null | { url: string | null }>(null)
  const [loading, setLoading] = useState(false)

  const canSubmit =
    !loading &&
    acceptedTerms &&
    (!wantWorkspace || slugState === 'available')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError('Les mots de passe ne correspondent pas.'); return }
    setLoading(true); setError(null)
    try {
      const signupRes  = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })
      const signupData = await signupRes.json() as { success?: boolean; error?: string }
      if (!signupData.success) { setError(signupData.error || 'Erreur lors de la création du compte.'); return }

      if (wantWorkspace && slugRaw) {
        const tenantRes  = await fetch('/api/tenants/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slug: slugRaw, name, email, password }),
        })
        const tenantData = await tenantRes.json() as { success?: boolean; url?: string; error?: string }
        if (!tenantData.success) { setError(tenantData.error || "Erreur lors de la création de l'espace."); return }
        setSuccess({ url: tenantData.url ?? null })
        return
      }

      setSuccess({ url: null })
      setTimeout(() => router.push('/login'), 2500)
    } catch {
      setError('Impossible de joindre le serveur. Réessayez.')
    } finally {
      setLoading(false)
    }
  }

  const inputCls = `w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl
    text-white placeholder-slate-500 focus:outline-none
    focus:ring-2 focus:ring-primary/60 focus:border-primary/40
    transition-all text-sm`

  return (
    <div className="min-h-screen bg-slate-950 text-white antialiased flex flex-col">

      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0 group-hover:bg-primary/80 transition-colors">
              <Zap className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-white font-semibold text-base tracking-tight">MoonDust</span>
            <span className="text-slate-500 text-sm hidden sm:inline">ERP</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400">Déjà un compte ?</span>
            <Link href="/login" className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white border border-white/10 rounded-lg transition-colors">
              Se connecter
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-5 pt-16">
        <div className="w-full max-w-sm">

          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold px-3 py-1 rounded-full mb-4">
              <Sparkles className="w-3 h-3" />
              Phase Alpha · Accès BASIC gratuit
            </div>
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/15 border border-primary/30 mb-4">
              <Zap className="w-7 h-7 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-white">Créer un compte</h1>
            <p className="text-slate-400 text-sm mt-1">Rejoignez les premiers utilisateurs de MoonDust ERP</p>
          </div>

          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-8">

            {success ? (
              <div className="text-center py-4">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-500/20 border border-green-500/30 mb-4">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                </div>
                <p className="text-white font-semibold mb-2">Compte créé !</p>
                {success.url ? (
                  <>
                    <p className="text-slate-400 text-sm mb-4">Votre espace de travail est prêt.</p>
                    <a
                      href={`${success.url}/login`}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                    >
                      <Building2 className="w-4 h-4" />
                      Accéder à {slugRaw}.moondust.cloud
                    </a>
                  </>
                ) : (
                  <p className="text-slate-400 text-sm">Redirection vers la connexion…</p>
                )}
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Nom complet</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)}
                    required autoComplete="name" placeholder="Jean Dupont" className={inputCls} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Adresse e-mail</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    required autoComplete="email" placeholder="vous@exemple.com" className={inputCls} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Mot de passe</label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                    required autoComplete="new-password" placeholder="8 caractères minimum" minLength={8} className={inputCls} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Confirmer le mot de passe</label>
                  <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                    required autoComplete="new-password" placeholder="••••••••" className={inputCls} />
                </div>

                {/* ── Toggle workspace ── */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setWantWorkspace(w => !w)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-sm font-medium ${
                      wantWorkspace
                        ? 'bg-primary/15 border-primary/40 text-primary'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:text-slate-300 hover:border-white/20'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border transition-colors ${
                      wantWorkspace ? 'bg-primary border-primary' : 'border-white/30'
                    }`}>
                      {wantWorkspace && <CheckCircle2 className="w-3.5 h-3.5 text-primary-foreground" />}
                    </div>
                    <Building2 className="w-4 h-4 flex-shrink-0" />
                    Créer un espace de travail dédié
                  </button>
                </div>

                {/* ── Champ sous-domaine ── */}
                {wantWorkspace && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-300">Nom du sous-domaine</label>
                    <div className={`flex items-center rounded-xl overflow-hidden border bg-white/10 transition-all
                      ${slugState === 'available' ? 'border-green-500/50 ring-1 ring-green-500/30'
                        : slugState === 'taken' || slugState === 'invalid' ? 'border-red-500/40'
                        : 'border-white/20 focus-within:ring-2 focus-within:ring-primary/60 focus-within:border-primary/40'}`}>
                      <input
                        type="text"
                        value={slug}
                        onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 32))}
                        placeholder="mon-entreprise"
                        autoComplete="off"
                        spellCheck={false}
                        className="flex-1 px-4 py-3 bg-transparent text-white placeholder-slate-500 focus:outline-none text-sm min-w-0"
                      />
                      <span className="px-3 py-3 text-slate-500 text-xs whitespace-nowrap border-l border-white/10 bg-white/5">
                        .moondust.cloud
                      </span>
                      <span className="px-2.5 flex-shrink-0">
                        <SlugIcon state={slugState} />
                      </span>
                    </div>
                    {slugMsg && (
                      <p className={`text-xs ${
                        slugState === 'available' ? 'text-green-400'
                        : slugState === 'taken'   ? 'text-red-400'
                        : 'text-amber-400'
                      }`}>
                        {slugMsg}
                      </p>
                    )}
                  </div>
                )}

                {/* ── CGU checkbox ── */}
                <div>
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={acceptedTerms}
                      onClick={() => setAcceptedTerms(v => !v)}
                      className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                        acceptedTerms ? 'bg-primary border-primary' : 'border-white/30 bg-white/5 group-hover:border-white/50'
                      }`}
                    >
                      {acceptedTerms && <CheckCircle2 className="w-3.5 h-3.5 text-primary-foreground" />}
                    </button>
                    <span className="text-xs text-slate-400 leading-relaxed">
                      J'ai lu et j'accepte les{' '}
                      <Link href="/terms" target="_blank" className="text-primary hover:underline">
                        Conditions Générales d'Utilisation
                      </Link>{' '}
                      et la{' '}
                      <Link href="/privacy" target="_blank" className="text-primary hover:underline">
                        Politique de confidentialité
                      </Link>
                    </span>
                  </label>
                </div>

                {error && (
                  <div className="bg-red-500/15 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="w-full py-3 rounded-xl font-semibold text-sm bg-primary text-primary-foreground
                             hover:bg-primary/90 transition-all duration-200 disabled:opacity-60
                             flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {wantWorkspace ? "Création de l'espace…" : 'Création du compte…'}
                    </>
                  ) : wantWorkspace ? (
                    <><Building2 className="w-4 h-4" /> Créer mon compte et mon espace</>
                  ) : 'Créer mon compte'}
                </button>
              </form>
            )}
          </div>

          <p className="text-center text-sm text-slate-500 mt-6">
            Déjà un compte ?{' '}
            <Link href="/login" className="text-primary hover:text-primary/80 font-medium transition-colors">
              Se connecter
            </Link>
          </p>
        </div>
      </main>

      <footer className="py-6 text-center text-xs text-slate-600">
        © 2026 MoonDust ERP — Tous droits réservés
      </footer>
    </div>
  )
}
