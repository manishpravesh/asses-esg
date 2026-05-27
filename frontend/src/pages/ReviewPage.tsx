import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import api, { Activity } from '../api/client'
import StatusBadge from '../components/StatusBadge'

const TABS = [
  { key: '', label: 'All', icon: '▤' },
  { key: 'pending', label: 'Pending', icon: '⏳' },
  { key: 'flagged', label: 'Flagged', icon: '⚑' },
  { key: 'locked', label: 'Approved', icon: '✓' },
]

function SkeletonRow() {
  return (
    <tr className="border-t border-slate-100">
      {[20, 14, 16, 12, 18, 14, 12, 10].map((w, i) => (
        <td key={i} className="px-4 py-4">
          <div className={`h-3 bg-slate-100 rounded-full animate-pulse w-${w}`} />
        </td>
      ))}
    </tr>
  )
}

export default function ReviewPage() {
  const [tab, setTab] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['activities', tab],
    queryFn: async () =>
      (await api.get<{ results: Activity[] }>('/activities/', { params: tab ? { review_status: tab } : {} })).data,
  })

  const bulk = useMutation({
    mutationFn: (ids: string[]) => api.post('/activities/bulk-approve/', { activity_ids: ids }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['activities'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      setSelected([])
    },
  })

  const rows = data?.results || []
  const allIds = rows.filter(r => !r.is_locked).map(r => r.id)
  const allSelected = allIds.length > 0 && allIds.every(id => selected.includes(id))

  function toggle(id: string) {
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])
  }

  function toggleAll() {
    setSelected(allSelected ? [] : allIds)
  }

  return (
    <div className="min-h-screen bg-[#f7f7f5]">
      {/* Masthead */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 px-6 py-10 sm:px-10 sm:py-14">
        <div className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-0 w-64 h-64 rounded-full bg-teal-400/10 blur-2xl" />
        <div className="relative mx-auto max-w-7xl flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-emerald-400 mb-2">ESG · Analyst Portal</p>
            <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">Review Queue</h1>
            <p className="mt-2 text-sm text-slate-400">Approve normalized activity rows before they are locked for audit.</p>
          </div>

          {/* Bulk approve button */}
          <button
            disabled={!selected.length || bulk.isPending}
            onClick={() => bulk.mutate(selected)}
            className="inline-flex items-center gap-2 self-start sm:self-auto rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-900/40"
          >
            {bulk.isPending ? (
              <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            )}
            Bulk Approve {selected.length > 0 && `(${selected.length})`}
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10 py-8 space-y-5">

        {/* Tab bar */}
        <div className="flex items-center gap-2 flex-wrap">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setSelected([]) }}
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                tab === t.key
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <span className="text-xs">{t.icon}</span>
              {t.label}
            </button>
          ))}

          {/* Selection indicator */}
          {selected.length > 0 && (
            <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {selected.length} selected
              <button onClick={() => setSelected([])} className="ml-1 text-emerald-400 hover:text-emerald-700">✕</button>
            </span>
          )}
        </div>

        {/* Table card */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left">
                  <th className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleAll}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                  </th>
                  {['Date', 'Site', 'Scope', 'Quantity', 'Source', 'Status', 'Flags'].map(h => (
                    <th key={h} className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading
                  ? Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
                  : rows.length === 0
                  ? (
                    <tr>
                      <td colSpan={8} className="px-5 py-16 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6 text-slate-400">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z" />
                            </svg>
                          </div>
                          <p className="text-sm font-medium text-slate-500">No activities found</p>
                          <p className="text-xs text-slate-400">
                            {tab ? `No ${TABS.find(t => t.key === tab)?.label.toLowerCase()} items at the moment.` : 'Upload data to get started.'}
                          </p>
                          {!tab && (
                            <Link to="/upload" className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700">
                              Upload your first file →
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                  : rows.map((r) => (
                    <tr
                      key={r.id}
                      className={`border-t border-slate-100 transition-colors ${
                        selected.includes(r.id) ? 'bg-emerald-50/60' : 'hover:bg-slate-50/70'
                      }`}
                    >
                      <td className="px-4 py-3.5">
                        <input
                          type="checkbox"
                          checked={selected.includes(r.id)}
                          onChange={() => toggle(r.id)}
                          disabled={r.is_locked}
                          className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                        />
                      </td>
                      <td className="px-4 py-3.5 text-slate-600 whitespace-nowrap">
                        {r.activity_date
                          ? new Date(r.activity_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                          : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-4 py-3.5">
                        {r.site_code
                          ? (
                            <span className="inline-flex items-center gap-1">
                              <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-100 rounded px-1.5 py-0.5">{r.site_code}</span>
                              {r.site_name && <span className="text-slate-400 text-xs hidden lg:inline">{r.site_name}</span>}
                            </span>
                          )
                          : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                          {r.scope_label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-xs text-slate-700 whitespace-nowrap">
                        {r.quantity_normalized ?? <span className="text-slate-300">—</span>}
                        {r.quantity_normalized && <span className="text-slate-400 ml-1">{r.unit_normalized}</span>}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 whitespace-nowrap">
                          {r.source_system_label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={r.review_status} label={r.review_status_label} />
                      </td>
                      <td className="px-4 py-3.5">
                        <Link
                          to={`/review/${r.id}`}
                          className={`inline-flex items-center gap-1 text-xs font-semibold transition-colors ${
                            r.flag_reasons?.length
                              ? 'text-orange-600 hover:text-orange-700'
                              : 'text-emerald-600 hover:text-emerald-700'
                          }`}
                        >
                          {r.flag_reasons?.length ? (
                            <>
                              <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                                <path fillRule="evenodd" d="M3 2.25a.75.75 0 0 1 .75.75v.54l1.838-.46a9.75 9.75 0 0 1 6.725.738l.108.054A8.25 8.25 0 0 0 18 4.524l3.11-.732a.75.75 0 0 1 .917.81 47.784 47.784 0 0 0 .005 10.337.75.75 0 0 1-.574.812l-3.114.733a9.75 9.75 0 0 1-6.594-.77l-.108-.054a8.25 8.25 0 0 0-5.69-.625l-2.202.55V21a.75.75 0 0 1-1.5 0V3A.75.75 0 0 1 3 2.25Z" clipRule="evenodd" />
                              </svg>
                              {r.flag_reasons.length} flag{r.flag_reasons.length > 1 ? 's' : ''}
                            </>
                          ) : (
                            <>
                              View
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3 h-3">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                              </svg>
                            </>
                          )}
                        </Link>
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>

          {/* Table footer */}
          {!isLoading && rows.length > 0 && (
            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <p className="text-xs text-slate-400">
                {rows.length} {rows.length === 1 ? 'row' : 'rows'} · {selected.length} selected
              </p>
              {selected.length > 0 && (
                <button
                  onClick={() => bulk.mutate(selected)}
                  disabled={bulk.isPending}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700 disabled:opacity-50 transition-colors"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3.5 h-3.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                  Approve {selected.length} selected
                </button>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}