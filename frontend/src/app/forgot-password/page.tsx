'use client'
import { useState, FormEvent } from 'react'
import Link from 'next/link'
import { Zap, AlertCircle, CheckCircle, Loader2, Mail } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email,   setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [done,    setDone]    = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true); setError(null)
    try {
      await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      setDone(true)
    } catch {
      setError('Impossible de joindre le serveur. Réessayez.')
    } finally {
      setLoading(false)
    }
  }

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
          <Link href="/login" className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white border border-white/10 rounded-lg transition-colors">
            Se connecter
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-5 pt-16">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/15 border border-primary/30 mb-4">
              <Mail className="w-7 h-7 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-white">Mot de passe oublié</h1>
            <p className="text-slate-400 text-sm mt-1">Entrez votre adresse e-mail pour recevoir un lien de réinitialisation.</p>
          </div>

          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-8">
            {done ? (
              <div className="text-center py-4">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-500/20 border border-green-500/30 mb-4">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                </div>
                <p className="text-white font-semibold mb-2">E-mail envoyé !</p>
                <p className="text-slate-400 text-sm mb-6">
                  Si un compte existe pour <span className="text-white font-medium">{email}</span>, vous recevrez un lien dans quelques minutes. Pensez à vérifier vos spams.
                </p>
                <Link href="/login" className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 font-medium transition-colors">
                  Retour à la connexion
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Adresse e-mail</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    placeholder="vous@exemple.com"
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary/40 transition-all text-sm"
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
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Envoi en cours…</> : 'Envoyer le lien de réinitialisation'}
                </button>
              </form>
            )}
          </div>

          {!done && (
            <p className="text-center text-sm text-slate-500 mt-6">
              Vous vous souvenez de votre mot de passe ?{' '}
              <Link href="/login" className="text-primary hover:text-primary/80 font-medium transition-colors">
                Se connecter
              </Link>
            </p>
          )}
        </div>
      </main>

      <footer className="py-6 text-center text-xs text-slate-600">
        © {new Date().getFullYear()} MoonDust ERP — Tous droits réservés
      </footer>
    </div>
  )
}
