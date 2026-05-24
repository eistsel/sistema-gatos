import Link from "next/link"
import { usePathname } from "next/navigation"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/transactions", label: "Transacciones", icon: "💳" },
  { href: "/accounts", label: "Cuentas", icon: "🏦" },
  { href: "/budgets", label: "Presupuestos", icon: "🎯" },
  { href: "/goals", label: "Metas", icon: "⭐" },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-60 h-screen bg-white border-r border-gray-200 flex flex-col gap-1 p-4 fixed left-0 top-0">
      <div className="flex items-center gap-3 h-14 px-3 mb-2">
        <span className="text-2xl">💰</span>
        <span className="text-base font-bold text-gray-900">Mis Finanzas</span>
      </div>
      <nav className="flex flex-col gap-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 h-11 px-3 rounded-lg text-sm transition-colors ${
                isActive
                  ? "bg-emerald-50 text-emerald-700 font-medium"
                  : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              <span className="text-base">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
