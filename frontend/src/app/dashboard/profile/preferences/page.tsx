'use client'

import { useState } from 'react'
import { usePreferences } from '@/components/providers/PreferencesProvider'
import { useTranslation } from '@/hooks/use-translation'
import type { AccentColor, ColorMode, Locale } from '@/lib/preferences'
import { Sun, Moon, Monitor, Check, Globe, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

// ── Section wrapper ───────────────────────────────────────────────

function Section({ title, description, children }: {
  title: string; description?: string; children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border bg-card p-6 space-y-4">
      <div>
        <h2 className="font-semibold text-base">{title}</h2>
        {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
      </div>
      {children}
    </div>
  )
}

// ── Account section ───────────────────────────────────────────────

function AccountSection() {
  const t = useTranslation()
  const [name,            setName]            = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword,     setNewPassword]     = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving,   setSaving]   = useState(false)
  const [message,  setMessage]  = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  async function handleSave() {
    if (newPassword && newPassword !== confirmPassword) {
      setMessage({ type: 'err', text: t('prefs.password_mismatch') })
      return
    }
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName:     name || undefined,
          currentPassword: currentPassword || undefined,
          newPassword:     newPassword || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        setMessage({ type: 'err', text: data.error ?? 'Error' })
      } else {
        setMessage({ type: 'ok', text: t('prefs.account_saved') })
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      }
    } catch {
      setMessage({ type: 'err', text: 'Network error' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Section title={t('prefs.account')} description={t('prefs.account_desc')}>
      <div className="space-y-3">
        <div>
          <label className="field-label mb-1.5 block">{t('prefs.display_name')}</label>
          <Input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Votre nom affiché"
            className="max-w-sm"
          />
        </div>

        <div className="border-t pt-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            {t('prefs.change_password')}
          </p>
          <div className="space-y-2 max-w-sm">
            <div>
              <label className="field-label mb-1.5 block">{t('prefs.current_password')}</label>
              <Input
                type="password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>
            <div>
              <label className="field-label mb-1.5 block">{t('prefs.new_password')}</label>
              <Input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>
            <div>
              <label className="field-label mb-1.5 block">{t('prefs.confirm_password')}</label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>
          </div>
        </div>

        {message && (
          <p className={`text-sm ${message.type === 'ok' ? 'text-emerald-600' : 'text-destructive'}`}>
            {message.text}
          </p>
        )}

        <Button
          onClick={handleSave}
          disabled={saving || (!name && !currentPassword && !newPassword)}
          className="action-btn-primary"
        >
          {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          {saving ? t('common.saving') : t('prefs.save_account')}
        </Button>
      </div>
    </Section>
  )
}

// ── Page ─────────────────────────────────────────────────────────

export default function PreferencesPage() {
  const { prefs, setPrefs } = usePreferences()
  const t = useTranslation()

  const MODES: { id: ColorMode; label: string; icon: React.ElementType }[] = [
    { id: 'light',  label: t('prefs.light'),  icon: Sun     },
    { id: 'dark',   label: t('prefs.dark'),   icon: Moon    },
    { id: 'system', label: t('prefs.system'), icon: Monitor },
  ]

  const ACCENTS: { id: AccentColor; label: string; cls: string; ring: string }[] = [
    { id: 'yellow',  label: 'Yellow',   cls: 'bg-yellow-400',  ring: 'ring-yellow-400'  },
    { id: 'emerald', label: 'Emerald',  cls: 'bg-emerald-500', ring: 'ring-emerald-500' },
    { id: 'teal',    label: 'Teal',     cls: 'bg-teal-500',    ring: 'ring-teal-500'    },
    { id: 'blue',    label: 'Blue',     cls: 'bg-blue-500',    ring: 'ring-blue-500'    },
    { id: 'violet',  label: 'Violet',   cls: 'bg-violet-500',  ring: 'ring-violet-500'  },
    { id: 'rose',    label: 'Rose',     cls: 'bg-rose-500',    ring: 'ring-rose-500'    },
  ]

  const LANGUAGES: { id: Locale; label: string; flag: string }[] = [
    { id: 'en', label: t('prefs.lang_en'), flag: '🇬🇧' },
    { id: 'fr', label: t('prefs.lang_fr'), flag: '🇫🇷' },
  ]

  return (
    <div className="p-6 max-w-2xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">{t('prefs.title')}</h1>
        <p className="text-muted-foreground text-sm mt-1">{t('prefs.subtitle')}</p>
      </div>

      {/* Account */}
      <AccountSection />

      {/* Language */}
      <Section title={t('prefs.language')} description={t('prefs.language_desc')}>
        <div className="flex gap-3">
          {LANGUAGES.map(({ id, label, flag }) => {
            const active = prefs.language === id
            return (
              <button
                key={id}
                onClick={() => setPrefs({ language: id })}
                className={`
                  flex flex-1 items-center justify-center gap-2.5 rounded-lg border-2 p-4 text-sm font-medium
                  transition-colors cursor-pointer
                  ${active
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border hover:border-primary/40 text-muted-foreground hover:text-foreground'
                  }
                `}
              >
                <Globe className="h-4 w-4" />
                <span className="text-base">{flag}</span>
                {label}
                {active && <Check className="h-4 w-4 ml-auto" />}
              </button>
            )
          })}
        </div>
      </Section>

      {/* Appearance */}
      <Section title={t('prefs.appearance')} description={t('prefs.appearance_desc')}>
        <div className="flex gap-3">
          {MODES.map(({ id, label, icon: Icon }) => {
            const active = prefs.colorMode === id
            return (
              <button
                key={id}
                onClick={() => setPrefs({ colorMode: id })}
                className={`
                  flex flex-1 flex-col items-center gap-2 rounded-lg border-2 p-4 text-sm font-medium
                  transition-colors cursor-pointer
                  ${active
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border hover:border-primary/40 text-muted-foreground hover:text-foreground'
                  }
                `}
              >
                <Icon className="h-5 w-5" />
                {label}
              </button>
            )
          })}
        </div>
      </Section>

      {/* Accent color */}
      <Section title={t('prefs.accent')} description={t('prefs.accent_desc')}>
        <div className="flex flex-wrap gap-3">
          {ACCENTS.map(({ id, label, cls, ring }) => {
            const active = prefs.accentColor === id
            return (
              <button
                key={id}
                onClick={() => setPrefs({ accentColor: id })}
                title={label}
                className={`
                  relative flex items-center justify-center
                  h-9 w-9 rounded-full transition-all cursor-pointer
                  ${cls}
                  ${active ? `ring-2 ring-offset-2 ring-offset-background ${ring} scale-110` : 'hover:scale-105'}
                `}
              >
                {active && <Check className="h-4 w-4 text-white stroke-[3]" />}
              </button>
            )
          })}
        </div>
        <p className="text-xs text-muted-foreground">
          {t('prefs.current_color')} : <span className="font-medium capitalize">{prefs.accentColor}</span>
        </p>
      </Section>

      {/* Notifications */}
      <Section title={t('prefs.notifications')} description={t('prefs.notifications_desc')}>
        <p className="text-sm text-muted-foreground italic">{t('prefs.coming_soon')}</p>
      </Section>
    </div>
  )
}
