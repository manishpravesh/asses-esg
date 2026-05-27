const colors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  flagged: 'bg-orange-100 text-orange-800',
  approved: 'bg-emerald-100 text-emerald-800',
  locked: 'bg-slate-200 text-slate-800',
  rejected: 'bg-red-100 text-red-800',
  processing: 'bg-blue-100 text-blue-800',
  ready_for_review: 'bg-indigo-100 text-indigo-800',
  failed: 'bg-red-100 text-red-800',
}

export default function StatusBadge({ status, label }: { status: string; label?: string }) {
  const cls = colors[status] || 'bg-slate-100 text-slate-700'
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      {label || status.replace(/_/g, ' ')}
    </span>
  )
}
