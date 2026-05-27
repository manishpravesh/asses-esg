import { useCallback, useState } from 'react'

export default function FileDropzone({
  onFile,
  accept = '.csv',
}: {
  onFile: (file: File) => void
  accept?: string
}) {
  const [dragging, setDragging] = useState(false)
  const [picked, setPicked] = useState<File | null>(null)

  const handleFile = useCallback(
    (file: File) => {
      setPicked(file)
      onFile(file)
    },
    [onFile],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [handleFile],
  )

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  if (picked) {
    return (
      <div className="flex items-center gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4">
        {/* File icon */}
        <div className="shrink-0 w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5 text-emerald-600">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-emerald-800 truncate">{picked.name}</p>
          <p className="text-xs text-emerald-600 mt-0.5">{formatSize(picked.size)}</p>
        </div>
        {/* Replace button */}
        <label className="shrink-0 cursor-pointer inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-white hover:bg-emerald-50 transition-colors px-3 py-1.5 text-xs font-semibold text-emerald-700">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
          Replace
          <input
            type="file"
            accept={accept}
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
        </label>
      </div>
    )
  }

  return (
    <label
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={`group relative flex cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-all duration-200 ${
        dragging
          ? 'border-emerald-500 bg-emerald-50 scale-[1.01]'
          : 'border-slate-200 bg-slate-50/50 hover:border-emerald-400 hover:bg-emerald-50/40'
      }`}
    >
      {/* Upload icon */}
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors duration-200 ${
        dragging ? 'bg-emerald-100' : 'bg-white border border-slate-200 group-hover:border-emerald-200 group-hover:bg-emerald-50'
      }`}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={`w-7 h-7 transition-colors duration-200 ${dragging ? 'text-emerald-500' : 'text-slate-400 group-hover:text-emerald-500'}`}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
        </svg>
      </div>

      <div>
        {dragging ? (
          <p className="text-sm font-semibold text-emerald-600">Drop to upload</p>
        ) : (
          <>
            <p className="text-sm font-semibold text-slate-700">
              Drop your file here, or{' '}
              <span className="text-emerald-600 group-hover:text-emerald-700 underline underline-offset-2">browse</span>
            </p>
            <p className="mt-1 text-xs text-slate-400">Accepts <span className="font-mono font-medium text-slate-500">{accept}</span> files</p>
          </>
        )}
      </div>

      <input
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
    </label>
  )
}