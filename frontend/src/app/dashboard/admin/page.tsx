'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Shield, Users, Crown, User, UserX, RefreshCw, AlertCircle,
  Check, Plus, Trash2, Layers, ChevronRight,
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────

interface TenantUser {
  id: number
  email: string
  role_id: number
  groups?: { group_id: number; name: string }[]
}

interface Group {
  id: number
  name: string
  description: string
  user_count: number
}

// ── Role badge ────────────────────────────────────────────────────

const ROLES: Record<number, { label: string; color: string; icon: typeof Crown }> = {
  1:  { label: 'Admin',        color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30', icon: Crown  },
  40: { label: 'Staff',        color: 'text-blue-400 bg-blue-400/10 border-blue-400/30',       icon: Shield },
  80: { label: 'Utilisateur',  color: 'text-slate-400 bg-slate-400/10 border-slate-400/20',   icon: User   },
}

function RoleBadge({ roleId }: { roleId: number }) {
  const r    = ROLES[roleId] ?? ROLES[80]
  const Icon = r.icon
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${r.color}`}>
      <Icon className="w-3 h-3" />{r.label}
    </span>
  )
}

// ── Tab nav ───────────────────────────────────────────────────────

type Tab = 'users' | 'groups'

function TabNav({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  return (
    <div className="flex gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
      {([['users', Users, 'Utilisateurs'], ['groups', Layers, 'Groupes']] as const).map(
        ([key, Icon, label]) => (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              active === key
                ? 'bg-primary text-primary-foreground'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Icon className="w-4 h-4" />{label}
          </button>
        )
      )}
    </div>
  )
}

// ── Users tab ─────────────────────────────────────────────────────

function UsersTab({
  users, myRole, groups, saving, flash, error,
  onRoleChange, onRemove, onGroupsChange, loadData,
}: {
  users: TenantUser[]
  myRole: number | null
  groups: Group[]
  saving: number | null
  flash: string | null
  error: string | null
  onRoleChange: (userId: number, roleId: number) => void
  onRemove: (userId: number) => void
  onGroupsChange: (userId: number, groupIds: number[]) => void
  loadData: () => void
}) {
  return (
    <div className="space-y-4">
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

      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-medium text-white">
              Utilisateurs {users.length > 0 && <span className="text-slate-400">({users.length})</span>}
            </span>
          </div>
          <button
            onClick={loadData}
            className="p-1.5 rounded-lg border border-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {users.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm">Aucun utilisateur.</div>
        ) : (
          <ul className="divide-y divide-white/5">
            {users.map(u => (
              <UserRow
                key={u.id}
                user={u}
                groups={groups}
                myRole={myRole}
                saving={saving}
                onRoleChange={onRoleChange}
                onRemove={onRemove}
                onGroupsChange={onGroupsChange}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function UserRow({
  user, groups, myRole, saving, onRoleChange, onRemove, onGroupsChange,
}: {
  user: TenantUser
  groups: Group[]
  myRole: number | null
  saving: number | null
  onRoleChange: (id: number, role: number) => void
  onRemove: (id: number) => void
  onGroupsChange: (userId: number, groupIds: number[]) => void
}) {
  const [open, setOpen] = useState(false)
  const userGroupIds = new Set((user.groups ?? []).map(g => g.group_id))

  function toggleGroup(gid: number) {
    const next = new Set(userGroupIds)
    if (next.has(gid)) next.delete(gid); else next.add(gid)
    onGroupsChange(user.id, Array.from(next))
  }

  return (
    <li className="px-5 py-4">
      <div className="flex items-center gap-4">
        <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-slate-400 flex-shrink-0">
          <User className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">{user.email}</p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <RoleBadge roleId={user.role_id} />
            {(user.groups ?? []).map(g => (
              <span key={g.group_id} className="text-[10px] px-1.5 py-0.5 rounded border border-primary/40 text-primary/80 bg-primary/5">
                {g.name}
              </span>
            ))}
          </div>
        </div>

        <select
          value={user.role_id}
          disabled={saving === user.id}
          onChange={e => onRoleChange(user.id, Number(e.target.value))}
          className="text-xs bg-white/10 border border-white/20 text-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary/60 disabled:opacity-50 cursor-pointer"
        >
          <option value={1}>Admin</option>
          <option value={40}>Staff</option>
          <option value={80}>Utilisateur</option>
        </select>

        {groups.length > 0 && (
          <button
            onClick={() => setOpen(o => !o)}
            className={`p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors ${open ? 'bg-white/10 text-white' : ''}`}
            title="Gérer les groupes"
          >
            <Layers className="w-4 h-4" />
          </button>
        )}

        {myRole === 1 && (
          <button
            onClick={() => onRemove(user.id)}
            disabled={saving === user.id}
            className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-400/10 transition-colors disabled:opacity-50"
            title="Supprimer"
          >
            <UserX className="w-4 h-4" />
          </button>
        )}
      </div>

      {open && (
        <div className="mt-3 ml-13 pl-13 border-l border-white/10 ml-[52px] pl-4 space-y-1">
          <p className="text-[11px] text-slate-500 uppercase tracking-wider mb-2">Groupes</p>
          {groups.map(g => (
            <label key={g.id} className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="checkbox"
                checked={userGroupIds.has(g.id)}
                onChange={() => toggleGroup(g.id)}
                className="accent-primary"
              />
              <span className="text-sm text-slate-300 group-hover:text-white transition-colors">{g.name}</span>
              {g.description && <span className="text-xs text-slate-600 truncate">{g.description}</span>}
            </label>
          ))}
        </div>
      )}
    </li>
  )
}

// ── Groups tab ────────────────────────────────────────────────────

function GroupsTab({
  groups, loading, flash, error,
  onCreate, onDelete, reload,
}: {
  groups: Group[]
  loading: boolean
  flash: string | null
  error: string | null
  onCreate: (name: string, description: string) => void
  onDelete: (id: number) => void
  reload: () => void
}) {
  const [creating, setCreating] = useState(false)
  const [newName,  setNewName]  = useState('')
  const [newDesc,  setNewDesc]  = useState('')

  function submitCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    onCreate(newName.trim(), newDesc.trim())
    setNewName(''); setNewDesc(''); setCreating(false)
  }

  return (
    <div className="space-y-4">
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

      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-medium text-white">
              Groupes {groups.length > 0 && <span className="text-slate-400">({groups.length})</span>}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={reload} className="p-1.5 rounded-lg border border-white/10 text-slate-400 hover:text-white transition-colors">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setCreating(o => !o)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />Nouveau groupe
            </button>
          </div>
        </div>

        {creating && (
          <form onSubmit={submitCreate} className="px-5 py-4 border-b border-white/10 bg-white/3 space-y-3">
            <div className="flex gap-3">
              <input
                autoFocus
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="Nom du groupe *"
                className="flex-1 bg-white/10 border border-white/20 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary/60 placeholder:text-slate-500"
              />
              <input
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
                placeholder="Description (optionnel)"
                className="flex-1 bg-white/10 border border-white/20 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary/60 placeholder:text-slate-500"
              />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="px-4 py-1.5 bg-primary text-primary-foreground text-xs font-medium rounded-lg hover:bg-primary/90 transition-colors">Créer</button>
              <button type="button" onClick={() => { setCreating(false); setNewName(''); setNewDesc('') }} className="px-4 py-1.5 bg-white/10 text-slate-300 text-xs rounded-lg hover:bg-white/15 transition-colors">Annuler</button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="py-12 text-center text-slate-500 text-sm">Chargement…</div>
        ) : groups.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm">
            Aucun groupe. Créez-en un pour définir des permissions granulaires.
          </div>
        ) : (
          <ul className="divide-y divide-white/5">
            {groups.map(g => (
              <li key={g.id} className="flex items-center gap-4 px-5 py-4">
                <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
                  <Layers className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">{g.name}</p>
                  {g.description && <p className="text-xs text-slate-500 truncate">{g.description}</p>}
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    {g.user_count} membre{g.user_count !== 1 ? 's' : ''}
                  </p>
                </div>
                <Link
                  href={`/dashboard/admin/groups/${g.id}`}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-white/8 hover:bg-white/15 rounded-lg transition-colors border border-white/10"
                >
                  Permissions <ChevronRight className="w-3.5 h-3.5" />
                </Link>
                <button
                  onClick={() => onDelete(g.id)}
                  className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                  title="Supprimer le groupe"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="text-xs text-slate-600 px-1">
        Un groupe sans permissions n'accorde aucun accès. Par défaut, un utilisateur sans groupe ne peut rien voir.
      </p>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────

export default function AdminPage() {
  const [tab,     setTab]     = useState<Tab>('users')
  const [users,   setUsers]   = useState<TenantUser[]>([])
  const [groups,  setGroups]  = useState<Group[]>([])
  const [myRole,  setMyRole]  = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState<number | null>(null)
  const [flash,   setFlash]   = useState<string | null>(null)
  const [error,   setError]   = useState<string | null>(null)

  function showFlash(msg: string) {
    setFlash(msg)
    setTimeout(() => setFlash(null), 2500)
  }

  const loadData = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const [usersRes, meRes, groupsRes] = await Promise.all([
        fetch('/api/tenant-admin/users'),
        fetch('/api/tenant-admin/me'),
        fetch('/api/tenant-admin/groups'),
      ])
      const usersRaw  = await usersRes.json() as TenantUser[] | { error?: string }
      const meData    = await meRes.json() as { role_id?: number }
      const groupsRaw = groupsRes.ok ? await groupsRes.json() as Group[] : []

      if ('error' in (usersRaw as object)) {
        setError((usersRaw as { error?: string }).error ?? 'Erreur de chargement.')
      } else {
        const userList = Array.isArray(usersRaw) ? usersRaw as TenantUser[] : []
        // Load groups per user
        const enriched = await Promise.all(
          userList.map(async u => {
            try {
              const r = await fetch(`/api/tenant-admin/users/${u.id}/groups`)
              const g = r.ok ? await r.json() as { group_id: number; name: string }[] : []
              return { ...u, groups: g }
            } catch { return u }
          })
        )
        setUsers(enriched)
      }
      setMyRole(meData.role_id ?? null)
      setGroups(Array.isArray(groupsRaw) ? groupsRaw : [])
    } catch {
      setError('Impossible de charger les données.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  if (myRole !== null && myRole !== 1) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Shield className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <p className="text-white font-semibold">Accès refusé</p>
          <p className="text-slate-400 text-sm mt-1">Cette page est réservée aux administrateurs.</p>
        </div>
      </div>
    )
  }

  async function changeRole(userId: number, roleId: number) {
    setSaving(userId)
    try {
      const res  = await fetch(`/api/tenant-admin/users/${userId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role_id: roleId }),
      })
      if ((await res.json() as { success?: boolean }).success || res.ok) {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, role_id: roleId } : u))
        showFlash('Rôle mis à jour.')
      }
    } finally { setSaving(null) }
  }

  async function removeUser(userId: number) {
    if (!confirm('Supprimer cet utilisateur ?')) return
    setSaving(userId)
    try {
      await fetch(`/api/tenant-admin/users/${userId}`, { method: 'DELETE' })
      setUsers(prev => prev.filter(u => u.id !== userId))
      showFlash('Utilisateur supprimé.')
    } finally { setSaving(null) }
  }

  async function changeUserGroups(userId: number, groupIds: number[]) {
    await fetch(`/api/tenant-admin/users/${userId}/groups`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ group_ids: groupIds }),
    })
    setUsers(prev => prev.map(u => {
      if (u.id !== userId) return u
      const newGroups = groups.filter(g => groupIds.includes(g.id)).map(g => ({ group_id: g.id, name: g.name }))
      return { ...u, groups: newGroups }
    }))
    showFlash('Groupes mis à jour.')
  }

  async function createGroup(name: string, description: string) {
    const res  = await fetch('/api/tenant-admin/groups', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description }),
    })
    const data = await res.json() as { success?: boolean; error?: string; group?: Group }
    if (data.error) { setError(data.error); return }
    await loadData()
    showFlash('Groupe créé.')
  }

  async function deleteGroup(id: number) {
    if (!confirm('Supprimer ce groupe ? Les membres perdront les accès associés.')) return
    await fetch(`/api/tenant-admin/groups/${id}`, { method: 'DELETE' })
    setGroups(prev => prev.filter(g => g.id !== id))
    showFlash('Groupe supprimé.')
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Shield className="w-6 h-6 text-primary" />Administration
        </h1>
        <p className="text-slate-400 text-sm mt-0.5">Gérez les utilisateurs et les groupes de permissions.</p>
      </div>

      <TabNav active={tab} onChange={setTab} />

      {tab === 'users' ? (
        <UsersTab
          users={users}
          myRole={myRole}
          groups={groups}
          saving={saving}
          flash={flash}
          error={error}
          onRoleChange={changeRole}
          onRemove={removeUser}
          onGroupsChange={changeUserGroups}
          loadData={loadData}
        />
      ) : (
        <GroupsTab
          groups={groups}
          loading={loading}
          flash={flash}
          error={error}
          onCreate={createGroup}
          onDelete={deleteGroup}
          reload={loadData}
        />
      )}
    </div>
  )
}
