'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Save, Check, AlertCircle, Layers,
  HelpCircle, Users, RefreshCw, Shield,
} from 'lucide-react'
import {
  Tooltip, TooltipContent, TooltipTrigger,
} from '@/components/ui/tooltip'

// ── Types ─────────────────────────────────────────────────────────

type AccessLevel = 'none' | 'read' | 'edit'

interface Permission {
  resource:     string
  access_level: AccessLevel
  own_only:     boolean
}

interface GroupDetail {
  id:          number
  name:        string
  description: string
}

interface TenantUser {
  id:       number
  email:    string
  role_id:  number
  inGroup:  boolean
}

const RESOURCES: { key: string; label: string }[] = [
  { key: 'partners',           label: 'Partenaires'           },
  { key: 'opportunities',      label: 'Opportunités'          },
  { key: 'contracts',          label: 'Contrats clients'      },
  { key: 'projects',           label: 'Projets'               },
  { key: 'tasks',              label: 'Tâches'                },
  { key: 'invoices',           label: 'Factures clients'      },
  { key: 'supplier_contracts', label: 'Contrats fournisseurs' },
  { key: 'purchase_orders',    label: 'Bons de commande'      },
  { key: 'supplier_invoices',  label: 'Factures fournisseurs' },
  { key: 'wiki',               label: 'Wiki'                  },
  { key: 'activities',         label: 'Activités'             },
]

const LEVELS: { value: AccessLevel; label: string }[] = [
  { value: 'none', label: 'Inaccessible' },
  { value: 'read', label: 'Lecture'      },
  { value: 'edit', label: 'Édition'      },
]

// ── Permission row ────────────────────────────────────────────────

function PermRow({
  resource, label, perm, onChange,
}: {
  resource: string
  label:    string
  perm:     Permission
  onChange: (r: string, field: keyof Permission, value: AccessLevel | boolean) => void
}) {
  const active = perm.access_level !== 'none'

  return (
    <tr className="border-b border-white/5 hover:bg-white/2 transition-colors group">
      <td className="py-3 px-4 text-sm text-slate-200 font-medium w-48">{label}</td>

      {/* Radio buttons */}
      <td className="py-3 px-4">
        <div className="flex items-center gap-4">
          {LEVELS.map(lvl => (
            <label key={lvl.value} className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="radio"
                name={`access-${resource}`}
                value={lvl.value}
                checked={perm.access_level === lvl.value}
                onChange={() => onChange(resource, 'access_level', lvl.value)}
                className="accent-primary"
              />
              <span className={`text-xs ${perm.access_level === lvl.value ? 'text-white font-medium' : 'text-slate-500'}`}>
                {lvl.label}
              </span>
            </label>
          ))}
        </div>
      </td>

      {/* own_only checkbox */}
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <label className={`flex items-center gap-2 cursor-pointer select-none ${!active ? 'opacity-30 pointer-events-none' : ''}`}>
            <input
              type="checkbox"
              checked={perm.own_only}
              disabled={!active}
              onChange={e => onChange(resource, 'own_only', e.target.checked)}
              className="accent-primary"
            />
            <span className="text-xs text-slate-400">Que mes créations</span>
          </label>
          <Tooltip delayDuration={400}>
            <TooltipTrigger asChild>
              <HelpCircle className="w-3.5 h-3.5 text-slate-600 hover:text-slate-400 cursor-help flex-shrink-0" />
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs text-xs">
              Si activé, l'utilisateur ne voit et ne modifie que les enregistrements qu'il a créés (ou qui lui sont assignés). Décochez pour donner accès à tous les enregistrements.
            </TooltipContent>
          </Tooltip>
        </div>
      </td>
    </tr>
  )
}

// ── Main page ─────────────────────────────────────────────────────

