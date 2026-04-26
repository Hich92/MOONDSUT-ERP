interface StatCardProps {
  value:     number
  label:     string
  sub?:      string
  gradStart: string
  gradEnd:   string
  icon:      string
}

export function StatCard({ value, label, sub, gradStart, gradEnd, icon }: StatCardProps) {
  return (
    <div
      className="stat-card"
      style={{ background: `linear-gradient(135deg,${gradStart},${gradEnd})` }}
    >
      <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl mb-4"
           style={{ background: 'rgba(255,255,255,.15)' }}>
        <span className="text-lg">{icon}</span>
      </div>
      <div className="text-3xl font-extrabold leading-none text-white">{value}</div>
      <div className="text-sm text-white/80 mt-2 font-medium">{label}</div>
      {sub && <div className="text-xs text-white/50 mt-1">{sub}</div>}
    </div>
  )
}
