import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import api, { Activity } from '../api/client'
import StatusBadge from '../components/StatusBadge'

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-start justify-between py-2.5 border-b border-slate-100 last:border-0 gap-4">
      <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400 shrink-0 pt-0.5">{label}</dt>
      <dd className="text-sm text-slate-800 text-right font-medium">{value || <span className="text-slate-300">—</span>}</dd>
    </div>
  )
}

export default function ReviewDetailPage() {
  const { id } = useParams()
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['activity', id],
    queryFn: async () => (await api.get<Activity>(`/activities/${id}/`)).data,
    enabled: !!id,
  })

  const review = useMutation({
    mutationFn: (action: string) => api.patch(`/activities/${id}/review/`, { action }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['activity', id] })
      qc.invalidateQueries({ queryKey: ['activities'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })

  if (isLoading || !data) {
    return (
      <div className="min-h-screen bg-[#f7f7f5] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
          <p className="text-sm text-slate-400">Loading activity…</p>
        </div>
      </div>
    )
  }

  const isFlagged = data.flag_reasons?.length > 0
  const isPending = review.isPending

  return (
    <div className="min-h-screen bg-[#f7f7f5]">
      {/* Masthead */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 px-6 py-10 sm:px-10 sm:py-14">
        <div className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-0 w-64 h-64 rounded-full bg-teal-400/10 blur-2xl" />
        <div className="relative mx-auto max-w-5xl">
          <Link
            to="/review"
            className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-widest uppercase text-emerald-400 hover:text-emerald-300 transition-colors mb-4"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
            Back to Queue
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-emerald-400 font-semibold uppercase tracking-widest mb-1">
                {data.source_system_label} · {data.category_label}
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight truncate">
                {data.description || data.source_row_id}
              </h1>
              <p className="mt-1 text-sm text-slate-400">{data.scope_label}</p>
            </div>
            <div className="shrink-0">
              <StatusBadge status={data.review_status} label={data.review_status_label} />
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-10 py-8 space-y-6">

        {/* Flag alert */}
        {isFlagged && (
          <div className="rounded-2xl border border-orange-200 bg-orange-50 px-6 py-5 flex gap-4">
            <div className="shrink-0 w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-orange-500">
                <path fillRule="evenodd" d="M3 2.25a.75.75 0 0 1 .75.75v.54l1.838-.46a9.75 9.75 0 0 1 6.725.738l.108.054A8.25 8.25 0 0 0 18 4.524l3.11-.732a.75.75 0 0 1 .917.81 47.784 47.784 0 0 0 .005 10.337.75.75 0 0 1-.574.812l-3.114.733a9.75 9.75 0 0 1-6.594-.77l-.108-.054a8.25 8.25 0 0 0-5.69-.625l-2.202.55V21a.75.75 0 0 1-1.5 0V3A.75.75 0 0 1 3 2.25Z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-orange-900 mb-1">Why this row was flagged</p>
              <ul className="space-y-0.5">
                {data.flag_reasons.map((f) => (
                  <li key={f} className="text-sm text-orange-700 flex items-start gap-1.5">
                    <span className="mt-1.5 w-1 h-1 rounded-full bg-orange-400 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Action buttons */}
        {!data.is_locked && (
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm px-6 py-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">Analyst decision</p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => review.mutate('approve')}
                disabled={isPending}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition-colors px-5 py-2.5 text-sm font-semibold text-white shadow-sm"
              >
                {isPending ? (
                  <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                  </svg>
                )}
                Approve & Lock
              </button>
              <button
                onClick={() => review.mutate('flag')}
                disabled={isPending}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50 transition-colors px-5 py-2.5 text-sm font-semibold text-slate-700"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-orange-500">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0 2.77-.693a9 9 0 0 1 6.208.682l.108.054a9 9 0 0 0 6.086.71l3.114-.732a48.524 48.524 0 0 1-.005-10.499l-3.11.732a9 9 0 0 1-6.085-.711l-.108-.054a9 9 0 0 0-6.208-.682L3 4.5M3 15V4.5" />
                </svg>
                Keep Flagged
              </button>
              <button
                onClick={() => review.mutate('reject')}
                disabled={isPending}
                className="inline-flex items-center gap-2 rounded-xl border border-red-200 hover:bg-red-50 disabled:opacity-50 transition-colors px-5 py-2.5 text-sm font-semibold text-red-600"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
                Reject
              </button>
            </div>
            {review.isSuccess && (
              <p className="mt-3 text-xs text-emerald-600 font-medium flex items-center gap-1.5">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3.5 h-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
                Decision saved successfully
              </p>
            )}
          </div>
        )}

        {data.is_locked && (
          <div className="rounded-2xl border border-violet-200 bg-violet-50 px-6 py-4 flex items-center gap-3">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5 text-violet-500 shrink-0">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
            <p className="text-sm font-medium text-violet-800">This activity has been locked for audit and cannot be modified.</p>
          </div>
        )}

        {/* Data panels */}
        <div className="grid gap-5 md:grid-cols-2">
          {/* Normalized fields */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-emerald-100 flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5 text-emerald-600">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z" />
                </svg>
              </div>
              <h2 className="font-semibold text-slate-800 text-sm">Normalized Fields</h2>
            </div>
            <dl className="px-6 py-2">
              <Field label="Activity Date" value={data.activity_date
                ? new Date(data.activity_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
                : null} />
              <Field label="Quantity" value={data.quantity_normalized ? `${data.quantity_normalized} ${data.unit_normalized}` : null} />
              <Field label="Amount" value={data.amount ? `${data.amount} ${data.currency}` : null} />
              <Field label="Site" value={data.site_name || data.site_code || null} />
              <Field label="Source ID" value={data.source_row_id} />
              <Field label="Source System" value={data.source_system_label} />
              <Field label="Category" value={data.category_label} />
              <Field label="Scope" value={data.scope_label} />
            </dl>
          </div>

          {/* Raw payload */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5 text-slate-500">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" />
                </svg>
              </div>
              <h2 className="font-semibold text-slate-800 text-sm">Raw Payload</h2>
            </div>
            <div className="p-4">
              <pre className="overflow-auto text-xs text-slate-600 bg-slate-50 rounded-xl p-4 max-h-64 leading-relaxed font-mono">
                {JSON.stringify(data.raw_record?.raw_payload || {}, null, 2)}
              </pre>
              {data.raw_record?.error_message && (
                <div className="mt-3 rounded-lg bg-red-50 border border-red-100 px-3 py-2">
                  <p className="text-xs font-semibold text-red-700 mb-0.5">Parse error</p>
                  <p className="text-xs text-red-600">{data.raw_record.error_message}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Audit trail */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-blue-50 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5 text-blue-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            </div>
            <h2 className="font-semibold text-slate-800 text-sm">Audit Trail</h2>
          </div>
          <div className="px-6 py-4">
            {!data.audit_events?.length ? (
              <p className="text-sm text-slate-400 text-center py-4">No audit events yet.</p>
            ) : (
              <ol className="relative border-l border-slate-200 space-y-5 ml-2">
                {data.audit_events.map((e) => (
                  <li key={e.created_at} className="ml-5">
                    <div className="absolute -left-1.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-white" />
                    <p className="text-sm font-semibold text-slate-800">{e.action}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {new Date(e.created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      {e.actor?.email && (
                        <span className="ml-1.5 text-slate-500 font-medium">by {e.actor.email}</span>
                      )}
                    </p>
                    {e.note && <p className="mt-1 text-xs text-slate-500 italic">{e.note}</p>}
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}