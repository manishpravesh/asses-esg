import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import api, { DashboardSummary } from '../api/client'
import StatusBadge from '../components/StatusBadge'

const stats = (data?: DashboardSummary) => [
  {
    label: 'Total Ingested',
    value: data?.total_activities ?? 0,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 2.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
      </svg>
    ),
    color: 'from-slate-700 to-slate-900',
    text: 'text-slate-100',
    accent: 'bg-slate-600',
  },
  {
    label: 'Pending Review',
    value: data?.pending_review ?? 0,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
    ),
    color: 'from-amber-500 to-orange-600',
    text: 'text-amber-50',
    accent: 'bg-amber-400',
  },
  {
    label: 'Flagged',
    value: data?.flagged ?? 0,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0 2.77-.693a9 9 0 0 1 6.208.682l.108.054a9 9 0 0 0 6.086.71l3.114-.732a48.524 48.524 0 0 1-.005-10.499l-3.11.732a9 9 0 0 1-6.085-.711l-.108-.054a9 9 0 0 0-6.208-.682L3 4.5M3 15V4.5" />
      </svg>
    ),
    color: 'from-orange-500 to-red-600',
    text: 'text-orange-50',
    accent: 'bg-orange-400',
  },
  {
    label: 'Failed Parse',
    value: data?.failed_parse ?? 0,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
      </svg>
    ),
    color: 'from-red-500 to-rose-700',
    text: 'text-red-50',
    accent: 'bg-red-400',
  },
  {
    label: 'Approved',
    value: data?.approved ?? 0,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
    ),
    color: 'from-emerald-500 to-teal-700',
    text: 'text-emerald-50',
    accent: 'bg-emerald-400',
  },
  {
    label: 'Locked for Audit',
    value: data?.locked ?? 0,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
      </svg>
    ),
    color: 'from-violet-500 to-purple-800',
    text: 'text-violet-50',
    accent: 'bg-violet-400',
  },
]

function SkeletonCard() {
  return (
    <div className="rounded-2xl bg-slate-100 animate-pulse h-36" />
  )
}

function SkeletonRow() {
  return (
    <tr className="border-t border-slate-100">
      {[1,2,3,4,5,6].map(i => (
        <td key={i} className="px-5 py-4">
          <div className="h-3 bg-slate-100 rounded-full animate-pulse" style={{ width: `${50 + i * 8}%` }} />
        </td>
      ))}
    </tr>
  )
}

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => (await api.get<DashboardSummary>('/dashboard/summary/')).data,
  })

  const cards = stats(data)
  const total = data?.total_activities || 1
  const approvedPct = Math.round(((data?.approved || 0) / total) * 100)
  const pendingPct = Math.round(((data?.pending_review || 0) / total) * 100)
  const flaggedPct = Math.round(((data?.flagged || 0) / total) * 100)

  return (
    <div className="min-h-screen bg-[#f7f7f5]">
      {/* Masthead */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 px-6 py-10 sm:px-10 sm:py-14">
        {/* Decorative circles */}
        <div className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-0 w-64 h-64 rounded-full bg-teal-400/10 blur-2xl" />
        <div className="relative mx-auto max-w-7xl flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-emerald-400 mb-2">ESG · Analyst Portal</p>
            <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">Review Dashboard</h1>
            <p className="mt-2 text-sm text-slate-400">Overview of ingested activity data awaiting analyst sign-off.</p>
          </div>
          <Link
            to="/upload"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 transition-colors px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-900/40 self-start sm:self-auto"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
            </svg>
            Upload Data
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10 py-8 space-y-8">

        {/* Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
            : cards.map((card) => (
              <div
                key={card.label}
                className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${card.color} p-5 shadow-md`}
              >
                <div className={`inline-flex items-center justify-center rounded-lg ${card.accent}/30 p-2 ${card.text} mb-3`}>
                  {card.icon}
                </div>
                <p className={`text-[11px] font-semibold uppercase tracking-widest ${card.text} opacity-70`}>{card.label}</p>
                <p className={`mt-1 text-3xl font-bold ${card.text}`}>{card.value.toLocaleString()}</p>
                {/* Decorative blob */}
                <div className="pointer-events-none absolute -bottom-4 -right-4 w-20 h-20 rounded-full bg-white/5" />
              </div>
            ))
          }
        </div>

        {/* Progress bar breakdown */}
        {!isLoading && data && (
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm px-6 py-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">Activity Status Breakdown</p>
            <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
              <div className="bg-emerald-500 transition-all duration-700" style={{ width: `${approvedPct}%` }} title={`Approved ${approvedPct}%`} />
              <div className="bg-amber-400 transition-all duration-700" style={{ width: `${pendingPct}%` }} title={`Pending ${pendingPct}%`} />
              <div className="bg-orange-500 transition-all duration-700" style={{ width: `${flaggedPct}%` }} title={`Flagged ${flaggedPct}%`} />
              <div className="flex-1 bg-slate-100" />
            </div>
            <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />Approved {approvedPct}%</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />Pending {pendingPct}%</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block" />Flagged {flaggedPct}%</span>
            </div>
          </div>
        )}

        {/* Recent Uploads Table */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <div>
              <h2 className="font-semibold text-slate-800">Recent Uploads</h2>
              <p className="text-xs text-slate-400 mt-0.5">Latest ingestion batches from all sources</p>
            </div>
            <Link
              to="/upload"
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              New Upload
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left">
                  {['File', 'Source', 'Status', 'Success', 'Errors', 'Flagged'].map(h => (
                    <th key={h} className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading
                  ? Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)
                  : data?.recent_batches.length === 0
                    ? (
                      <tr>
                        <td colSpan={6} className="px-5 py-12 text-center text-slate-400 text-sm">
                          <div className="flex flex-col items-center gap-2">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-8 h-8 text-slate-300">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                            </svg>
                            No uploads yet. <Link to="/upload" className="text-emerald-600 hover:underline">Upload your first file →</Link>
                          </div>
                        </td>
                      </tr>
                    )
                  : data?.recent_batches.map((batch) => (
                    <tr key={batch.id} className="border-t border-slate-100 hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3.5">
                        <span className="font-medium text-slate-800 truncate max-w-[180px] block">{batch.filename}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                          {batch.source_type.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={batch.status} />
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-semibold text-emerald-600">{batch.success_count.toLocaleString()}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`font-semibold ${batch.error_count > 0 ? 'text-red-500' : 'text-slate-400'}`}>
                          {batch.error_count.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`font-semibold ${batch.flagged_count > 0 ? 'text-orange-500' : 'text-slate-400'}`}>
                          {batch.flagged_count.toLocaleString()}
                        </span>
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>

          {!isLoading && (data?.recent_batches.length ?? 0) > 0 && (
            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50">
              <Link to="/review" className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">
                View full review queue →
              </Link>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}