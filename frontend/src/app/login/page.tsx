'use client'
import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Zap, AlertCircle, Loader2 } from 'lucide-react'
import type { Metadata } from 'next'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState<string | null>(null)
  const [loading, setLoading]   = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (data.success) {
        router.push('/dashboard')
        router.refresh()
      } else {
        setError(data.error || 'Identifiants incorrects.')
      }
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
            <span className="text-sm text-slate-400">Pas encore de compte ?</span>
            <Link
              href="/signup"
              className="px-4 py-2 text-sm font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              S'inscrire
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-5 pt-16">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/15 border border-primary/30 mb-4">
              <Zap className="w-7 h-7 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-white">Connexion</h1>
            <p className="text-slate-400 text-sm mt-1">Accédez à votre espace MoonDust ERP</p>
          </div>

          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Adresse e-mail
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="vous@exemple.com"
                  className={inputCls}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-slate-300">
                    Mot de passe
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-xs text-slate-400 hover:text-primary transition-colors"
                  >
                    Mot de passe oublié ?
                  </Link>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className={inputCls}
                />
              </div>

              {error && (
                <div className="bg-red-500/15 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl font-semibold text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Connexion…</>
                ) : 'Se connecter'}
              </button>
            </form>
          </div>

          <p className="text-center text-sm text-slate-500 mt-6">
            Pas encore de compte ?{' '}
            <Link href="/signup" className="text-primary hover:text-primary/80 font-medium transition-colors">
              Créer un compte gratuit
            </Link>
          </p>
        </div>
      </main>

      <footer className="py-6 text-center text-xs text-slate-600">
        © {new Date().getFullYear()} MoonDust ERP — Tous droits réservés
      </footer>
    </div>
  )
}
