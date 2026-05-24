import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function LoginPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-[420px] bg-white rounded-2xl border border-gray-200 p-10 flex flex-col gap-6 shadow-sm">
        <div className="text-center space-y-2">
          <div className="text-5xl">💰</div>
          <h1 className="text-2xl font-bold text-gray-900">Mis Finanzas</h1>
          <p className="text-sm text-gray-500">Tu dinero, total claridad</p>
        </div>
        <div className="h-px bg-gray-200" />
        <div className="flex flex-col gap-3">
          <OAuthButton provider="google" label="Continuar con Google" />
          <OAuthButton provider="github" label="Continuar con GitHub" />
        </div>
        <p className="text-[11px] text-gray-500 text-center">
          Tus datos están seguros. Nunca compartimos tu información.
        </p>
      </div>
    </div>
  )
}

function OAuthButton({ provider, label }: { provider: "google" | "github"; label: string }) {
  return (
    <form action={`/auth/callback?provider=${provider}`} method="POST">
      <button
        type="submit"
        className="w-full h-12 flex items-center justify-center gap-3 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-900 hover:bg-gray-50 transition-colors"
      >
        {provider === "google" ? (
          <span className="text-xl font-bold text-blue-500">G</span>
        ) : (
          <span className="text-xl">⬛</span>
        )}
        {label}
      </button>
    </form>
  )
}