export default function GroupPermissionsPage({
  params,
}: { params: { id: string } }) {
  const groupId = Number(params.id)

  const [group,       setGroup]       = useState<GroupDetail | null>(null)
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [users,       setUsers]       = useState<TenantUser[]>([])
  const [dirty,       setDirty]       = useState(false)
  const [saving,      setSaving]      = useState(false)
  const [flash,       setFlash]       = useState<string | null>(null)
  const [error,       setError]       = useState<string | null>(null)
  const [loading,     setLoading]     = useState(true)

  function showFlash(msg: string) {
    setFlash(msg); setTimeout(() => setFlash(null), 2500)
  }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [gRes, pRes, uRes, mRes] = await Promise.all([
        fetch(`/api/tenant-admin/groups/${groupId}`),
        fetch(`/api/tenant-admin/groups/${groupId}/permissions`),
        fetch('/api/tenant-admin/users'),
        fetch(`/api/tenant-admin/groups/${groupId}/members`),
      ])

      if (!gRes.ok) { setError('Groupe introuvable.'); setLoading(false); return }
      setGroup(await gRes.json() as GroupDetail)
      setPermissions(await pRes.json() as Permission[])

      const allUsers = uRes.ok ? await uRes.json() as { id: number; email: string; role_id: number }[] : []
      const members  = mRes.ok ? await mRes.json() as { user_id: number }[] : []
      const memberSet = new Set(members.map(m => m.user_id))
      setUsers(allUsers.map(u => ({ ...u, inGroup: memberSet.has(u.id) })))
    } catch {
      setError('Erreur de chargement.')
    } finally {
      setLoading(false)
    }
  }, [groupId])

  useEffect(() => { load() }, [load])

  function updatePerm(resource: string, field: keyof Permission, value: AccessLevel | boolean) {
    setPermissions(prev => prev.map(p =>
      p.resource === resource ? { ...p, [field]: value } : p
    ))
    setDirty(true)
  }

  async function save() {
    setSaving(true); setError(null)
    try {
      const res  = await fetch(`/api/tenant-admin/groups/${groupId}/permissions`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(permissions),
      })
      const data = await res.json() as { success?: boolean; error?: string }
      if (data.error) { setError(data.error); return }
      setDirty(false)
      showFlash('Permissions sauvegardées.')
    } finally {
      setSaving(false)
    }
  }

  async function toggleMember(userId: number, inGroup: boolean) {
    if (inGroup) {
      await fetch(`/api/tenant-admin/groups/${groupId}/members?user_id=${userId}`, { method: 'DELETE' })
    } else {
      await fetch(`/api/tenant-admin/groups/${groupId}/members`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId }),
      })
    }
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, inGroup: !inGroup } : u))
    showFlash(`Membre ${inGroup ? 'retiré' : 'ajouté'}.`)
  }

  if (loading) return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="h-8 w-48 bg-white/10 rounded animate-pulse mb-4" />
      <div className="h-64 bg-white/5 rounded-2xl animate-pulse" />
    </div>
  )

  if (!group) return (
    <div className="max-w-4xl mx-auto py-8 px-4 text-center text-slate-400">
      Groupe introuvable. <Link href="/dashboard/admin" className="text-primary underline">Retour</Link>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Link href="/dashboard/admin" className="mt-0.5 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-primary" />
              <h1 className="text-xl font-bold text-white">{group.name}</h1>
            </div>
            {group.description && <p className="text-sm text-slate-400 mt-0.5">{group.description}</p>}
          </div>
        </div>

        <button
          onClick={save}
          disabled={!dirty || saving}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Sauvegarder
        </button>
      </div>

      {/* Flash / Error */}
      {flash && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-sm">
          <Check className="w-4 h-4" />{flash}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4" />{error}
        </div>
      )}

      {/* Permissions matrix */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-white/10">
          <Shield className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-white">Permissions par module</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-2.5 px-4 text-[11px] text-slate-500 uppercase tracking-wider w-48">Module</th>
                <th className="text-left py-2.5 px-4 text-[11px] text-slate-500 uppercase tracking-wider">Niveau d'accès</th>
                <th className="text-left py-2.5 px-4 text-[11px] text-slate-500 uppercase tracking-wider">Filtre</th>
              </tr>
            </thead>
            <tbody>
              {RESOURCES.map(r => {
                const perm = permissions.find(p => p.resource === r.key) ?? {
                  resource: r.key, access_level: 'none' as AccessLevel, own_only: false,
                }
                return (
                  <PermRow
                    key={r.key}
                    resource={r.key}
                    label={r.label}
                    perm={perm}
                    onChange={updatePerm}
                  />
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Members */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-white/10">
          <Users className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-white">
            Membres — {users.filter(u => u.inGroup).length} / {users.length}
          </span>
        </div>
        {users.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-sm">Aucun utilisateur dans ce tenant.</div>
        ) : (
          <ul className="divide-y divide-white/5">
            {users.map(u => (
              <li key={u.id} className="flex items-center gap-4 px-5 py-3">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${u.inGroup ? 'bg-green-400' : 'bg-white/15'}`} />
                <p className="flex-1 text-sm text-slate-300">{u.email}</p>
                <button
                  onClick={() => toggleMember(u.id, u.inGroup)}
                  className={`text-xs px-3 py-1 rounded-lg border transition-colors ${
                    u.inGroup
                      ? 'border-red-400/30 text-red-400 hover:bg-red-400/10'
                      : 'border-primary/40 text-primary hover:bg-primary/10'
                  }`}
                >
                  {u.inGroup ? 'Retirer' : 'Ajouter'}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
