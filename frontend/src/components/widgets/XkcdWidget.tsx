'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, Shuffle, ExternalLink } from 'lucide-react'
import Image from 'next/image'

interface XkcdComic {
  num:        number
  title:      string
  img:        string
  alt:        string
  year:       string
  month:      string
  day:        string
}

interface Props {
  initial: XkcdComic
  latest:  number
}

export function XkcdWidget({ initial, latest }: Props) {
  const [comic,   setComic]   = useState<XkcdComic>(initial)
  const [loading, setLoading] = useState(false)
  const [showAlt, setShowAlt] = useState(false)

  async function load(param: string) {
    setLoading(true)
    setShowAlt(false)
    try {
      const res = await fetch(`/api/xkcd?${param}`)
      if (res.ok) setComic(await res.json())
    } finally {
      setLoading(false)
    }
  }

  const dateStr = comic.year
    ? new Date(`${comic.year}-${comic.month.padStart(2,'0')}-${comic.day.padStart(2,'0')}`)
        .toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
    : ''

  return (
    <div className="flex flex-col gap-3">
      {/* Comic image */}
      <div
        className="relative w-full rounded-lg overflow-hidden bg-white dark:bg-zinc-900 border border-border flex items-center justify-center cursor-pointer"
        style={{ minHeight: 160 }}
        onClick={() => setShowAlt(v => !v)}
        title="Cliquer pour voir le texte secret"
      >
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/70 z-10">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        <Image
          src={comic.img}
          alt={comic.title}
          width={400}
          height={300}
          className="w-full h-auto object-contain max-h-56"
          unoptimized
        />
        {/* Alt text overlay */}
        {showAlt && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-4">
            <p className="text-white text-xs text-center leading-relaxed">{comic.alt}</p>
          </div>
        )}
      </div>

      {/* Title + date */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium leading-snug">#{comic.num} — {comic.title}</p>
          {dateStr && <p className="text-xs text-muted-foreground mt-0.5">{dateStr}</p>}
        </div>
        <a
          href={`https://xkcd.com/${comic.num}/`}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-muted-foreground hover:text-foreground transition-colors mt-0.5"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => load(`num=${comic.num - 1}`)}
          disabled={loading || comic.num <= 1}
          className="flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          Préc.
        </button>
        <button
          onClick={() => load('random=1')}
          disabled={loading}
          className="flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-1 justify-center"
        >
          <Shuffle className="w-3.5 h-3.5" />
          Aléatoire
        </button>
        <button
          onClick={() => load(`num=${comic.num + 1}`)}
          disabled={loading || comic.num >= latest}
          className="flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Suiv.
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <p className="text-[10px] text-muted-foreground/50 text-center">Cliquez l&apos;image pour révéler le texte secret</p>
    </div>
  )
}
