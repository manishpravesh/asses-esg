import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import api, { BatchResult } from '../api/client'
import FileDropzone from '../components/FileDropzone'
import StatusBadge from '../components/StatusBadge'

const SOURCES = [
  { value: 'sap_procurement', label: 'SAP Procurement (ME2N)', icon: '🏭', desc: 'Purchase order exports from SAP ME2N transaction' },
  { value: 'sap_fuel', label: 'SAP Fuel (MB51)', icon: '⛽', desc: 'Fuel consumption from SAP MB51 material document list' },
  { value: 'utility', label: 'Utility Electricity', icon: '⚡', desc: 'Electricity usage from utility portal CSV exports' },
  { value: 'travel', label: 'Corporate Travel', icon: '✈️', desc: 'Flight and hotel data from corporate travel platform' },
]

export default function UploadPage() {
  const [sourceType, setSourceType] = useState('sap_procurement')
  const [result, setResult] = useState<BatchResult | null>(null)

  const mutation = useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData()
      form.append('file', file)
      form.append('source_type', sourceType)
      return (await api.post<BatchResult>('/batches/upload/', form)).data
    },
    onSuccess: (data) => setResult(data),
  })

  const selected = SOURCES.find(s => s.value === sourceType)!

  return (
    <div className="min-h-screen bg-[#f7f7f5]">
      {/* Masthead */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 px-6 py-10 sm:px-10 sm:py-14">
        <div className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-0 w-64 h-64 rounded-full bg-teal-400/10 blur-2xl" />
        <div className="relative mx-auto max-w-3xl">
          <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-widest uppercase text-emerald-400 hover:text-emerald-300 transition-colors mb-4">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
            Back to Dashboard
          </Link>
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">Upload Data</h1>
          <p className="mt-2 text-sm text-slate-400">Import a CSV export from SAP, utility portal, or travel platform.</p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8 space-y-6">

        {/* Source type selector */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800 text-sm">1. Select data source</h2>
            <p className="text-xs text-slate-400 mt-0.5">Choose the system this CSV was exported from</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4">
            {SOURCES.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => setSourceType(s.value)}
                className={`relative text-left rounded-xl border-2 p-4 transition-all duration-150 ${
                  sourceType === s.value
                    ? 'border-emerald-500 bg-emerald-50 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl leading-none mt-0.5">{s.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold ${sourceType === s.value ? 'text-emerald-800' : 'text-slate-700'}`}>
                      {s.label}
                    </p>
                    <p className={`text-xs mt-0.5 leading-relaxed ${sourceType === s.value ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {s.desc}
                    </p>
                  </div>
                  {sourceType === s.value && (
                    <div className="shrink-0 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                      <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} className="w-3 h-3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* File drop */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800 text-sm">2. Upload CSV file</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Drop your <span className="font-medium text-slate-500">{selected.label}</span> export here
            </p>
          </div>
          <div className="p-4">
            <FileDropzone onFile={(file) => mutation.mutate(file)} />
          </div>
        </div>

        {/* Processing state */}
        {mutation.isPending && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-6 py-5 flex items-center gap-4">
            <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin shrink-0" />
            <div>
              <p className="text-sm font-semibold text-emerald-800">Processing upload…</p>
              <p className="text-xs text-emerald-600 mt-0.5">Parsing rows, validating schema, flagging anomalies</p>
            </div>
          </div>
        )}

        {/* Error state */}
        {mutation.isError && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-5 flex items-start gap-4">
            <div className="shrink-0 w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-red-600">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-red-800">Upload failed</p>
              <p className="text-xs text-red-600 mt-0.5">Check that your CSV matches the expected format for <span className="font-medium">{selected.label}</span> and try again.</p>
            </div>
          </div>
        )}

        {/* Success result */}
        {result && (
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{result.filename}</p>
                  <p className="text-xs text-emerald-100">Upload complete</p>
                </div>
              </div>
              <StatusBadge status={result.status} />
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100">
              <div className="px-5 py-4 text-center">
                <p className="text-2xl font-bold text-emerald-600">{result.success_count.toLocaleString()}</p>
                <p className="text-xs text-slate-400 mt-0.5 font-medium uppercase tracking-wider">Parsed</p>
              </div>
              <div className="px-5 py-4 text-center">
                <p className={`text-2xl font-bold ${result.error_count > 0 ? 'text-red-500' : 'text-slate-300'}`}>
                  {result.error_count.toLocaleString()}
                </p>
                <p className="text-xs text-slate-400 mt-0.5 font-medium uppercase tracking-wider">Errors</p>
              </div>
              <div className="px-5 py-4 text-center">
                <p className={`text-2xl font-bold ${result.flagged_count > 0 ? 'text-orange-500' : 'text-slate-300'}`}>
                  {result.flagged_count.toLocaleString()}
                </p>
                <p className="text-xs text-slate-400 mt-0.5 font-medium uppercase tracking-wider">Flagged</p>
              </div>
            </div>

            {/* Errors list */}
            {result.error_summary?.length > 0 && (
              <div className="px-6 py-4 border-b border-slate-100">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Parse errors (first 5)</p>
                <ul className="space-y-1.5">
                  {result.error_summary.slice(0, 5).map((e, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-red-700">
                      <span className="shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-100 text-red-600 text-[10px] font-bold mt-0.5">
                        {e.row ?? '!'}
                      </span>
                      {e.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="px-6 py-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => { setResult(null); mutation.reset() }}
                className="text-xs text-slate-400 hover:text-slate-600 transition-colors font-medium"
              >
                Upload another file
              </button>
              <Link
                to="/review"
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 transition-colors px-4 py-2 text-sm font-semibold text-white"
              >
                Go to review queue
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}