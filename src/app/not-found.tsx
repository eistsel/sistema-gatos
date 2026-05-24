import Link from "next/link"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="text-6xl">🔍</div>
        <h2 className="text-lg font-semibold text-gray-900">Página no encontrada</h2>
        <p className="text-sm text-gray-500">La página que buscas no existe.</p>
        <Link
          href="/dashboard"
          className="inline-block px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700"
        >
          Volver al dashboard
        </Link>
      </div>
    </div>
  )
}
