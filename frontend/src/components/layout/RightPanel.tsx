'use client'
import { useState, useEffect } from 'react'
import { StickyNote, ListTodo, Plus, X, PanelRightClose, PanelRightOpen } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Textarea }  from '@/components/ui/textarea'
import { Input }     from '@/components/ui/input'
import { Button }    from '@/components/ui/button'
import { Checkbox }  from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn }        from '@/lib/utils'

interface Note  { id: string; text: string; date: string }
interface Todo  { id: string; text: string; done: boolean }

const KEY_NOTES = 'erp_notes'
const KEY_TODOS = 'erp_todos'

function load<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try { return JSON.parse(localStorage.getItem(key) ?? '') } catch { return fallback }
}

interface RightPanelProps {
  open: boolean
  onToggle: () => void
}

export function RightPanel({ open, onToggle }: RightPanelProps) {
  const [notes,    setNotes]    = useState<Note[]>([])
  const [todos,    setTodos]    = useState<Todo[]>([])
  const [noteText, setNoteText] = useState('')
  const [todoText, setTodoText] = useState('')

  // Hydrate from localStorage after mount
  useEffect(() => {
    setNotes(load<Note[]>(KEY_NOTES, []))
    setTodos(load<Todo[]>(KEY_TODOS, []))
  }, [])

  function persist<T>(key: string, value: T) {
    localStorage.setItem(key, JSON.stringify(value))
  }

  function addNote() {
    if (!noteText.trim()) return
    const next: Note[] = [
      { id: Date.now().toString(), text: noteText.trim(), date: new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) },
      ...notes,
    ]
    setNotes(next)
    persist(KEY_NOTES, next)
    setNoteText('')
  }

  function removeNote(id: string) {
    const next = notes.filter(n => n.id !== id)
    setNotes(next)
    persist(KEY_NOTES, next)
  }

  function addTodo() {
    if (!todoText.trim()) return
    const next: Todo[] = [...todos, { id: Date.now().toString(), text: todoText.trim(), done: false }]
    setTodos(next)
    persist(KEY_TODOS, next)
    setTodoText('')
  }

  function toggleTodo(id: string) {
    const next = todos.map(t => t.id === id ? { ...t, done: !t.done } : t)
    setTodos(next)
    persist(KEY_TODOS, next)
  }

  function removeTodo(id: string) {
    const next = todos.filter(t => t.id !== id)
    setTodos(next)
    persist(KEY_TODOS, next)
  }

  const pending = todos.filter(t => !t.done).length

  return (
    <>
      {/* Toggle tab on edge (always visible) */}
      <button
        onClick={onToggle}
        className={cn(
          'fixed top-1/2 -translate-y-1/2 z-50 flex flex-col items-center justify-center gap-1',
          'w-6 h-20 rounded-l-lg bg-card border border-border border-r-0 shadow-sm',
          'text-muted-foreground hover:text-foreground hover:bg-muted transition-colors',
          open ? 'right-[var(--right-panel-w)]' : 'right-0'
        )}
        style={{ transition: 'right 0.2s ease' }}
        aria-label={open ? 'Fermer le panneau' : 'Ouvrir le panneau'}
      >
        {open
          ? <PanelRightClose className="w-3 h-3" />
          : <PanelRightOpen  className="w-3 h-3" />
        }
      </button>

      {/* Panel */}
      <aside
        className={cn(
          'fixed top-0 right-0 h-screen z-40',
          'w-[var(--right-panel-w)] bg-card border-l border-border',
          'flex flex-col transition-transform duration-200 ease-in-out',
          open ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-14 px-4 border-b">
          <span className="text-sm font-semibold text-foreground">Espace de travail</span>
          <button
            onClick={onToggle}
            className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="notes" className="flex flex-col flex-1 min-h-0 px-3 pt-3">
          <TabsList className="w-full mb-2">
            <TabsTrigger value="notes" className="flex-1 gap-1.5 text-xs">
              <StickyNote className="w-3 h-3" />
              Notes
              {notes.length > 0 && (
                <span className="ml-0.5 text-[10px] bg-muted rounded-full px-1.5 py-0.5 text-muted-foreground">
                  {notes.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="todos" className="flex-1 gap-1.5 text-xs">
              <ListTodo className="w-3 h-3" />
              Tâches
              {pending > 0 && (
                <span className="ml-0.5 text-[10px] bg-primary text-primary-foreground rounded-full px-1.5 py-0.5">
                  {pending}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* ── NOTES ── */}
          <TabsContent value="notes" className="flex flex-col flex-1 min-h-0 gap-2 mt-0">
            {/* Add note */}
            <div className="flex flex-col gap-2">
              <Textarea
                placeholder="Ajouter une note…"
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                className="text-xs min-h-[72px] bg-muted/40"
                onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) addNote() }}
              />
              <Button size="sm" onClick={addNote} disabled={!noteText.trim()} className="w-full h-7 text-xs gap-1.5">
                <Plus className="w-3 h-3" /> Ajouter
              </Button>
            </div>

            <ScrollArea className="flex-1 -mx-1 px-1">
              {notes.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-8">Aucune note</p>
              ) : (
                <div className="space-y-2 pb-4">
                  {notes.map(note => (
                    <div key={note.id} className="group relative bg-muted/40 rounded-lg p-3 border border-border/50">
                      <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap pr-5">{note.text}</p>
                      <p className="text-[10px] text-muted-foreground mt-1.5">{note.date}</p>
                      <button
                        onClick={() => removeNote(note.id)}
                        className="absolute top-2 right-2 w-5 h-5 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* ── TO-DO ── */}
          <TabsContent value="todos" className="flex flex-col flex-1 min-h-0 gap-2 mt-0">
            {/* Add todo */}
            <div className="flex gap-2">
              <Input
                placeholder="Nouvelle tâche…"
                value={todoText}
                onChange={e => setTodoText(e.target.value)}
                className="text-xs h-8 bg-muted/40"
                onKeyDown={e => { if (e.key === 'Enter') addTodo() }}
              />
              <Button size="icon" onClick={addTodo} disabled={!todoText.trim()} className="h-8 w-8 flex-shrink-0">
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>

            <ScrollArea className="flex-1 -mx-1 px-1">
              {todos.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-8">Aucune tâche</p>
              ) : (
                <div className="space-y-1 pb-4">
                  {/* Pending first */}
                  {todos.filter(t => !t.done).map(todo => (
                    <TodoItem key={todo.id} todo={todo} onToggle={toggleTodo} onRemove={removeTodo} />
                  ))}
                  {/* Done section */}
                  {todos.some(t => t.done) && (
                    <>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider pt-3 pb-1 px-1">Terminées</p>
                      {todos.filter(t => t.done).map(todo => (
                        <TodoItem key={todo.id} todo={todo} onToggle={toggleTodo} onRemove={removeTodo} />
                      ))}
                    </>
                  )}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </aside>
    </>
  )
}

function TodoItem({ todo, onToggle, onRemove }: { todo: Todo; onToggle: (id: string) => void; onRemove: (id: string) => void }) {
  return (
    <div className={cn(
      'group flex items-start gap-2.5 p-2.5 rounded-lg border border-border/50 transition-colors',
      todo.done ? 'bg-muted/20' : 'bg-muted/40 hover:bg-muted/60'
    )}>
      <Checkbox
        id={todo.id}
        checked={todo.done}
        onCheckedChange={() => onToggle(todo.id)}
        className="mt-0.5 flex-shrink-0"
      />
      <label
        htmlFor={todo.id}
        className={cn(
          'text-xs flex-1 cursor-pointer leading-relaxed',
          todo.done ? 'line-through text-muted-foreground' : 'text-foreground'
        )}
      >
        {todo.text}
      </label>
      <button
        onClick={() => onRemove(todo.id)}
        className="w-4 h-4 flex items-center justify-center opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all flex-shrink-0"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  )
}
