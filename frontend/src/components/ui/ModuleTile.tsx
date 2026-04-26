import Link from 'next/link'

interface ModuleTileProps {
  href:        string
  gradStart:   string
  gradEnd:     string
  icon:        string
  title:       string
  description: string
}

export function ModuleTile({ href, gradStart, gradEnd, icon, title, description }: ModuleTileProps) {
  return (
    <Link
      href={href}
      className="tile-gradient block no-underline"
      style={{ background: `linear-gradient(135deg,${gradStart},${gradEnd})` }}
    >
      <div className="text-4xl mb-4 opacity-90">{icon}</div>
      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
      <p className="text-sm text-white/75 leading-relaxed">{description}</p>
      <div className="mt-4 flex items-center gap-1 text-white/60 text-xs font-medium">
        Ouvrir
        <svg className="w-3.5 h-3.5 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
      </div>
    </Link>
  )
}
