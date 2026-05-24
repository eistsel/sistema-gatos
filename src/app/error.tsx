"use client"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="text-5xl">😕</div>
        <h2 className="text-lg font-semibold text-gray-900">Algo salió mal</h2>
        <p className="text-sm text-gray-500 max-w-md">
          {error.message || "Ocurrió un error inesperado. Intenta de nuevo."}
        </p>
        <button
          onClick={reset}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700"
        >
          Intentar de nuevo
        </button>
      </div>
    </div>
  )
}
