'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { MessageSquare, X, Send, Loader2, Bot, User, Minimize2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  error?: boolean
}

type ChatState = 'closed' | 'open' | 'minimized'

export function ChatWidget() {
  const [state, setState]       = useState<ChatState>('closed')
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(false)
  const bottomRef               = useRef<HTMLDivElement>(null)
  const inputRef                = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Focus input when opening
  useEffect(() => {
    if (state === 'open') {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [state])

  const sendMessage = useCallback(async () => {
    const text = input.trim()
    if (!text || loading) return

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      // Build conversation history for context (last 10 turns)
      const history = [...messages, userMsg]
        .slice(-10)
        .map(m => ({ role: m.role, content: m.content }))

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
      })

      const data = await res.json()

      if (!res.ok || !data.reply) {
        throw new Error(data.error || 'Erreur de réponse')
      }

      setMessages(prev => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: data.reply,
          timestamp: new Date(),
        },
      ])
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: err instanceof Error ? err.message : 'Erreur inattendue',
          timestamp: new Date(),
          error: true,
        },
      ])
    } finally {
      setLoading(false)
    }
  }, [input, loading, messages])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // Floating bubble (closed state)
  if (state === 'closed') {
    return (
      <button
        onClick={() => setState('open')}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 active:scale-95"
        aria-label="Ouvrir l'assistant IA"
      >
        <MessageSquare className="h-6 w-6" />
        {/* Unread dot when closed and has messages */}
        {messages.length > 0 && (
          <span className="absolute right-0 top-0 h-3.5 w-3.5 rounded-full bg-green-500 ring-2 ring-background" />
        )}
      </button>
    )
  }

  // Minimized tab
  if (state === 'minimized') {
    return (
      <button
        onClick={() => setState('open')}
        className="fixed bottom-0 right-6 z-50 flex items-center gap-2 rounded-t-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-lg"
      >
        <Bot className="h-4 w-4" />
        MoonDust IA
        <span className="ml-1 rounded-full bg-primary-foreground/20 px-1.5 py-0.5 text-xs">
          {messages.filter(m => m.role === 'assistant').length}
        </span>
      </button>
    )
  }

  // Full chat panel
  return (
    <div className="fixed bottom-6 right-6 z-50 flex w-[380px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border bg-background shadow-2xl">
      {/* Header */}
      <div className="flex items-center gap-3 border-b bg-primary/5 px-4 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Bot className="h-4 w-4" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold leading-none">MoonDust IA</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {loading ? 'En train de répondre…' : 'Prêt à vous aider'}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setState('minimized')}
            className="rounded p-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            aria-label="Réduire"
          >
            <Minimize2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setState('closed')}
            className="rounded p-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            aria-label="Fermer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex h-[380px] flex-col gap-3 overflow-y-auto px-4 py-3 scroll-smooth">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Bot className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Bonjour ! Je suis MoonDust IA</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Posez-moi une question sur votre ERP, vos données ou vos processus.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {[
                'Quels contrats expirent ce mois ?',
                'Montre-moi mes tâches',
                'Comment créer un devis ?',
              ].map(suggestion => (
                <button
                  key={suggestion}
                  onClick={() => { setInput(suggestion); inputRef.current?.focus() }}
                  className="rounded-full border px-3 py-1.5 text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map(msg => (
          <div
            key={msg.id}
            className={cn(
              'flex gap-2.5',
              msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
            )}
          >
            <div className={cn(
              'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs',
              msg.role === 'user'
                ? 'bg-primary text-primary-foreground'
                : msg.error
                  ? 'bg-destructive/10 text-destructive'
                  : 'bg-muted text-muted-foreground'
            )}>
              {msg.role === 'user' ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
            </div>
            <div className={cn(
              'max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
              msg.role === 'user'
                ? 'bg-primary text-primary-foreground rounded-tr-sm'
                : msg.error
                  ? 'bg-destructive/10 text-destructive rounded-tl-sm'
                  : 'bg-muted rounded-tl-sm'
            )}>
              <MessageContent content={msg.content} />
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted">
              <Bot className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm bg-muted px-3.5 py-3">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="border-t p-3">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Votre message… (Entrée pour envoyer)"
            disabled={loading}
            rows={1}
            className="flex-1 resize-none rounded-xl border bg-muted/50 px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50 max-h-32"
            style={{ minHeight: '42px' }}
            onInput={e => {
              const t = e.currentTarget
              t.style.height = 'auto'
              t.style.height = `${Math.min(t.scrollHeight, 128)}px`
            }}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-opacity disabled:opacity-40 hover:opacity-90 active:scale-95"
            aria-label="Envoyer"
          >
            {loading
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <Send className="h-4 w-4" />
            }
          </button>
        </div>
        <p className="mt-1.5 px-1 text-[10px] text-muted-foreground">
          Propulsé par Groq · Géré via Activepieces
        </p>
      </div>
    </div>
  )
}

// Simple markdown-like renderer for assistant messages
function MessageContent({ content }: { content: string }) {
  const parts = content.split(/(\*\*[^*]+\*\*|`[^`]+`|\n)/g)
  return (
    <span>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**'))
          return <strong key={i}>{part.slice(2, -2)}</strong>
        if (part.startsWith('`') && part.endsWith('`'))
          return <code key={i} className="rounded bg-background/50 px-1 font-mono text-xs">{part.slice(1, -1)}</code>
        if (part === '\n')
          return <br key={i} />
        return part
      })}
    </span>
  )
}
